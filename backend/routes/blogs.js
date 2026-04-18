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

// ✅ Use memory storage (we'll send buffer to Cloudinary)
const storage = multer.memoryStorage();

// ✅ File filter (only images allowed)
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

// ✅ Multer config
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ✅ Custom middleware for better error handling
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
router.get("/:id", getBlog);

// 🔐 Protected Routes
router.get("/stats", authMiddleware, getStats);

router.post(
  "/",
  authMiddleware,
  uploadSingleImage,   // ✅ handles file
  createBlog           // ✅ uploads to Cloudinary inside controller
);

router.put(
  "/:id",
  authMiddleware,
  uploadSingleImage,
  updateBlog
);

router.delete("/:id", authMiddleware, deleteBlog);

module.exports = router;