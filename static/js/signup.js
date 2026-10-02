(async function () {
  'use strict';

  const auth = window.ZipaiAuth;
  const form = document.getElementById('signupForm');

  if (!auth || !form) return;
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

  const password = form.elements.password;
  const passwordConfirm = form.elements.passwordConfirm;
  const verificationMessage = document.getElementById('verificationMessage');
  let verifiedDestination = '';

  function verificationDestination() {
    return form.elements.verificationChannel.value === 'sms' ? form.elements.phone.value : form.elements.email.value;
  }
  async function verificationApi(path, body) {
    const response = await fetch(path, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const payload = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(payload.message || '인증 요청을 처리하지 못했습니다.');
    return payload;
  }
  [form.elements.email, form.elements.phone, form.elements.verificationChannel].forEach(function (control) {
    control.addEventListener('input', function () { verifiedDestination = ''; verificationMessage.textContent = '연락처가 바뀌었습니다. 다시 인증해 주세요.'; });
  });
  document.getElementById('sendVerification').addEventListener('click', async function () {
    const button = this, destination = verificationDestination();
    if (!destination) { verificationMessage.textContent = '인증할 이메일 또는 휴대폰 번호를 입력해 주세요.'; return; }
    button.disabled = true;
    try {
      const payload = await verificationApi('/api/auth/verification/send', { purpose: 'identity', channel: form.elements.verificationChannel.value, destination: destination });
      verificationMessage.textContent = payload.demoCode ? '로컬 시연용 인증번호: ' + payload.demoCode : '인증번호를 발송했습니다. 5분 안에 입력해 주세요.';
    } catch (error) { verificationMessage.textContent = error.message; } finally { button.disabled = false; }
  });
  document.getElementById('verifyCode').addEventListener('click', async function () {
    const button = this, destination = verificationDestination(); button.disabled = true;
    try {
      await verificationApi('/api/auth/verification/verify', { purpose: 'identity', channel: form.elements.verificationChannel.value, destination: destination, code: form.elements.verificationCode.value });
      verifiedDestination = destination; verificationMessage.textContent = '본인 인증이 완료되었습니다.';
    } catch (error) { verifiedDestination = ''; verificationMessage.textContent = error.message; } finally { button.disabled = false; }
  });

  function validatePasswordMatch() {
    const hasValues = password.value && passwordConfirm.value;
    const message = hasValues && password.value !== passwordConfirm.value ? '비밀번호가 일치하지 않습니다.' : '';
    passwordConfirm.setCustomValidity(message);
  }

  password.addEventListener('input', validatePasswordMatch);
  passwordConfirm.addEventListener('input', validatePasswordMatch);

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    validatePasswordMatch();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (verifiedDestination !== verificationDestination()) { verificationMessage.textContent = '이메일 또는 휴대폰 인증을 완료해 주세요.'; return; }

    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      await auth.signup({
        userId: form.elements.userId.value,
        email: form.elements.email.value,
        phone: form.elements.phone.value,
        password: form.elements.password.value
        ,verificationChannel: form.elements.verificationChannel.value
      });
      form.reset();
      window.location.href = auth.resolvePage('index.html');
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
