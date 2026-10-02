(function () {
  'use strict';

  const loaderScript = document.currentScript;
  const staticRoot = loaderScript
    ? new URL('../', loaderScript.src)
    : new URL('../../static/', window.location.href);

  function ensureStyle(fileName) {
    const href = new URL('css/' + fileName, staticRoot).href;
    const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find(function (link) {
      return new URL(link.href, window.location.href).pathname === new URL(href).pathname;
    });
    if (existing) {
      if (existing.sheet) return Promise.resolve();
      return new Promise(function (resolve) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', resolve, { once: true });
      });
    }

    return new Promise(function (resolve) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.addEventListener('load', resolve, { once: true });
      link.addEventListener('error', resolve, { once: true });
      document.head.appendChild(link);
    });
  }

  function componentFromHtml(html, selector) {
    const documentFragment = new DOMParser().parseFromString(html, 'text/html');
    return documentFragment.querySelector(selector);
  }

  function setupHeader(header) {
    const menuButton = header.querySelector('.menu-toggle');
    const headerMenu = header.querySelector('.header-menu');
    if (menuButton && headerMenu) {
      menuButton.addEventListener('click', function () {
        const isOpen = headerMenu.classList.toggle('is-open');
        menuButton.setAttribute('aria-expanded', String(isOpen));
      });
    }

    const page = (window.location.pathname.split('/').pop() || '').toLowerCase();
    const activePage = /^trend[1-4]\.html$/.test(page) ? 'trend1.html' : page;
    header.querySelectorAll('.menu-links a').forEach(function (link) {
      const target = (link.getAttribute('href') || '').split('/').pop().toLowerCase();
      const active = target === activePage;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function loadCommonLayout() {
    const headerTarget = document.querySelector('.zipai-header');
    const footerTarget = document.querySelector('.zipai-footer');
    const stylesReady = Promise.all([
      ensureStyle('common.css'),
      ensureStyle('header.css'),
      ensureStyle('footer.css')
    ]);

    const headerRequest = headerTarget
      ? Promise.all([stylesReady, fetch('../common/header.html')]).then(function (results) {
          const response = results[1];
          if (!response.ok) throw new Error('공통 헤더를 불러오지 못했습니다.');
          return response.text();
        }).then(function (html) {
          const header = componentFromHtml(html, '.zipai-header');
          if (!header) return;
          headerTarget.replaceWith(header);
          setupHeader(header);
        })
      : Promise.resolve();

    const footerRequest = footerTarget
      ? Promise.all([stylesReady, fetch('../common/footer.html')]).then(function (results) {
          const response = results[1];
          if (!response.ok) throw new Error('공통 푸터를 불러오지 못했습니다.');
          return response.text();
        }).then(function (html) {
          const footer = componentFromHtml(html, '.zipai-footer');
          if (footer) footerTarget.replaceWith(footer);
        })
      : Promise.resolve();

    Promise.all([headerRequest, footerRequest]).then(function () {
      if (window.ZipaiAuth) window.ZipaiAuth.updateLoginButtons();
    }).catch(function (error) {
      console.warn(error.message);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCommonLayout);
  } else {
    loadCommonLayout();
  }
})();
