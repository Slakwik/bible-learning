(function() {
  'use strict';

  var firebaseConfig = {
    apiKey: "AIzaSyBu_g78Wmrls7_Q6A1mTgQwb013LlTiWls",
    authDomain: "bible-learning-b4b4d.firebaseapp.com",
    projectId: "bible-learning-b4b4d",
    storageBucket: "bible-learning-b4b4d.firebasestorage.app",
    messagingSenderId: "1093935422667",
    appId: "1:1093935422667:web:a1d86785a7ac3aea320f4e"
  };

  firebase.initializeApp(firebaseConfig);

  var auth = firebase.auth();
  var db = firebase.firestore();

  // ========== Auth API ==========

  function login(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
  }

  function logout() {
    return auth.signOut();
  }

  function createUser(email, password) {
    // Admin creates user via secondary app to avoid logging out
    var secondaryApp;
    try {
      secondaryApp = firebase.app('secondary');
    } catch (e) {
      secondaryApp = firebase.initializeApp(firebaseConfig, 'secondary');
    }
    return secondaryApp.auth().createUserWithEmailAndPassword(email, password)
      .then(function(cred) {
        secondaryApp.auth().signOut();
        return cred;
      });
  }

  function onAuthChanged(callback) {
    return auth.onAuthStateChanged(callback);
  }

  function getCurrentUser() {
    return auth.currentUser;
  }

  // ========== User Profiles (Firestore) ==========

  function getUserProfile(uid) {
    return db.collection('users').doc(uid).get().then(function(doc) {
      return doc.exists ? doc.data() : null;
    });
  }

  function setUserProfile(uid, data) {
    return db.collection('users').doc(uid).set(data, { merge: true });
  }

  function getAllUsers() {
    return db.collection('users').get().then(function(snap) {
      var users = [];
      snap.forEach(function(doc) {
        var d = doc.data();
        d.uid = doc.id;
        users.push(d);
      });
      return users;
    });
  }

  function deleteUserProfile(uid) {
    return db.collection('users').doc(uid).delete();
  }

  // ========== Answers (Firestore) ==========

  function getAnswers(uid, lessonSlug) {
    return db.collection('answers').doc(uid + '_' + lessonSlug).get().then(function(doc) {
      return doc.exists ? doc.data() : null;
    });
  }

  function saveAnswers(uid, lessonSlug, answers) {
    answers._savedAt = new Date().toISOString();
    answers._uid = uid;
    answers._lesson = lessonSlug;
    return db.collection('answers').doc(uid + '_' + lessonSlug).set(answers);
  }

  function getUserAnswers(uid) {
    return db.collection('answers').where('_uid', '==', uid).get().then(function(snap) {
      var result = {};
      snap.forEach(function(doc) {
        var d = doc.data();
        result[d._lesson] = d;
      });
      return result;
    });
  }

  function getAllAnswers() {
    return db.collection('answers').get().then(function(snap) {
      var result = {};
      snap.forEach(function(doc) {
        var d = doc.data();
        if (!result[d._uid]) result[d._uid] = {};
        result[d._uid][d._lesson] = d;
      });
      return result;
    });
  }

  // ========== Expose API ==========

  window.BibleDB = {
    auth: auth,
    db: db,
    login: login,
    logout: logout,
    createUser: createUser,
    onAuthChanged: onAuthChanged,
    getCurrentUser: getCurrentUser,
    getUserProfile: getUserProfile,
    setUserProfile: setUserProfile,
    getAllUsers: getAllUsers,
    deleteUserProfile: deleteUserProfile,
    getAnswers: getAnswers,
    saveAnswers: saveAnswers,
    getUserAnswers: getUserAnswers,
    getAllAnswers: getAllAnswers
  };
})();
