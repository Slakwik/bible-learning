(function() {
  'use strict';

  var lessonEl = document.getElementById('lessonContent');
  if (!lessonEl) return;

  var lessonSlug = lessonEl.getAttribute('data-lesson');
  var user = BibleAuth.getCurrentUser();
  var authGate = document.getElementById('authGate');
  var lessonActions = document.getElementById('lessonActions');

  // Auth gate: show content only for logged-in users
  if (!user) {
    authGate.style.display = '';
    return;
  }
  lessonEl.style.display = '';
  lessonActions.style.display = '';

  // Load saved answers
  function loadAnswers() {
    if (!user) return {};
    var all = JSON.parse(localStorage.getItem('bible_answers_' + user.username) || '{}');
    return all[lessonSlug] || {};
  }

  // Save answers
  function saveAnswers() {
    if (!user) {
      showStatus('Войдите, чтобы сохранить ответы', true);
      return;
    }
    var all = JSON.parse(localStorage.getItem('bible_answers_' + user.username) || '{}');
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

    all[lessonSlug] = answers;
    all[lessonSlug]._savedAt = new Date().toISOString();
    localStorage.setItem('bible_answers_' + user.username, JSON.stringify(all));
    showStatus('Ответы сохранены!', false);
  }

  function showStatus(msg, isError) {
    var el = document.getElementById('saveStatus');
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? '#c0392b' : 'var(--primary)';
    setTimeout(function() { el.textContent = ''; }, 3000);
  }

  // Fill in saved answers
  var saved = loadAnswers();
  var textareas = lessonEl.querySelectorAll('textarea[data-question]');
  textareas.forEach(function(ta) {
    var key = ta.getAttribute('data-question');
    if (saved[key]) ta.value = saved[key];
  });

  // Save button
  var saveBtn = document.getElementById('saveAnswers');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveAnswers);
  }

  // Auto-save on textarea blur
  textareas.forEach(function(ta) {
    ta.addEventListener('blur', function() {
      if (user && ta.value.trim()) {
        saveAnswers();
      }
    });
  });
})();
