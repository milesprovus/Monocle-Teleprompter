const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();


// Serve static files from the "public" directory
app.use(express.static('public'));


app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
