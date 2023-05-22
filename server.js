const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const monocle = import('monocle-node-cli');

// Serve static files from the "public" directory
app.use(express.static('public'));

const predefinedFilename = 'mydata.json';

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).send('No file uploaded.');
  } else {
    const tempPath = req.file.path;
    const targetPath = path.join(__dirname, 'uploads', predefinedFilename);

    if (path.extname(req.file.originalname).toLowerCase() !== '.json') {
      res.status(400).send('Only JSON files are allowed.');
    } else {
      fs.rename(tempPath, targetPath, (err) => {
        if (err) {
          res.status(500).send('Error moving file.');
        } else {
          res.send('File uploaded successfully.');
        }
      });
    }
  }
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
