// declarations
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sh = require('shorthash');
// set CORS
const cors = require('cors')({
  origin: true,
});

// set available topics
const topics = [
  'general',
  'fashion',
  'food',
  'travel',
  'sports',
  'entertainment',
];
// set modes
const modes = ['no_comments', 'light', 'normal', 'heavy'];
// instantiate FireStore
admin.initializeApp();
const db = admin.firestore();
db.settings({ timestampsInSnapshots: true });

/*
 * Get Recent Posts
 */
module.exports.getRecentPosts = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (topics.indexOf(req.query.topic) === -1) {
      res.status(403).send(
        `Invalid topic. Allowed topics on this server
        are : ${topics.join(',')}`,
      );
    }
    const collRef = db.collection(req.query.topic);
    collRef
      .get()
      .then((snapshot) => {
        const posts = [];
        snapshot.forEach((doc) => {
          console.log(doc.id, '=>', doc.data());
          console.log('_updateTime:', doc._updateTime._seconds);
          posts.push(doc.data().postid);
        });
        res.status(200).send(posts);
      })
      .catch((err) => {
        console.log('Error getRecentPosts', err);
        res.status(403).send(err);
      });
  });
});

/*
 * Get Recent Posts V1
 */
module.exports.getRecentPostsV1 = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (topics.indexOf(req.query.topic) === -1) {
      res.status(403).send(
        `Invalid topic. Allowed topics on this server are : 
        ${topics.join(',')}`,
      );
    }
    const collRef = db.collection(req.query.topic);
    collRef
      .get()
      .then((snapshot) => {
        const posts = [];
        snapshot.forEach((doc) => {
          console.log(doc.id, '=>', doc.data());
          console.log('_updateTime:', doc._updateTime._seconds);
          posts.push(doc.data());
        });
        res.status(200).send(posts);
      })
      .catch((err) => {
        console.log('Error getRecentPosts', err);
        res.status(403).send(err);
      });
  });
});

/*
 * Publish Post ID
 */
module.exports.publishMyLatestPost = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (topics.indexOf(req.query.topic) === -1) {
      res.status(403).send(
        `Invalid topic. Allowed topics on this server are : 
        ${topics.join(',')}`,
      );
    }
    const hashedpostid = sh.unique(req.query.postid);
    console.log('hashedpostid:', hashedpostid);
    const doctRef = db.collection(req.query.topic).doc(hashedpostid);

    let mode = 'normal';
    if (req.query.mode && modes.indexOf(req.query.mode) >= 0) {
      mode = req.query.mode;
    }
    doctRef
      .set({
        mode,
        postid: req.query.postid,
      })
      .then(() => {
        res
          .status(200)
          .send(`hashed:' ${hashedpostid} actual: ${req.query.postid}`);
      })
      .catch((err) => {
        console.log('Error publishMyLatestPost', err);
        res.status(403).send(err);
      });
  });
});

/*
 * Delete Old Posts
 */
module.exports.deleteOlderPosts = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (topics.indexOf(req.query.topic) === -1) {
      res.status(403).send(
        `Invalid topic. Allowed topics on this server are : 
        ${topics.join(',')}`,
      );
    }
    const hourDeltainSec = 60 * 60 * 12;
    const nowinSec = +new Date() / 1000;
    const collRef = db.collection(req.query.topic);
    collRef
      .get()
      .then((snapshot) => {
        const posts = [];
        snapshot.forEach((doc) => {
          if (doc._updateTime._seconds < nowinSec - hourDeltainSec) {
            console.log('Deleting: ', doc.id);
            doc.ref.delete();
            posts.push(`Deleted: ${doc.id}`);
          } else {
            console.log('This is recent:', doc.id);
            posts.push(`recent: doc.id : ${doc._updateTime._seconds}`);
          }
        });
        res.status(200).send(posts);
      })
      .catch((err) => {
        console.log('Error getRecentPosts', err);
        res.status(403).send(err);
      });
  });
});

/*
 * InstaPost ?
 * TODO: improve function name
 */
module.exports.instapost = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (topics.indexOf(req.query.topic) === -1) {
      res.status(403).send(
        `Invalid topic. Allowed topics on this server are : 
        ${topics.join(',')}`,
      );
    }
    const doctRef = db.collection(req.query.topic).doc(req.query.hashedpostid);
    doctRef
      .get()
      .then((doc) => {
        if (!doc.exists) {
          console.log('No such document!');
        } else {
          console.log('Document data:', doc.data());
          res.redirect(`https://instagram.com/p/' ${doc.data().postid}`);
        }
      })
      .catch((err) => {
        console.log('Error getting document', err);
      });
  });
});
