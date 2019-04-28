'use strict';

const functions = require('firebase-functions');
const sh = require("shorthash");
var topicsArray = ["general", "beauty", "food", "travel", "sports", "entertainment"];
var modesArray = ["light", "normal", "heavy"];
const cors = require('cors')({
  origin: true,
});

const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
db.settings({ timestampsInSnapshots: true });

exports.getRecentPosts = functions.https.onRequest(async (req, res) => {
  return cors(req, res, () => {
    if (topicsArray.indexOf(req.query.topic) == -1)
        res.status(403).send("Invalid topic. Allowed topics on this server are : " + topicsArray.join(','));
    var collRef = db.collection(req.query.topic);
    collRef.get()
      .then((snapshot) => {
        var array = [];
        snapshot.forEach((doc) => {
          console.log(doc.id, '=>', doc.data());
          console.log('_updateTime:', doc._updateTime._seconds);
          array.push(doc.data());
        });
        res.status(200).send(array);
      })
      .catch((err) => {
        console.log('Error getRecentPosts', err);
        res.status(403).send(err);
      });
  });
});

exports.getRecentPostsV1 = functions.https.onRequest(async (req, res) => {
  return cors(req, res, () => {
    if (topicsArray.indexOf(req.query.topic) == -1)
        res.status(403).send("Invalid topic. Allowed topics on this server are : " + topicsArray.join(','));
    var collRef = db.collection(req.query.topic);
    collRef.get()
      .then((snapshot) => {
        var array = [];
        snapshot.forEach((doc) => {
          console.log(doc.id, '=>', doc.data());
          console.log('_updateTime:', doc._updateTime._seconds);
          array.push(doc.data());
        });
        res.status(200).send(array);
      })
      .catch((err) => {
        console.log('Error getRecentPosts', err);
        res.status(403).send(err);
      });
  });
});

exports.publishMyLatestPost = functions.https.onRequest(async (req, res) => {
  return cors(req, res, () => {
    if (topicsArray.indexOf(req.query.topic) == -1)
        res.status(403).send("Invalid topic. Allowed topics on this server are : " + topicsArray.join(','));
    var hashedpostid = sh.unique(req.query.postid);
    console.log('hashedpostid:', hashedpostid);
    const doctRef = db.collection(req.query.topic).doc(hashedpostid);

    var mode = "normal";
    if (req.query.mode && modesArray.indexOf(req.query.mode) >= 0) {
      mode = req.query.mode;
    }
    doctRef.set({
      'mode': mode,
      'postid': req.query.postid
    })
    .then((snapshot) => {
      res.status(200).send("hashed:" + hashedpostid + " actual:" + req.query.postid);
    })
    .catch((err) => {
      console.log('Error publishMyLatestPost', err);
      res.status(403).send(err);
    });
  });
});

exports.deleteOlderPosts = functions.https.onRequest(async (req, res) => {
  return cors(req, res, () => {
    if (topicsArray.indexOf(req.query.topic) == -1)
        res.status(403).send("Invalid topic. Allowed topics on this server are : " + topicsArray.join(','));
    const hourDeltainSec = 60*60*12
    const nowinSec = (+ new Date())/1000
    var collRef = db.collection(req.query.topic)
    collRef.get().then((snapshot) => {
      var arr = [];
      snapshot.forEach((doc) => {
        if (doc._updateTime._seconds < nowinSec - hourDeltainSec) {
          console.log('Deleting:', doc.id);
          doc.ref.delete();
          arr.push('Deleted:'+ doc.id);
        } else {
          console.log('This is recent:', doc.id);
          arr.push('recent:' + doc.id + " : " + doc._updateTime._seconds);
        }
      });
      res.status(200).send(arr);
    })
    .catch((err) => {
      console.log('Error getRecentPosts', err);
      res.status(403).send(err);
    });
  });
});

exports.instapost = functions.https.onRequest(async (req, res) => {
  return cors(req, res, () => {
    if (topicsArray.indexOf(req.query.topic) == -1)
        res.status(403).send("Invalid topic. Allowed topics on this server are : " + topicsArray.join(','));
    const doctRef = db.collection(req.query.topic).doc(req.query.hashedpostid);
    var postid = doctRef.get().then(doc => {
      if (!doc.exists) {
        console.log('No such document!');
      } else {
        console.log('Document data:', doc.data());
        res.redirect('https://instagram.com/p/' + doc.data().postid);
      }
    })
    .catch(err => {
      console.log('Error getting document', err);
    });
  });
});
