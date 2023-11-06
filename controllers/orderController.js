const Order = require("../models/Order");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const getMyOrders = async (req, res) => {
  const { userId } = req.params;

  if (!userId) return res.status(400).json({ message: "User id is required" });

  try {
    const orders = await Order.find({ userId: userId })
      .lean()
      .exec();

    if (!orders.length)
      return res.status(200).json({ message: "You have no subscriptions" });

    res.status(200).json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!!" });
  }
};


const getMyOrdersProductIds = async (req, res) => {
  const { userId } = req.params;

  if (!userId) return res.status(400).json({ message: "User id is required" });

  try {
    const orders = await Order.find({ userId: userId })
      .lean()
      .exec();

    res.status(200).json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!!" });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: 'userId',
        select: 'userName email', 
      })
    .lean().exec();

    if (!orders.length) {
      return res.status(200).json({ message: "No orders found!" });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong!" });
  }
};


const markOrderAsPaid = async (req, res) => {
  const { orderId, paymentDate } = req.body;

  if (!orderId || !paymentDate) return res.status(400).json({ message: "All fields are required" });

  try {
    const order = await Order.findById(orderId).exec();

    if (!order) return res.status(400).json({ message: "No Subscription found!" });

    order.isPaid = true;
    order.paymentDate = paymentDate;

    await order.save();
    
    res.status(200).json({message: "Subscription updated successfully!"});
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!!" });
  }
};

const placeOrder = async (req, res) => {
  const { userId, package, amount, websiteUrl } = req.body;

  if (!userId || !package || !amount) return res.status(400).json({ message: "All fields are required" });

  try {
    const orderObj = {
      userId,
      package,
      amount,
      websiteUrl,
    }

    const newOrder = await Order.create(orderObj)

    if (!newOrder) res.status(400).json({ message: "Failed subscription not created!" });

    res.status(201).json({ message: `Subscription created successfully!` });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: `Something went wrong!!` });

  }

}


const paySubscription = async (req, res) => {
  const { amount, email,  } = req.body;
  if (!amount || !email)
    return res.status(400).json({ message: "All fields are required" });
  try {
    const stripeSessionUrl = await createStripeSession(

      amount,
      email,
    );

    if (stripeSessionUrl === 0)
      return res.status(400).json({ message: "Something went wrong!" });

    res.json({ url: stripeSessionUrl.url });
  } catch (error) {
    console.log(error);
  }
};


const createStripeSession = async (amount, email) => {
  try {
    const customer = await stripe.customers.create({
      metadata: {
        email: email,
        amount: amount,
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
      success_url: `${process.env.CLIENT_DOMAIN}/success`,
      cancel_url: `${process.env.CLIENT_DOMAIN}/cancel`,
    });

    return { url: session.url };
  } catch (error) {
    console.log(error);
    return 0;
  }
};



module.exports = {
  getMyOrders,
  getMyOrdersProductIds,
  placeOrder,
  paySubscription,
  markOrderAsPaid,
  getAllOrders
}
