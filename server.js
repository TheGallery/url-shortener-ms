require('dotenv').config();
const express = require('express');
const shortener = require('./shortener');
const path = require('path');

const app = express();

app.get(/\/generate\/.*/, (req, res) => {
  const url = req.url.substring(10);

  shortener.generateUrl(res, url);
});

app.get('/:urlId', (req, res) => {
  shortener.redirectToUrl(res, req.url);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running.');
});
