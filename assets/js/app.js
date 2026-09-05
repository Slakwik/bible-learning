(function() {
  'use strict';
  var lessonEl = document.getElementById('lessonContent');
  if (!lessonEl) return;
  var lessonSlug = lessonEl.getAttribute('data-lesson');
  var authGate = document.getElementById('authGate');
  var lessonActions = document.getElementById('lessonActions');
  var saveBtn = document.getElementById('saveAnswers');
  var textareas = lessonEl.querySelectorAll('textarea[data-question]');
  var currentUid = null;
  var loaded = false;
  var saveQueue = Promise.resolve();
  var statusTimer;

  BibleAuth.onReady(function(user) {
    currentUid = user ? user.uid : null;
    loaded = false;
    authGate.style.display = user ? 'none' : '';
    lessonEl.style.display = user ? '' : 'none';
    lessonActions.style.display = user ? '' : 'none';
    saveBtn.disabled = true;
    textareas.forEach(function(ta) { ta.disabled = true; ta.value = ''; });
    if (!user) return;
    BibleDB.getAnswers(user.uid, lessonSlug).then(function(saved) {
      if (currentUid !== user.uid) return;
      textareas.forEach(function(ta) {
        ta.value = (saved || {})[ta.getAttribute('data-question')] || '';
        ta.disabled = false;
      });
      loaded = true;
      saveBtn.disabled = false;
    }).catch(function() {
      showStatus('Не удалось загрузить ответы. Обновите страницу для повторной попытки.', true);
    });
  });

  saveBtn.addEventListener('click', doSave);
  textareas.forEach(function(ta) { ta.addEventListener('blur', doSave); });

  function doSave() {
    if (!loaded || !currentUid) return;
    var uid = currentUid;
    var answers = {};
    textareas.forEach(function(ta) {
      var val = ta.value.trim();
      if (val) answers[ta.getAttribute('data-question')] = val;
    });
    showStatus('Сохранение...', false);
    // Preserve edit order, including clearing the final answer.
    saveQueue = saveQueue.then(function() {
      return BibleDB.saveAnswers(uid, lessonSlug, answers);
    }).then(function() {
      if (currentUid === uid) showStatus('Ответы сохранены!', false);
    }).catch(function() {
      if (currentUid === uid) showStatus('Ошибка сохранения. Нажмите «Сохранить ответы», чтобы повторить.', true);
    });
  }

  function showStatus(msg, isError) {
    var el = document.getElementById('saveStatus');
    if (!el) return;
    clearTimeout(statusTimer);
    el.textContent = msg;
    el.style.color = isError ? '#c0392b' : 'var(--primary)';
    if (!isError) statusTimer = setTimeout(function() { el.textContent = ''; }, 3000);
  }
})();
