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

app.get('/api/shorturl/:url', (req, res) => {
  const url = parseInt(req.params.url);

  Url.findOne({ short: url }, function (err, data) {
    if (err || data === null) return res.json('URL NOT FOUND');
    return res.redirect(data.original);
  });
});

function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

app.post('/api/shorturl', async (req, res) => {
  const bodyUrl = req.body.url;

  if (!isValidUrl(bodyUrl)) {
    return res.json({ error: 'Invalid URL' });
  }

  let index = 1;

  Url.findOne({})
    .sort({ short: 'desc' })
    .exec((err, data) => {
      if (err) return res.json({ error: 'No url found.' });

      index = data !== null ? data.short + 1 : index;

      Url.findOneAndUpdate(
        { original: bodyUrl },
        { original: bodyUrl, short: index },
        { new: true, upsert: true },
        (err, newUrl) => {
          if (!err) {
            res.json({ original_url: bodyUrl, short_url: newUrl.short });
          }
        }
      );
    });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
