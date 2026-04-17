const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  getStats,
} = require('../controllers/blogController');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!file) {
    return cb(null, true);
  }

  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Only JPG, JPEG, PNG, WEBP, and GIF image files are allowed'),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadSingleImage = (req, res, next) => {
  const handler = upload.single('image');

  handler(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Image must be under 5MB',
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message || 'Upload error',
      });
    }

    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Only image files are allowed',
      });
    }

    next();
  });
};

// Public routes
router.get('/', getBlogs);
router.get('/stats', authMiddleware, getStats);
router.get('/:id', getBlog);

// Protected routes
router.post('/', authMiddleware, uploadSingleImage, createBlog);
router.put('/:id', authMiddleware, uploadSingleImage, updateBlog);
router.delete('/:id', authMiddleware, deleteBlog);

module.exports = router;