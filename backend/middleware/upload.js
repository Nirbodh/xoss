// middleware/upload.js - FILE UPLOAD MIDDLEWARE WITH MULTER
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 1 // Only one file
  },
  fileFilter: fileFilter
});

// Middleware to handle file upload errors
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File is too large. Maximum size is 5MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 1 file allowed'
      });
    }
  } else if (err) {
    // Other errors
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error'
    });
  }
  next();
};

// Specific upload configurations
const uploadSingle = (fieldName) => {
  return [upload.single(fieldName), handleUploadErrors];
};

const uploadMultiple = (fieldName, maxCount) => {
  return [upload.array(fieldName, maxCount || 10), handleUploadErrors];
};

// For different file types
const uploadConfigs = {
  // Avatar upload
  avatar: uploadSingle('avatar'),
  
  // Match images upload
  matchImages: uploadMultiple('images', 5),
  
  // Tournament banner
  banner: uploadSingle('banner'),
  
  // Game screenshots
  screenshots: uploadMultiple('screenshots', 10),
  
  // Document upload
  documents: multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'uploads/documents/');
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'doc-' + uniqueSuffix + ext);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(pdf|PDF|doc|DOC|docx|DOCX|txt|TXT)$/)) {
        return cb(new Error('Only document files are allowed!'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB for documents
    }
  }).single('document')
};

// Serve static files
const serveStatic = (req, res, next) => {
  const filePath = path.join(__dirname, '..', req.url);
  
  // Check if file exists and is within uploads directory
  if (req.url.startsWith('/uploads/') && fs.existsSync(filePath)) {
    // Get file extension
    const ext = path.extname(filePath).toLowerCase();
    
    // Set appropriate content type
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } else {
    next();
  }
};

// Utility function to delete uploaded file
const deleteFile = (filePath) => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (fs.existsSync(fullPath) && fullPath.includes(uploadDir)) {
    fs.unlink(fullPath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
      }
    });
  }
};

// Clean up old files (cron job function)
const cleanupOldFiles = (daysOld = 30) => {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  
  const walkDir = (dir) => {
    fs.readdir(dir, (err, files) => {
      if (err) return;
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        
        fs.stat(filePath, (err, stats) => {
          if (err) return;
          
          if (stats.isDirectory()) {
            walkDir(filePath);
          } else if (stats.mtime < cutoffDate) {
            // Delete files older than specified days
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error('Error deleting old file:', err);
              } else {
                console.log(`Deleted old file: ${filePath}`);
              }
            });
          }
        });
      });
    });
  };
  
  walkDir(uploadDir);
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadConfigs,
  serveStatic,
  deleteFile,
  cleanupOldFiles
};
