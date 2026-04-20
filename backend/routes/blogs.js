const express = require("express");
const router = express.Router();
const multer = require("multer");

const authMiddleware = require("../middleware/auth");

const {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  getStats,
} = require("../controllers/blogController");

// 🔥 NEW: scraper controllers
const {
  createScrapedBlog,
  getScrapedBlogs,
  publishScrapedBlog,
} = require("../controllers/scraperController");


// ================= MULTER CONFIG ================= //

// ✅ Use memory storage (Cloudinary upload later)
const storage = multer.memoryStorage();

// ✅ File filter
const fileFilter = (req, file, cb) => {
  if (!file) return cb(null, true);

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// ✅ Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ✅ Custom wrapper for error handling
const uploadSingleImage = (req, res, next) => {
  const handler = upload.single("image");

  handler(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Image must be under 5MB",
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message || "Upload error",
      });
    }

    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Only image files are allowed",
      });
    }

    next();
  });
};


// ================= ROUTES ================= //

// 🔓 Public Routes
router.get("/", getBlogs);

// 🔐 Protected Routes
router.get("/stats", authMiddleware, getStats);

// ================= SCRAPER ROUTES ================= //

// 🔓 Scraper pushes data (you can secure later with API key)
router.post("/scraped", createScrapedBlog);

// 🔐 Admin: get all scraped drafts
router.get("/admin/scraped", authMiddleware, getScrapedBlogs);

// 🔐 Publish scraped blog
router.put("/publish/:id", authMiddleware, publishScrapedBlog);

// ================= MANUAL BLOG ROUTES ================= //

router.post(
  "/",
  authMiddleware,
  uploadSingleImage,
  createBlog
);

router.put(
  "/:id",
  authMiddleware,
  uploadSingleImage,
  updateBlog
);

router.delete("/:id", authMiddleware, deleteBlog);

// ⚠️ KEEP THIS LAST (VERY IMPORTANT)
router.get("/:id", getBlog);


module.exports = router;