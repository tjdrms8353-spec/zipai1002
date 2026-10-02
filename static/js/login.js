(async function () {
  'use strict';

  const auth = window.ZipaiAuth;
  const form = document.getElementById('loginForm');

  if (!auth || !form) return;
  const oauthError = new URLSearchParams(window.location.search).get('oauthError');
  if (oauthError) {
    const message = document.createElement('p');
    message.className = 'login-page-error';
    message.textContent = oauthError;
    form.insertAdjacentElement('afterend', message);
  }
  fetch('/api/auth/oauth/providers', { credentials: 'same-origin' }).then(function (response) { return response.json(); }).then(function (payload) {
    document.querySelectorAll('[href*="/api/auth/oauth/"]').forEach(function (link) {
      const provider = link.href.includes('/kakao/') ? 'kakao' : 'google';
      if (!payload.providers || !payload.providers[provider]) {
        link.removeAttribute('href'); link.setAttribute('aria-disabled', 'true');
        link.title = '관리자 OAuth 설정 후 사용할 수 있습니다.';
      }
    });
  }).catch(function () {});
  await auth.ready;
  if (auth.getUser()) {
    window.location.replace(auth.resolvePage('index.html'));
    return;
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      await auth.login({
        userId: form.elements.userId.value,
        password: form.elements.password.value
      });
      form.reset();
      let returnPath = '';
      try {
        returnPath = sessionStorage.getItem('zipaiReturnAfterLogin') || '';
        sessionStorage.removeItem('zipaiReturnAfterLogin');
      } catch (storageError) { /* 기본 페이지로 이동 */ }
      window.location.href = returnPath.startsWith('/') && !returnPath.startsWith('//')
        ? returnPath
        : auth.resolvePage('index.html');
    } catch (error) {
      let message = form.querySelector('.login-page-error');
      if (!message) {
        message = document.createElement('p');
        message.className = 'login-page-error';
        form.appendChild(message);
      }
      message.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });
})();
