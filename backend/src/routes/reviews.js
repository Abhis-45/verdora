import express from "express";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";
import upload from "../middleware/multerConfig.js";
import { uploadToCloudinary } from "../services/cloudinaryService.js";

const router = express.Router();

const resolveProduct = async (productId) => {
  if (!productId) return null;

  return (
    (await Product.findById(productId).catch(() => null)) ||
    (await Product.findOne({ id: productId }).catch(() => null))
  );
};

const matchesReviewedProduct = (item = {}, product) => {
  const productMongoId = product?._id?.toString?.() || "";
  const itemId = item?.id?.toString?.() || item?.productId?.toString?.() || "";
  return itemId === productMongoId;
};

router.post(
  "/upload-images",
  authMiddleware,
  upload.array("images", 4),
  async (req, res) => {
    try {
      const files = Array.isArray(req.files) ? req.files : [];
      if (!files.length) {
        return res.status(400).json({ message: "No image files provided" });
      }

      const uploadedImages = [];
      for (const file of files) {
        const result = await uploadToCloudinary(file.buffer, file.originalname);
        uploadedImages.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }

      res.json({
        message: "Images uploaded successfully",
        images: uploadedImages,
      });
    } catch (err) {
      res.status(500).json({
        message: "Failed to upload review images",
        error: err.message,
      });
    }
  },
);

// GET all reviews for a product (public)
router.get("/product/:productId", async (req, res) => {
  try {
    const product = await resolveProduct(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const reviews = await Review.find({ productId: product._id }).sort({
      createdAt: -1,
    });
    res.json(reviews);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch reviews", error: err.message });
  }
});

// GET product review stats (public)
router.get("/product/:productId/stats", async (req, res) => {
  try {
    const product = await resolveProduct(req.params.productId);
    if (!product) {
      return res.json({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {},
      });
    }

    const reviews = await Review.find({ productId: product._id });
    if (reviews.length === 0) {
      return res.json({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {},
      });
    }

    const averageRating = Number(
      (
        reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      ).toFixed(1),
    );
    const ratingDistribution = {};

    for (let index = 1; index <= 5; index += 1) {
      ratingDistribution[index] = reviews.filter(
        (review) => review.rating === index,
      ).length;
    }

    res.json({
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch stats", error: err.message });
  }
});

// ADD review (authenticated user only, delivered buyer only)
router.post("/", authMiddleware, async (req, res) => {
  const { productId, rating, title, comment, orderId, orderItemId, images } =
    req.body;

  if (!productId || !rating || rating < 1 || rating > 5) {
    return res
      .status(400)
      .json({ message: "Product ID and rating (1-5) required" });
  }

  try {
    const product = await resolveProduct(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let reviewableOrder = null;
    let reviewableItem = null;

    if (orderId && orderItemId) {
      const selectedOrder = user.orders.id(orderId);
      const selectedItem = selectedOrder?.items?.id(orderItemId);

      if (
        selectedOrder &&
        selectedItem &&
        matchesReviewedProduct(selectedItem, product) &&
        (selectedItem.status || selectedOrder.status) === "delivered"
      ) {
        reviewableOrder = selectedOrder;
        reviewableItem = selectedItem;
      }
    }

    if (!reviewableItem) {
      user.orders?.some((order) =>
        order.items?.some((item) => {
          const isDelivered = (item.status || order.status) === "delivered";
          const matched = matchesReviewedProduct(item, product);
          if (isDelivered && matched && !item.reviewSubmitted) {
            reviewableOrder = order;
            reviewableItem = item;
            return true;
          }
          return false;
        }),
      );
    }

    if (!reviewableItem || !reviewableOrder) {
      return res.status(403).json({
        message: "Only customers with delivered orders can leave reviews",
      });
    }

    if (reviewableItem.reviewSubmitted) {
      return res.status(400).json({
        message: "You already reviewed this delivered item",
      });
    }

    let existingReview = null;
    if (reviewableItem?._id) {
      existingReview = await Review.findOne({
        orderItemId: reviewableItem._id,
      });
    } else if (reviewableOrder?._id) {
      existingReview = await Review.findOne({
        productId: product._id,
        userId: req.userId,
        orderId: reviewableOrder._id,
      });
    }

    if (existingReview) {
      return res.status(400).json({
        message: "You already reviewed this order item",
      });
    }

    const review = new Review({
      productId: product._id,
      userId: req.userId,
      orderId: reviewableOrder?._id || orderId || null,
      orderItemId: reviewableItem?._id || orderItemId || null,
      userName: user.name || "Anonymous",
      rating,
      title,
      comment,
      images: Array.isArray(images)
        ? images
            .filter((image) => image?.url)
            .map((image) => ({
              url: String(image.url).trim(),
              publicId: String(image.publicId || "").trim(),
            }))
        : [],
      verified: true,
    });

    await review.save();

    reviewableItem.reviewSubmitted = true;
    reviewableItem.reviewId = review._id;
    reviewableItem.reviewedAt = new Date();
    await user.save();

    res.status(201).json({
      message: "Review added successfully",
      review,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to add review", error: err.message });
  }
});

// UPDATE review (user can only update their own)
router.patch("/:reviewId", authMiddleware, async (req, res) => {
  const { rating, title, comment } = req.body;

  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.userId.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "You can only update your own review" });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "Rating must be 1-5" });
    }

    if (rating) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;
    review.updatedAt = new Date();

    await review.save();
    res.json({
      message: "Review updated successfully",
      review,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update review", error: err.message });
  }
});

// DELETE review (user can delete their own)
router.delete("/:reviewId", authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.userId.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "You can only delete your own review" });
    }

    await Review.findByIdAndDelete(req.params.reviewId);
    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete review", error: err.message });
  }
});

export default router;
