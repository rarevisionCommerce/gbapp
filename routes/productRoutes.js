const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { upload } = require("../helpers/fileHelper");

router
  .post(
    "/",
    upload.fields([
      { name: "thumbNail", maxCount: 1 },
      { name: "screenshots", maxCount: 10 },
    ]),
    productController.addProduct
  )
  .patch(
    "/edit/:productId",
    upload.fields([
      { name: "thumbNail", maxCount: 1 },
      { name: "screenshots", maxCount: 10 },
    ]),
    productController.editProduct
  )
  .get("/client", productController.getProductClient)
  .get("/one/:productId", productController.getProductById)
  .post("/review", productController.sendProductReview)
  .get("/review/:productId", productController.getProductReviews)
  .patch("/screenshots", productController.editScreenShots)
  .delete("/:productId", productController.deleteProductById);

module.exports = router;
