(function() {
  'use strict';

  var lessonEl = document.getElementById('lessonContent');
  if (!lessonEl) return;

  var lessonSlug = lessonEl.getAttribute('data-lesson');
  var authGate = document.getElementById('authGate');
  var lessonActions = document.getElementById('lessonActions');

  window.addEventListener('bible-auth-ready', function(e) {
    var user = e.detail.user;
    var profile = e.detail.profile;

    if (!user) {
      authGate.style.display = '';
      return;
    }

    lessonEl.style.display = '';
    lessonActions.style.display = '';
    loadAndFillAnswers(user.uid);
  });

  function loadAndFillAnswers(uid) {
    BibleDB.getAnswers(uid, lessonSlug).then(function(saved) {
      if (!saved) saved = {};
      var textareas = lessonEl.querySelectorAll('textarea[data-question]');
      textareas.forEach(function(ta) {
        var key = ta.getAttribute('data-question');
        if (saved[key]) ta.value = saved[key];
      });

      // Save button
      var saveBtn = document.getElementById('saveAnswers');
      if (saveBtn) {
        saveBtn.addEventListener('click', function() { doSave(uid); });
      }

      // Auto-save on blur
      textareas.forEach(function(ta) {
        ta.addEventListener('blur', function() {
          if (ta.value.trim()) doSave(uid);
        });
      });
    });
  }

  function doSave(uid) {
    var answers = {};
    var textareas = lessonEl.querySelectorAll('textarea[data-question]');
    textareas.forEach(function(ta) {
      var val = ta.value.trim();
      if (val) answers[ta.getAttribute('data-question')] = val;
    });

    if (Object.keys(answers).length === 0) {
      showStatus('Нет ответов для сохранения', true);
      return;
    }

    BibleDB.saveAnswers(uid, lessonSlug, answers).then(function() {
      showStatus('Ответы сохранены!', false);
    }).catch(function() {
      showStatus('Ошибка сохранения', true);
    });
  }

  function showStatus(msg, isError) {
    var el = document.getElementById('saveStatus');
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? '#c0392b' : 'var(--primary)';
    setTimeout(function() { el.textContent = ''; }, 3000);
  }
})();
