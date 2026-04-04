(function() {
  'use strict';

  // Check admin access
  var user = BibleAuth.getCurrentUser();
  if (!user || user.role !== 'admin') {
    document.querySelector('.admin-page .container').innerHTML =
      '<div style="text-align:center;padding:80px 20px;">' +
      '<h2>Доступ запрещен</h2>' +
      '<p>Эта страница доступна только администраторам.</p>' +
      '<a href="/login/" class="btn btn-primary" style="margin-top:16px;">Войти</a></div>';
    return;
  }

  // === Tabs ===
  var tabs = document.querySelectorAll('.admin-tab');
  var panels = document.querySelectorAll('.admin-panel');

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      tabs.forEach(function(t) { t.classList.remove('active'); });
      panels.forEach(function(p) { p.classList.remove('active'); });
      tab.classList.add('active');
      document.getElementById('panel-' + tab.getAttribute('data-tab')).classList.add('active');
    });
  });

  // === Users ===
  function renderUsers() {
    var users = BibleAuth.getUsers();
    var tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    users.forEach(function(u, i) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + escHtml(u.name) + '</td>' +
        '<td>' + escHtml(u.username) + '</td>' +
        '<td>' + (u.role === 'admin' ? 'Админ' : 'Ученик') + '</td>' +
        '<td>' +
          '<button class="btn btn-outline btn-sm edit-user" data-index="' + i + '">Изменить</button> ' +
          (u.username !== 'admin' ?
            '<button class="btn btn-danger btn-sm delete-user" data-index="' + i + '">Удалить</button>' : '') +
        '</td>';
      tbody.appendChild(tr);
    });

    // Edit buttons
    tbody.querySelectorAll('.edit-user').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(btn.getAttribute('data-index'));
        openEditModal(idx);
      });
    });

    // Delete buttons
    tbody.querySelectorAll('.delete-user').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(btn.getAttribute('data-index'));
        if (confirm('Удалить этого пользователя?')) {
          var users = BibleAuth.getUsers();
          users.splice(idx, 1);
          BibleAuth.saveUsers(users);
          renderUsers();
        }
      });
    });
  }

  // Modal
  var modal = document.getElementById('userModal');
  var form = document.getElementById('userForm');

  document.getElementById('addUserBtn').addEventListener('click', function() {
    document.getElementById('modalTitle').textContent = 'Добавить пользователя';
    document.getElementById('editIndex').value = '-1';
    form.reset();
    document.getElementById('uUsername').removeAttribute('disabled');
    modal.classList.add('active');
  });

  document.getElementById('cancelModal').addEventListener('click', function() {
    modal.classList.remove('active');
  });

  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.classList.remove('active');
  });

  function openEditModal(idx) {
    var users = BibleAuth.getUsers();
    var u = users[idx];
    document.getElementById('modalTitle').textContent = 'Редактировать пользователя';
    document.getElementById('editIndex').value = idx;
    document.getElementById('uName').value = u.name;
    document.getElementById('uUsername').value = u.username;
    document.getElementById('uUsername').setAttribute('disabled', 'disabled');
    document.getElementById('uPassword').value = u.password;
    document.getElementById('uRole').value = u.role;
    modal.classList.add('active');
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var users = BibleAuth.getUsers();
    var idx = parseInt(document.getElementById('editIndex').value);
    var errorEl = document.getElementById('userFormError');
    errorEl.classList.remove('visible');

    var data = {
      name: document.getElementById('uName').value.trim(),
      username: document.getElementById('uUsername').value.trim().toLowerCase(),
      password: document.getElementById('uPassword').value,
      role: document.getElementById('uRole').value,
      created: new Date().toISOString()
    };

    if (!data.name || !data.username || !data.password) {
      errorEl.textContent = 'Заполните все поля';
      errorEl.classList.add('visible');
      return;
    }

    if (idx === -1) {
      // Check duplicate username
      for (var i = 0; i < users.length; i++) {
        if (users[i].username === data.username) {
          errorEl.textContent = 'Пользователь с таким логином уже существует';
          errorEl.classList.add('visible');
          return;
        }
      }
      users.push(data);
    } else {
      data.username = users[idx].username;
      data.created = users[idx].created || data.created;
      users[idx] = data;
    }

    BibleAuth.saveUsers(users);
    modal.classList.remove('active');
    renderUsers();
    renderProgressSelect();
  });

  renderUsers();

  // === Progress ===
  var LESSON_SLUGS = ['james-1', 'james-2', 'james-3', 'james-4', 'james-5', 'james-6'];
  var LESSON_TITLES = {
    'james-1': 'Урок 1. Вера и дела',
    'james-2': 'Урок 2. Вера и духовный рост',
    'james-3': 'Урок 3. Вера и общество',
    'james-4': 'Урок 4. Вера и наши слова',
    'james-5': 'Урок 5. Вера и борьба',
    'james-6': 'Урок 6. Вера и практика'
  };

  function renderProgressSelect() {
    var select = document.getElementById('progressUser');
    var users = BibleAuth.getUsers();
    select.innerHTML = '<option value="">— выберите —</option>';
    users.forEach(function(u) {
      if (u.role !== 'admin') {
        var opt = document.createElement('option');
        opt.value = u.username;
        opt.textContent = u.name + ' (' + u.username + ')';
        select.appendChild(opt);
      }
    });
  }

  document.getElementById('progressUser').addEventListener('change', function() {
    var username = this.value;
    var content = document.getElementById('progressContent');
    if (!username) { content.innerHTML = ''; return; }

    var answers = JSON.parse(localStorage.getItem('bible_answers_' + username) || '{}');

    if (Object.keys(answers).length === 0) {
      content.innerHTML = '<p style="color:var(--text-light);padding:20px 0;">Этот ученик ещё не отвечал на вопросы.</p>';
      return;
    }

    var html = '';
    LESSON_SLUGS.forEach(function(slug) {
      var lessonAnswers = answers[slug];
      if (!lessonAnswers) return;

      html += '<div style="margin-top:24px;">';
      html += '<h3>' + LESSON_TITLES[slug] + '</h3>';
      if (lessonAnswers._savedAt) {
        html += '<p style="font-size:0.85rem;color:var(--text-light);">Сохранено: ' +
          new Date(lessonAnswers._savedAt).toLocaleString('ru') + '</p>';
      }
      html += '<ul class="answers-list">';
      Object.keys(lessonAnswers).forEach(function(key) {
        if (key.startsWith('q')) {
          html += '<li><strong>Вопрос ' + key.replace('q', '') + ':</strong><p>' +
            escHtml(lessonAnswers[key]) + '</p></li>';
        }
      });
      html += '</ul></div>';
    });

    content.innerHTML = html;
  });

  renderProgressSelect();

  // === Lessons stats ===
  function renderLessonStats() {
    var users = BibleAuth.getUsers();
    var cells = document.querySelectorAll('.lesson-answer-count');

    cells.forEach(function(cell) {
      var slug = cell.getAttribute('data-slug');
      var count = 0;
      users.forEach(function(u) {
        var answers = JSON.parse(localStorage.getItem('bible_answers_' + u.username) || '{}');
        if (answers[slug]) count++;
      });
      cell.textContent = count;
    });
  }

  renderLessonStats();

  // === Helpers ===
  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
