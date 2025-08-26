require('dotenv').config();

console.log(process.env.DB_URI);

const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

try {
  mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
} catch (err) {
  console.log(err);
}

const port = process.env.PORT || 3000;

const schema = new mongoose.Schema({
  original: { type: String, required: true },
  short: { type: Number, required: true },
});
const Url = mongoose.model('Url', schema);

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/shorturl/:input', (req, res) => {
  const input = parseInt(req.params.input);

  Url.findOne({ short: input }, function (err, data) {
    if (err || data === null) return res.json('URL NOT FOUND');
    return res.redirect(data.original);
  });
});

app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  try {
    new URL(originalUrl);
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  const shortUrl = counter++;
  urls[shortUrl] = originalUrl;

  res.json({
    original_url: originalUrl,
    short_url: shortUrl,
  });
});

app.get('/api/shorturl/:id', (req, res) => {
  const shortUrl = req.params.id;
  const originalUrl = urls[shortUrl];

  if (!originalUrl) {
    return res.json({ error: 'No short URL found for given input' });
  }

  res.redirect(originalUrl);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
