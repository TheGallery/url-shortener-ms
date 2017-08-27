const mongo = require('mongodb').MongoClient;
const isURL = require('is-url');

function generateUrl (res, url) {
  // Check if the url is valid
  if (!isValidUrl(url)) {
    res.json({
      error: 'Invalid url provided. Make sure you include the protocol.'
    });
  } else {
    mongo.connect(process.env.DB, (err, db) => {
      if (err) throw err;

      generateUniqueId(db, res, url);
    });
  }
}

function redirectToUrl (res, url) {
  mongo.connect(process.env.DB, (err, db) => {
    if (err) throw err;

    db.collection('urls').find({
      short_url: process.env.APP_URL + url
    }).toArray((err, data) => {
      if (err) throw err;

      if (data.length) { // if the url exists, redirect to the original url
        res.redirect(data[0].original_url);
      } else {
        res.json({
          error: 'This url doesn\'t exist in our database.'
        });
      }
    });
  });
}

function generateUniqueId (db, res, url) {
  const chars = 'abcdefghijklmnopqrstuvwxyz1234567890';

  db.collection('urls').find().toArray((err, urls) => {
    if (err) throw err;

    const urlExists = urls.filter(curUrl => curUrl.original_url === url);

    if (urlExists.length) { // if the url exists in the DB, return that
      res.json({
        original_url: urlExists[0].original_url,
        short_url: urlExists[0].short_url
      });
    } else { // if the url doesn't exist, generate a new one
      const existingIds = urls.map(curUrl => curUrl.short_url.slice(-5));
      let id;

      // generate an id that doesn't already exist
      do {
        id = Array.from({length: 5}).map(() => {
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
      } while (~existingIds.indexOf(id));

      addUrl(db, res, url, id);
    }
  });
}

function addUrl (db, res, url, id) {
  const urlObj = {
    original_url: url,
    short_url: process.env.APP_URL + '/' + id
  };

  db.collection('urls').insert(urlObj, (err, data) => {
    if (err) throw err;

    res.json({
      original_url: url,
      short_url: process.env.APP_URL + '/' + id
    });
  });
}

function isValidUrl (url) {
  // https://github.com/component/regexps/blob/master/index.js#L3
  const urlRegex = new RegExp(/^(?:(?:ht|f)tp(?:s?)\:\/\/|~\/|\/)?(?:\w+:\w+@)?((?:(?:[-\w\d{1-3}]+\.)+(?:com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|edu|co\.uk|ac\.uk|it|fr|tv|museum|asia|local|travel|[a-z]{2}))|((\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)(\.(\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)){3}))(?::[\d]{1,5})?(?:(?:(?:\/(?:[-\w~!$+|.,=]|%[a-f\d]{2})+)+|\/)+|\?|#)?(?:(?:\?(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)(?:&(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)*)*(?:#(?:[-\w~!$ |\/.,*:;=]|%[a-f\d]{2})*)?$/);
  return urlRegex.test(url);
}

module.exports = {
  generateUrl,
  redirectToUrl
};
