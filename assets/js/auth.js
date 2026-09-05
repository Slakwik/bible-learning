(function() {
  'use strict';

  // Current user profile (from Firestore)
  var currentProfile = null;
  var authResolved = false;
  var resolvedUser = null;

  function renderAuthNav(user, profile) {
    var nav = document.getElementById('authNav');
    if (!nav) return;

    if (user && profile) {
      var html = '';
      html += '<a href="/my-answers/">Мои ответы</a>';
      html += '<a href="/profile/">Профиль</a>';
      if (profile.role === 'admin') {
        html += '<a href="/admin/">Админка</a>';
      }
      html += '<span class="nav-user">' + escHtml(profile.name) + '</span>';
      html += '<a href="#" id="logoutBtn" class="nav-logout">Выйти</a>';
      nav.innerHTML = html;

      document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        BibleDB.logout().then(function() {
          window.location.href = '/';
        });
      });
    } else {
      nav.innerHTML = '<a href="/login/">Войти</a>';
    }
  }

  function initNavToggle() {
    var toggle = document.getElementById('navToggle');
    var navEl = document.querySelector('.main-nav');
    if (toggle && navEl) {
      toggle.addEventListener('click', function() {
        navEl.classList.toggle('open');
      });
    }
  }

  function initLoginForm() {
    var form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var email = document.getElementById('username').value.trim();
      var password = document.getElementById('password').value;
      var errorEl = document.getElementById('loginError');
      var submitBtn = form.querySelector('button[type="submit"]');

      errorEl.classList.remove('visible');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Вход...';

      BibleDB.login(email, password)
        .then(function() {
          window.location.href = '/lessons/';
        })
        .catch(function(err) {
          errorEl.textContent = err.code === 'auth/network-request-failed'
            ? 'Нет связи с сервисом входа. Проверьте подключение.'
            : err.code === 'auth/too-many-requests'
              ? 'Слишком много попыток. Попробуйте позже.' : 'Неверный email или пароль';
          errorEl.classList.add('visible');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Войти';
        });
    });
  }

  function publishAuth(user, profile) {
    resolvedUser = user;
    currentProfile = profile;
    authResolved = true;
    renderAuthNav(user, profile);
    window.dispatchEvent(new CustomEvent('bible-auth-ready', { detail: { user: user, profile: profile } }));
  }

  BibleDB.onAuthChanged(function(user) {
    if (!user) { publishAuth(null, null); return; }
    BibleDB.getUserProfile(user.uid).then(function(profile) {
      if (profile) return profile;
      profile = { name: user.email, role: 'user', email: user.email };
      return BibleDB.setUserProfile(user.uid, profile).then(function() { return profile; });
    }).then(function(profile) {
      if (BibleDB.getCurrentUser() !== user) return;
      profile.uid = user.uid;
      publishAuth(user, profile);
    }).catch(function(err) {
      if (BibleDB.getCurrentUser() !== user) return;
      currentProfile = null;
      renderAuthNav(user, { name: user.email, role: 'user' });
      var message = document.getElementById('authError');
      if (!message) {
        message = document.createElement('div');
        message.id = 'authError';
        message.className = 'container form-error visible';
        message.setAttribute('role', 'alert');
        document.querySelector('main').prepend(message);
      }
      message.textContent = 'Не удалось загрузить профиль. Обновите страницу, чтобы повторить попытку.';
      window.dispatchEvent(new CustomEvent('bible-auth-error', { detail: { error: err } }));
    });
  });

  window.BibleAuth = {
    getProfile: function() { return currentProfile; },
    onReady: function(cb) {
      window.addEventListener('bible-auth-ready', function(e) { cb(e.detail.user, e.detail.profile); });
      if (authResolved) cb(resolvedUser, currentProfile);
    }
  };

  // Init on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    initNavToggle();
    initLoginForm();
  });

  function escHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
})();
