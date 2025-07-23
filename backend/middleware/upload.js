const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = ['uploads', 'uploads/avatars', 'uploads/tasks'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

// Configure storage for task files
const taskFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/tasks/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `task-${req.params.id}-${uniqueSuffix}${ext}`);
  }
});

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for avatars!'), false);
  }
};

// File filter for task attachments
const taskFileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    // Documents
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Text files
    'text/plain', 'text/csv',
    // Archives
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    return cb(null, true);
  } else {
    cb(new Error('File type not allowed!'), false);
  }
};

// Multer configuration for avatar uploads
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFilter
});

// Multer configuration for task file uploads
const uploadTaskFiles = multer({
  storage: taskFileStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 5 // Maximum 5 files
  },
  fileFilter: taskFileFilter
});

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected file field' });
    }
  }
  
  if (error.message.includes('File type not allowed')) {
    return res.status(400).json({ message: 'File type not allowed' });
  }
  
  if (error.message.includes('Only image files are allowed')) {
    return res.status(400).json({ message: 'Only image files are allowed for avatars' });
  }
  
  console.error('Upload error:', error);
  res.status(500).json({ message: 'File upload failed' });
};

// Function to delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Function to get file info
const getFileInfo = (file) => {
  return {
    originalName: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path
  };
};

// Function to validate file size
const validateFileSize = (file, maxSize) => {
  return file.size <= maxSize;
};

// Function to get file extension
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// Function to generate safe filename
const generateSafeFilename = (originalname, prefix = '') => {
  const ext = getFileExtension(originalname);
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  return `${prefix}${timestamp}-${random}${ext}`;
};

// Middleware to clean up old files
const cleanupOldFiles = (directory, maxAge = 24 * 60 * 60 * 1000) => { // 24 hours default
  try {
    const files = fs.readdirSync(directory);
    const now = Date.now();
    
    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        deleteFile(filePath);
        console.log(`Cleaned up old file: ${filePath}`);
      }
    });
  } catch (error) {
    console.error('Error cleaning up old files:', error);
  }
};

// Schedule cleanup every hour
setInterval(() => {
  cleanupOldFiles('uploads/avatars', 7 * 24 * 60 * 60 * 1000); // 7 days for avatars
  cleanupOldFiles('uploads/tasks', 30 * 24 * 60 * 60 * 1000); // 30 days for task files
}, 60 * 60 * 1000);

module.exports = {
  uploadAvatar,
  uploadTaskFiles,
  handleUploadError,
  deleteFile,
  getFileInfo,
  validateFileSize,
  getFileExtension,
  generateSafeFilename,
  cleanupOldFiles
}; 