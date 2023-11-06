const Cart = require("../models/Cart");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Client = require("../models/Client");
const Payment = require("../models/Payment");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { sendEmail } = require("../services/emailService");
const { confirmPurchaseTemplate } = require("../services/confirmPurchase");


const DOMAIN = "https://aviondigital.co.ke";

const addToCart = async (req, res) => {
  const { productId, userId } = req.body;

  try {
    if (!productId || !userId) {
      return res.status(400).send({ message: "All fields are required" });
    }

    const product = await Product.findById(productId).exec();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const cart = await Cart.findOne({ userId: userId });
    if (!cart) {
      await Cart.create({
        userId: userId,
        products: [
          {
            productId: productId,
          },
        ],
      });
      return res.status(200).json({ message: "Item added to cart" });
    }

    const productIndex = cart.products.findIndex(
      (product) => product.productId.toString() === productId
    );

    if (productIndex !== -1)
      return res.status(400).json({ message: "Product already added to cart" });

    cart.products.push({
      productId: productId,
    });
    await cart.save();
    res.status(200).json({ message: "Item added to cart" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong, if the problem persists contact support",
    });
  }
};

const getCartByUserId = async (req, res) => {
  const userId = req.params.userId;
  if (!userId) return res.status(400).json({ messsage: "User Id is required" });

  try {
    const [cart] = await Promise.all([Cart.findOne({ userId: userId }).exec()]);

    if (!cart) {
      const emCart = [];
      return res.status(404).json({ cart: emCart });
    }

    let availableProducts = [];

    await Promise.all(
      cart.products.map(async (item, index) => {
        let product;

        product = await Product.findById(item.productId)
          .select("thumbNail price name")
          .lean()
          .exec();

        if (!product) return;

        availableProducts.push(product);
      })
    );

    res.status(200).json({ cart: availableProducts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong!!" });
  }
};

const deleteProductFromCart = async (req, res) => {
  const { userId, productId } = req.params;
  console.log("product", productId);
  console.log("user", userId);
  if (!userId || !productId)
    return res.status(400).json({ messsage: "All fields are required" });

  try {
    const cart = await Cart.findOne({ userId: userId }).exec();
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find the index of the product by productId
    const productIndex = cart.products.findIndex(
      (product) => product.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Remove the product from the products array
    cart.products.splice(productIndex, 1);

    // Save the updated cart
    await cart.save();

    res.status(200).json({ message: "Item removed" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const deleteCartProducts = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find the cart by userId
    const cart = await Cart.findOne({ userId: userId }).exec();
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Clear all products from the products array
    cart.products = [];

    // Save the updated cart
    await cart.save();

    res.status(200).json({ message: "Cart cleared" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const createStripeSession = async (userId, amount) => {
  try {
    const customer = await stripe.customers.create({
      metadata: {
        userId: userId,
      },
    });
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Service",
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer: customer.id,
      success_url: `${DOMAIN}/success`,
      cancel_url: `${DOMAIN}/cancel`,
    });

    return { url: session.url };
  } catch (error) {
    console.log(error);
    return 0;
  }
};

const checkoutCart = async (req, res) => {
  const userId = req.params.userId;
  if (!userId) return res.status(400).json({ messsage: "User Id is required" });

  try {
    const [cart] = await Promise.all([Cart.findOne({ userId: userId }).exec()]);

    if (!cart) return res.status(404).json({ message: "Your cart is empty" });

    let totalAmount = 0;

    await Promise.all(
      cart.products.map(async (item, index) => {
        let product;

        product = await Product.findById(item.productId)
          .select("price")
          .lean()
          .exec();

        if (!product) return;

        totalAmount += parseFloat(product.price);
      })
    );

    if (totalAmount < 1)
      return res
        .status(400)
        .json({ message: "Error, Contact us if this error persists" });

    const stripeSessionUrl = await createStripeSession(userId, totalAmount);

    if (stripeSessionUrl === 0)
      return res.status(400).json({ message: "Something went wrong!" });

    res.status(200).json({ url: stripeSessionUrl.url });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret =
    "whsec_5d1d724063f88514e43eae3cda6e0058d90a998a899e94bb4655ef11508588cb";

  let event;

  const data = req.body.data.object;

  try {
    const eventType = req.body.type;
    if (eventType === "checkout.session.completed") {
      stripe.customers
        .retrieve(data.customer)
        .then(async (customer) => {
          const userId = customer.metadata.userId;

          // confirm cart
          const [cart, paymentDuplicate] = await Promise.all([
            Cart.findOne({ userId: userId }).exec(),
            Payment.findOne({ stripeCode: data.customer }),
          ]);

          if (paymentDuplicate) return res.status(409);

          if (!cart || !cart.products.length) return res.status(409);

          let productLinkArray = [];

          await Promise.all(
            cart.products.map(async (item, index) => {
              await Order.create({
                userId: userId,
                productId: item.productId,
              });
             let product = await Product.findById(item.productId).exec();
             product.sales +=1;
             await product.save();

             productLinkArray.push({
              filePath: product.fileLink,
              name: product.name
             });
            })
          );

          const client = await Client.findById(userId).exec();


          const formattedLinks = productLinkArray.map(obj => `<a href="${obj.filePath}">${obj.name}</a>`).join('<br>\n');
          const receiver = [
            {
              email: client.email,
            },
          ];


          await sendEmail("Thank You for Your Purchase.", receiver, confirmPurchaseTemplate(formattedLinks))





          cart.products = [];

          await Promise.all([
            cart.save(),
            Payment.create({
              userId: userId,
              amount: data.amount_total / 100,
              stripeCode: data.customer,
            }),
          ]);

          return res.status(200);
        })
        .catch((err) => console.log(err));
    }
  } catch (error) {
    console.log("webhook error", error);
  }
  // Return a 200 response to acknowledge receipt of the event
  res.send().end();
};

module.exports = {
  addToCart,
  getCartByUserId,
  deleteProductFromCart,
  deleteCartProducts,
  checkoutCart,
  stripeWebhook,
};
