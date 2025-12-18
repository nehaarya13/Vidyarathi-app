const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Upload storage setup
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'data/uploads'); // make sure folder exists
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Upload file API
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // Save info in uploads.json
  const uploadsFile = path.join(__dirname, '../data/uploads.json');
  const uploads = JSON.parse(fs.readFileSync(uploadsFile));
  uploads.push({ filename: req.file.filename, originalname: req.file.originalname, uploadedAt: new Date() });
  fs.writeFileSync(uploadsFile, JSON.stringify(uploads, null, 2));

  res.json({ message: 'File uploaded successfully', file: req.file.filename });
});

module.exports = router;
