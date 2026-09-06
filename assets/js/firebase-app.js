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
        return secondaryApp.auth().signOut().then(function() { return cred; });
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

  function resetPassword(email) {
    auth.languageCode = 'ru';
    return auth.sendPasswordResetEmail(email);
  }

  function restoreUserProfile(uid, data) {
    var ref = db.collection('users').doc(uid);
    return db.runTransaction(function(tx) {
      return tx.get(ref).then(function(snapshot) {
        if (snapshot.exists) throw new Error('Профиль уже существует. Обновите список пользователей.');
        tx.set(ref, { name: data.name, email: data.email, role: 'user', restoredAt: new Date().toISOString() });
      });
    });
  }

  // ========== Answers (Firestore) ==========

  function getAnswers(uid, lessonSlug, classId) {
    return answerRef(uid, lessonSlug, classId).get().then(function(doc) {
      return doc.exists ? doc.data() : null;
    });
  }

  function saveAnswers(uid, lessonSlug, answers, classId) {
    answers._savedAt = new Date().toISOString();
    answers._uid = uid;
    answers._lesson = lessonSlug;
    if (classId) answers._class = classId;
    return answerRef(uid, lessonSlug, classId).set(answers);
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

  function answerRef(uid, slug, classId) {
    return classId ? db.collection('classAnswers').doc(classId + '_' + uid + '_' + slug)
      : db.collection('answers').doc(uid + '_' + slug);
  }

  function rows(snapshot) {
    return snapshot.docs.map(function(doc) { return Object.assign({}, doc.data(), { id: doc.id }); });
  }
  function getClasses(user, profile) {
    var query = db.collection('classes');
    if (profile.role === 'leader') query = query.where('leaderUid', '==', user.uid);
    else if (profile.role !== 'admin') query = query.where('memberUids', 'array-contains', user.uid);
    return query.get().then(rows);
  }
  function getClass(id) {
    return db.collection('classes').doc(id).get().then(function(doc) {
      if (!doc.exists) throw new Error('class-not-found');
      return Object.assign({}, doc.data(), { id: doc.id });
    });
  }
  function saveClass(id, data) {
    var ref = id ? db.collection('classes').doc(id) : db.collection('classes').doc();
    data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    if (!id) data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    return ref.set(data, { merge: true }).then(function() { return ref.id; });
  }
  function getStudents() {
    return db.collection('users').where('role', '==', 'user').get().then(rows);
  }
  function getClassAnswers(classId, uid) {
    var query = db.collection('classAnswers').where('_class', '==', classId);
    if (uid) query = query.where('_uid', '==', uid);
    return query.get().then(rows);
  }

  // ========== Expose API ==========

  window.BibleDB = {
    getClasses: getClasses,
    getClass: getClass,
    saveClass: saveClass,
    getStudents: getStudents,
    getClassAnswers: getClassAnswers,
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
    resetPassword: resetPassword,
    restoreUserProfile: restoreUserProfile,
    getAnswers: getAnswers,
    saveAnswers: saveAnswers,
    getUserAnswers: getUserAnswers,
    getAllAnswers: getAllAnswers
  };
})();
