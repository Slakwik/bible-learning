(function() {
  'use strict';

  window.addEventListener('bible-auth-ready', function(e) {
    var user = e.detail.user;
    var profile = e.detail.profile;

    if (!user || !profile || profile.role !== 'admin') {
      document.querySelector('.admin-page .container').innerHTML =
        '<div style="text-align:center;padding:80px 20px;">' +
        '<h2>Доступ запрещён</h2>' +
        '<p>Эта страница доступна только администраторам.</p>' +
        '<a href="/login/" class="btn btn-primary" style="margin-top:16px;">Войти</a></div>';
      return;
    }

    initAdmin();
  });

  function initAdmin() {
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
    var allUsers = [];

    function loadUsers() {
      return BibleDB.getAllUsers().then(function(users) {
        allUsers = users;
        renderUsers();
        renderProgressSelect();
        renderLessonStats();
      });
    }

    function renderUsers() {
      var tbody = document.getElementById('usersTableBody');
      tbody.innerHTML = '';

      allUsers.forEach(function(u) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + escHtml(u.name) + '</td>' +
          '<td>' + escHtml(u.email) + '</td>' +
          '<td>' + (u.role === 'admin' ? 'Админ' : 'Ученик') + '</td>' +
          '<td>' +
            '<button class="btn btn-outline btn-sm edit-user" data-uid="' + u.uid + '">Изменить</button> ' +
            '<button class="btn btn-danger btn-sm delete-user" data-uid="' + u.uid + '">Удалить</button>' +
          '</td>';
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.edit-user').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var uid = btn.getAttribute('data-uid');
          var u = allUsers.find(function(x) { return x.uid === uid; });
          if (u) openEditModal(u);
        });
      });

      tbody.querySelectorAll('.delete-user').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var uid = btn.getAttribute('data-uid');
          if (confirm('Удалить этого пользователя? Его данные в Firestore будут удалены.')) {
            BibleDB.deleteUserProfile(uid).then(loadUsers);
          }
        });
      });
    }

    // Modal
    var modal = document.getElementById('userModal');
    var form = document.getElementById('userForm');

    document.getElementById('addUserBtn').addEventListener('click', function() {
      document.getElementById('modalTitle').textContent = 'Добавить пользователя';
      document.getElementById('editUid').value = '';
      form.reset();
      document.getElementById('uEmail').removeAttribute('disabled');
      document.getElementById('uPassword').closest('.form-group').style.display = '';
      modal.classList.add('active');
    });

    document.getElementById('cancelModal').addEventListener('click', function() {
      modal.classList.remove('active');
    });

    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.classList.remove('active');
    });

    function openEditModal(u) {
      document.getElementById('modalTitle').textContent = 'Редактировать пользователя';
      document.getElementById('editUid').value = u.uid;
      document.getElementById('uName').value = u.name;
      document.getElementById('uEmail').value = u.email;
      document.getElementById('uEmail').setAttribute('disabled', 'disabled');
      document.getElementById('uPassword').value = '';
      document.getElementById('uPassword').closest('.form-group').style.display = 'none';
      document.getElementById('uRole').value = u.role;
      modal.classList.add('active');
    }

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var uid = document.getElementById('editUid').value;
      var errorEl = document.getElementById('userFormError');
      errorEl.classList.remove('visible');

      var name = document.getElementById('uName').value.trim();
      var email = document.getElementById('uEmail').value.trim();
      var password = document.getElementById('uPassword').value;
      var role = document.getElementById('uRole').value;

      if (!name || !email) {
        errorEl.textContent = 'Заполните имя и email';
        errorEl.classList.add('visible');
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      if (uid) {
        // Edit existing
        BibleDB.setUserProfile(uid, { name: name, role: role }).then(function() {
          modal.classList.remove('active');
          submitBtn.disabled = false;
          loadUsers();
        });
      } else {
        // Create new
        if (!password || password.length < 6) {
          errorEl.textContent = 'Пароль должен быть не менее 6 символов';
          errorEl.classList.add('visible');
          submitBtn.disabled = false;
          return;
        }

        BibleDB.createUser(email, password).then(function(cred) {
          return BibleDB.setUserProfile(cred.user.uid, {
            name: name,
            email: email,
            role: role,
            created: new Date().toISOString()
          });
        }).then(function() {
          modal.classList.remove('active');
          submitBtn.disabled = false;
          loadUsers();
        }).catch(function(err) {
          var msg = 'Ошибка создания';
          if (err.code === 'auth/email-already-in-use') msg = 'Этот email уже зарегистрирован';
          if (err.code === 'auth/invalid-email') msg = 'Некорректный email';
          errorEl.textContent = msg;
          errorEl.classList.add('visible');
          submitBtn.disabled = false;
        });
      }
    });

    // === Progress ===
    // Dynamic: read lesson slugs from the lessons table on the page
    var LESSON_SLUGS = [];
    var LESSON_TITLES = {};
    document.querySelectorAll('.lesson-answer-count').forEach(function(cell) {
      var slug = cell.getAttribute('data-slug');
      LESSON_SLUGS.push(slug);
      var row = cell.closest('tr');
      if (row) {
        var title = row.cells[1] ? row.cells[1].textContent.trim() : slug;
        LESSON_TITLES[slug] = title;
      }
    });

    var allAnswersCache = null;

    function renderProgressSelect() {
      var select = document.getElementById('progressUser');
      select.innerHTML = '<option value="">— выберите —</option>';
      allUsers.forEach(function(u) {
        if (u.role !== 'admin') {
          var opt = document.createElement('option');
          opt.value = u.uid;
          opt.textContent = u.name + ' (' + u.email + ')';
          select.appendChild(opt);
        }
      });
    }

    document.getElementById('progressUser').addEventListener('change', function() {
      var uid = this.value;
      var content = document.getElementById('progressContent');
      if (!uid) { content.innerHTML = ''; return; }

      BibleDB.getUserAnswers(uid).then(function(answers) {
        if (Object.keys(answers).length === 0) {
          content.innerHTML = '<p style="color:var(--text-light);padding:20px 0;">Этот ученик ещё не отвечал на вопросы.</p>';
          return;
        }

        var html = '';
        LESSON_SLUGS.forEach(function(slug) {
          var lessonAnswers = answers[slug];
          if (!lessonAnswers) return;

          html += '<div style="margin-top:24px;">';
          html += '<h3>' + (LESSON_TITLES[slug] || slug) + '</h3>';
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
    });

    // === Lessons stats ===
    function renderLessonStats() {
      BibleDB.getAllAnswers().then(function(allAnswers) {
        var cells = document.querySelectorAll('.lesson-answer-count');
        cells.forEach(function(cell) {
          var slug = cell.getAttribute('data-slug');
          var count = 0;
          Object.keys(allAnswers).forEach(function(uid) {
            if (allAnswers[uid][slug]) count++;
          });
          cell.textContent = count;
        });
      });
    }

    // Load data
    loadUsers();
  }

  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
