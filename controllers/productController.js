const { RequestContactExportCustomContactFilter } = require("sib-api-v3-sdk");
const Product = require("../models/Product");
const Review = require("../models/Review");
const fs = require("fs");
const path = require("path"); // For handling paths

const addProduct = async (req, res) => {
  const {
    sellerId,
    name,
    description,
    category,
    price,
    lastUpdated,
    released,
    operatingSystem,
    documentation,
    tagz,
    technologies,
    fileLink,
  } = req.body;

  if (
    !sellerId ||
    !name ||
    !description ||
    !category ||
    !price ||
    !lastUpdated ||
    !released ||
    !operatingSystem ||
    !documentation ||
    !tagz ||
    !technologies ||
    !req.files.screenshots ||
    !req.files.thumbNail ||
    !fileLink
  )
    return res.status(400).json({ message: "All fields are required" });

  try {
    let screenshotsArray = [];

    if (req.files.screenshots) {
      req.files.screenshots.forEach((element) => {
        const file = {
          filePath: `${process.env.API_DOMAIN}/${element.path}`,
        };
        screenshotsArray.push(file);
      });
    }

    req.body.screenshots = screenshotsArray;
    req.body.thumbNail = `${process.env.API_DOMAIN}/${req.files.thumbNail[0].path}`;

    const tagsArray = tagz.split(",").map((item) => item.trim()) || [];
    const techArray = technologies.split(",").map((item) => item.trim()) || [];

    req.body.tags = tagsArray;
    req.body.technology = techArray;

    const product = await Product.create(req.body);
    if (!product)
      return res.status(400).json({ message: "Invalid product data" });
    res.status(201).json({ message: "Product added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!!" });
  }
};

const getProductClient = async (req, res) => {
  const page = req?.query?.page || 1;
  const perPage = req?.query?.perPage || 20;
  const skip = (page - 1) * parseInt(perPage);
  const { minPrice, maxPrice, tags, category } = req?.query;

  const filters = {
    category: { $regex: category, $options: "i" },
    price: { $gte: minPrice || 0, $lte: maxPrice || 1000 },
  };

  try {
    if (
      JSON.parse(tags) &&
      Array.isArray(JSON.parse(tags)) &&
      JSON.parse(tags).length > 0
    ) {
      filters.tags = { $in: JSON.parse(tags) };
    }

    const [products, count] = await Promise.all([
      Product.find(filters)
        .select("-fileLink")
        .limit(parseInt(perPage))
        .skip(skip)
        .lean()
        .exec(),
      Product.countDocuments(filters),
    ]);

    if (!products?.length) {
      return res.status(200).json({ message: "No products found" });
    }

    res.json({ products, count });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error getting products" });
  }
};

const getProductById = async (req, res) => {
  const { productId } = req.params;

  if (!productId)
    return res.status(400).json({ message: "Produvt id is required" });

  try {
    const product = await Product.findById(productId).exec();
    if (!product)
      return res.status(500).json({ message: "No product found with that id" });

    product.views += 1;
    await product.save();

    res.status(200).json(product);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!!" });
  }
};

const sendProductReview = async (req, res) => {
  const { productId, review, rating } = req.body;
  if (!productId || !review || !rating)
    return res.status(400).json({ message: "All fields are required" });

  try {
    let [product, theReview] = await Promise.all([
      Product.findById(productId).exec(),
      Review.findOne({ productId: productId }).exec(),
    ]);

    if (!product) return res.status(404).json({ message: "No product found" });

    if (!theReview) {
      theReview = new Review({
        productId: productId,
        reviews: [
          {
            review: review,
            rating: rating,
            date: new Date(),
          },
        ],
      });
    } else {
      theReview.reviews.push({
        review: review,
        rating: rating,
        date: new Date(),
      });
    }

    product.reviews += 1;
    product.rating = (product.rating + parseInt(rating)) / 2;

    await Promise.all([product.save(), theReview.save()]);

    res.status(200).json({ message: "Review sent" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!!" });
  }
};

const getProductReviews = async (req, res) => {
  const { productId } = req.params;

  if (!productId)
    return res.status(400).json({ message: "Product id is required" });

  try {
    const review = await Review.findOne({ productId: productId }).lean().exec();
    if (!review)
      return res.status(200).json({ message: "No review for this product" });

    review.reviews.sort((a, b) => b.date - a.date);

    res.status(200).json(review);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!!" });
  }
};

const editProduct = async (req, res) => {
  const {
    productId,
    name,
    description,
    category,
    price,
    lastUpdated,
    released,
    operatingSystem,
    documentation,
    tagz,
    technologies,
    fileLink,
    status,
  } = req.body;


  if (
    !productId ||
    !name ||
    !description ||
    !category ||
    !price ||
    !lastUpdated ||
    !released ||
    !operatingSystem ||
    !documentation ||
    !tagz ||
    !technologies ||
    !fileLink
  )
    return res.status(400).json({ message: "All fields are required" });

  try {
    const product = await Product.findById(productId).exec();

    if (!product)
      return res.status(500).json({ message: "product id is required" });

    product.name = name;
    product.description = description;
    product.category = category;
    product.price = price;
    product.lastUpdated = lastUpdated;
    product.released = released;
    product.operatingSystem = operatingSystem;
    product.documentation = documentation;
    product.technology =
      technologies.split(",").map((item) => item.trim()) || [];
    product.fileLink = fileLink;
    product.status = status || "";
    product.tags = tagz.split(",").map((item) => item.trim()) || [];

    if (req.files.thumbNail) {
      product.thumbNail = `${process.env.API_DOMAIN}/${req.files.thumbNail[0].path}`;
    }

    if (req.files.screenshots) {
      req.files.screenshots.forEach((element) => {
        const file = {
          filePath: `${process.env.API_DOMAIN}/${element.path}`,
        };
        product.screenshots.push(file);
      });
    }

    await product.save();

    res.status(200).json({ message: "Product updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!!" });
  }
};

const editScreenShots = async (req, res) => {
  const { productId, screenshotId } = req.body;

  if (!productId || !screenshotId)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const product = await Product.findById(productId).exec();

    if (!product)
      return res.status(500).json({ message: "product id is required" });

    const screenshotIndex = product.screenshots.findIndex(
      (screenshot) => screenshot._id.toString() === screenshotId
    );

    if (screenshotIndex === -1)
      return res.status(404).json({ message: "screenshot not found" });

    // const fileName =
    //   product?.screenshots[screenshotIndex]?.filePath?.split("uploads/")[1];
    // const filePath = path.join(__dirname, "uploads", fileName);

    // fs.unlink(filePath, (err) => {
    //   if (err) {
    //     console.error(err);
    // res.status(500).send('Error deleting the file');
    //   } else {
    //     console.log("File deleted successfully");
    //   }
    // });

    product.screenshots.splice(screenshotIndex, 1);

    await product.save();

    res.status(200).json({ message: "Screenshot deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!!" });
  }
};

const deleteProductById = async (req, res) => {
  const { productId } = req.params;

  if (!productId)
    return res.status(400).json({ message: "Product id is required" });

  try {
    await Product.findByIdAndDelete(productId).exec();

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!!" });
  }
};

module.exports = {
  addProduct,
  getProductClient,
  getProductById,
  sendProductReview,
  getProductReviews,
  editProduct,
  editScreenShots,
  deleteProductById,
};
