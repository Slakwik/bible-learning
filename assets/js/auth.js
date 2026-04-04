(function() {
  'use strict';

  // Current user profile (from Firestore)
  var currentProfile = null;

  function renderAuthNav(user, profile) {
    var nav = document.getElementById('authNav');
    if (!nav) return;

    if (user && profile) {
      var html = '';
      html += '<a href="/my-answers/">Мои ответы</a>';
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
          errorEl.textContent = 'Неверный email или пароль';
          errorEl.classList.add('visible');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Войти';
        });
    });
  }

  // Auth state listener
  BibleDB.onAuthChanged(function(user) {
    if (user) {
      BibleDB.getUserProfile(user.uid).then(function(profile) {
        if (!profile) {
          // Profile missing — create minimal one
          profile = { name: user.email, role: 'user', email: user.email };
          BibleDB.setUserProfile(user.uid, profile);
        }
        currentProfile = profile;
        currentProfile.uid = user.uid;
        renderAuthNav(user, profile);

        // Fire custom event for other scripts
        window.dispatchEvent(new CustomEvent('bible-auth-ready', { detail: { user: user, profile: profile } }));
      });
    } else {
      currentProfile = null;
      renderAuthNav(null, null);
      window.dispatchEvent(new CustomEvent('bible-auth-ready', { detail: { user: null, profile: null } }));
    }
  });

  // Expose
  window.BibleAuth = {
    getProfile: function() { return currentProfile; },
    onReady: function(cb) {
      if (currentProfile !== null || !BibleDB.getCurrentUser()) {
        // Already resolved
        window.addEventListener('bible-auth-ready', function handler(e) {
          cb(e.detail.user, e.detail.profile);
        });
      }
      window.addEventListener('bible-auth-ready', function(e) {
        cb(e.detail.user, e.detail.profile);
      });
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
