(function () {
  'use strict';

  const menuButton = document.querySelector('.menu-button');
  if (menuButton) {
    menuButton.addEventListener('click', function () {
      const open = this.classList.toggle('open');
      this.setAttribute('aria-expanded', String(open));
    });
  }

  document.querySelectorAll('a[href="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      showToast('이 메뉴는 데모 화면에서 제공되지 않아요.');
    });
  });

  document.querySelectorAll('.login-button').forEach(function (button) {
    button.addEventListener('click', function () {
      showToast('로그인 기능은 플랫폼 연동 후 사용할 수 있어요.');
    });
  });

  window.showToast = function (message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 2400);
  };

  window.safeStorage = {
    get: function (key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
      } catch (error) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        return false;
      }
    },
    remove: function (key) {
      try { localStorage.removeItem(key); } catch (error) { /* no-op */ }
    }
  };

  window.zipaiUserStorageKey = function (key, user) {
    if (!user || !user.id) throw new Error('로그인 사용자 정보가 필요합니다.');
    return key + ':' + encodeURIComponent(String(user.id));
  };

  window.requireZipaiUser = async function () {
    if (document.readyState === 'loading') {
      await new Promise(function (resolve) { document.addEventListener('DOMContentLoaded', resolve, { once: true }); });
    }
    const auth = window.ZipaiAuth;
    if (!auth) return null;
    await auth.ready;
    const user = auth.getUser();
    if (user) return user;

    try {
      const returnPath = window.location.pathname + window.location.search + window.location.hash;
      sessionStorage.setItem('zipaiReturnAfterLogin', returnPath);
    } catch (error) { /* 로그인 화면으로 이동하는 기능은 유지 */ }
    window.location.replace(auth.resolvePage('login.html'));
    return null;
  };
})();
