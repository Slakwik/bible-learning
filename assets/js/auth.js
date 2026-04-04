(function() {
  'use strict';

  var DEFAULT_ADMIN = {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Администратор',
    created: new Date().toISOString()
  };

  function getUsers() {
    var users = JSON.parse(localStorage.getItem('bible_users') || 'null');
    if (!users) {
      users = [DEFAULT_ADMIN];
      localStorage.setItem('bible_users', JSON.stringify(users));
    }
    return users;
  }

  function saveUsers(users) {
    localStorage.setItem('bible_users', JSON.stringify(users));
  }

  function getCurrentUser() {
    return JSON.parse(localStorage.getItem('bible_current_user') || 'null');
  }

  function setCurrentUser(user) {
    if (user) {
      var safe = { username: user.username, role: user.role, name: user.name };
      localStorage.setItem('bible_current_user', JSON.stringify(safe));
    } else {
      localStorage.removeItem('bible_current_user');
    }
  }

  function login(username, password) {
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
      if (users[i].username === username && users[i].password === password) {
        setCurrentUser(users[i]);
        return users[i];
      }
    }
    return null;
  }

  function logout() {
    setCurrentUser(null);
    window.location.href = '/';
  }

  // Render auth navigation
  function renderAuthNav() {
    var nav = document.getElementById('authNav');
    if (!nav) return;

    var user = getCurrentUser();
    if (user) {
      var html = '';
      html += '<a href="/my-answers/">Мои ответы</a>';
      if (user.role === 'admin') {
        html += '<a href="/admin/">Админка</a>';
      }
      html += '<span class="nav-user">' + user.name + '</span>';
      html += '<a href="#" id="logoutBtn" class="nav-logout">Выйти</a>';
      nav.innerHTML = html;

      var logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
          e.preventDefault();
          logout();
        });
      }
    } else {
      nav.innerHTML = '<a href="/login/">Войти</a>';
    }
  }

  // Mobile nav toggle
  function initNavToggle() {
    var toggle = document.getElementById('navToggle');
    var nav = document.querySelector('.main-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', function() {
        nav.classList.toggle('open');
      });
    }
  }

  // Login form handler
  function initLoginForm() {
    var form = document.getElementById('loginForm');
    if (!form) return;

    // If already logged in, redirect
    var user = getCurrentUser();
    if (user) {
      window.location.href = '/lessons/';
      return;
    }

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var username = document.getElementById('username').value.trim();
      var password = document.getElementById('password').value;
      var errorEl = document.getElementById('loginError');

      var result = login(username, password);
      if (result) {
        window.location.href = '/lessons/';
      } else {
        errorEl.classList.add('visible');
      }
    });
  }

  // Expose API
  window.BibleAuth = {
    getUsers: getUsers,
    saveUsers: saveUsers,
    getCurrentUser: getCurrentUser,
    setCurrentUser: setCurrentUser,
    login: login,
    logout: logout
  };

  // Init on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    renderAuthNav();
    initNavToggle();
    initLoginForm();
  });
})();
