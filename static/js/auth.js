(function () {
  'use strict';

  const STORAGE_KEY = 'zipaiDemoUser';
  const PAGE_PATHS = {
    'index.html': 'index.html',
    'finance-policy.html': 'templates/board/finance-policy.html',
    'trend1.html': 'templates/board/trend1.html',
    'trend2.html': 'templates/board/trend2.html',
    'trend3.html': 'templates/board/trend3.html',
    'trend4.html': 'templates/board/trend4.html',
    'safety.html': 'templates/safe/safety.html',
    'happy-housing.html': 'templates/board/happy-housing.html',
    'customer-center.html': 'templates/board/customer-center.html',
    'community.html': 'templates/board/community.html',
    'community-detail.html': 'templates/board/community-detail.html',
    'admin.html': 'templates/admin/admin.html',
    'login.html': 'templates/member/login.html',
    'signup.html': 'templates/member/signup.html',
    'mypage.html': 'templates/member/mypage.html',
    'account.html': 'templates/member/account.html',
    'lifestyle-analysis.html': 'templates/ai/lifestyle-analysis.html',
    'sub33.html': 'templates/defense/fraud_result.html',
    'fraud_result.html': 'templates/defense/fraud_result.html',
    'checklist.html': 'templates/defense/checklist.html',
    'jeonse-calculator.html': 'templates/defense/charter-rate-calculator.html',
    'charter-rate-calculator.html': 'templates/defense/charter-rate-calculator.html',
    'contract-guide.html': 'templates/defense/contract-guide.html'
  };
  const PAGE_ALIASES = {
    'sub33.html': 'fraud_result.html',
    'jeonse-calculator.html': 'charter-rate-calculator.html'
  };
  let memoryUser = null;
  let authReady;

  function getRootPrefix() {
    return window.location.pathname.replace(/\\/g, '/').includes('/templates/') ? '../../' : '';
  }

  function getPageName(href) {
    const path = String(href || '').split('#')[0].split('?')[0].replace(/\\/g, '/');
    const page = (path.split('/').pop() || '').toLowerCase();
    return PAGE_ALIASES[page] || page;
  }

  function resolvePage(href) {
    const value = String(href || '');
    if (!value || value === '#' || value.charAt(0) === '#' || /^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
    const parts = value.split('#');
    const cleanPath = parts[0].replace(/\\/g, '/').replace(/^(\.\.\/)+/, '').replace(/^\.\//, '').toLowerCase();
    const pageName = getPageName(cleanPath);
    const target = PAGE_PATHS[cleanPath] || PAGE_PATHS[pageName] || parts[0];
    return getRootPrefix() + target + (parts[1] ? '#' + parts[1] : '');
  }

  function getUser() {
    try {
      const sessionUser = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
      if (sessionUser && sessionUser.id) return sessionUser;
      const persistedUser = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (persistedUser && persistedUser.id) {
        memoryUser = persistedUser;
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persistedUser)); } catch (error) { /* 현재 탭에서만 복원 */ }
        return persistedUser;
      }
      return memoryUser;
    } catch (error) {
      return memoryUser;
    }
  }

  function storeUser(user) {
    const normalized = { ...user, loginAt: user.loginAt || new Date().toISOString() };
    memoryUser = normalized;
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)); } catch (error) { /* 현재 페이지에서만 유지될 수 있음 */ }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)); } catch (error) { /* 현재 탭 로그인은 유지 */ }
    return normalized;
  }

  function clearUser() {
    memoryUser = null;
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (error) { /* 이미 로그아웃된 상태로 처리 */ }
    try { localStorage.removeItem(STORAGE_KEY); } catch (error) { /* 이미 로그아웃된 상태로 처리 */ }
  }

  async function requestAuth(path, options) {
    let response;
    try {
      response = await fetch('/api/auth/' + path, {
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
    } catch (error) {
      throw new Error('인증 서버에 연결할 수 없습니다. node server.js 실행 후 http://127.0.0.1:4173 주소로 접속해 주세요.');
    }
    const contentType = String(response.headers.get('content-type') || '');
    const payload = contentType.includes('application/json')
      ? await response.json().catch(function () { return {}; })
      : {};
    if (!response.ok) {
      if (!contentType.includes('application/json')) {
        throw new Error('현재 접속 주소(' + window.location.origin + ')에는 인증 API가 없습니다. http://127.0.0.1:4173/templates/member/signup.html 로 접속해 주세요.');
      }
      throw new Error(payload.message || '인증 요청을 처리하지 못했습니다. (HTTP ' + response.status + ')');
    }
    return payload;
  }

  async function refreshUser() {
    try {
      const payload = await requestAuth('me', { method: 'GET', headers: {} });
      if (payload.authenticated && payload.user) storeUser(payload.user);
      else clearUser();
    } catch (error) {
      /* 서버에 연결할 수 없는 경우 현재 화면의 캐시 상태를 유지합니다. */
    }
    updateLoginButtons();
    return getUser();
  }

  async function login(credentials) {
    const payload = await requestAuth('login', {
      method: 'POST',
      body: JSON.stringify(credentials || {})
    });
    return storeUser(payload.user);
  }

  async function signup(data) {
    const payload = await requestAuth('signup', {
      method: 'POST',
      body: JSON.stringify(data || {})
    });
    return storeUser(payload.user);
  }

  async function logout() {
    try {
      await requestAuth('logout', { method: 'POST', body: '{}' });
    } finally {
      clearUser();
      updateLoginButtons();
    }
  }

  function updateLoginButtons() {
    const user = getUser();
    document.querySelectorAll('.header-actions').forEach(function (container) {
      let communityLink = container.querySelector('.community-button');
      if (!communityLink) {
        communityLink = document.createElement('a');
        communityLink.className = 'community-button';
        communityLink.innerHTML = '<i class="fa-solid fa-pen-to-square" aria-hidden="true"></i><span>게시판</span>';
        const loginButton = container.querySelector('.login-button');
        container.insertBefore(communityLink, loginButton || container.firstChild);
      }
      communityLink.href = resolvePage('community.html');
      const active = ['community.html', 'community-detail.html'].includes(getCurrentPage());
      communityLink.classList.toggle('active', active);
      if (active) communityLink.setAttribute('aria-current', 'page');
      else communityLink.removeAttribute('aria-current');
    });
    document.querySelectorAll('.login-button').forEach(function (button) {
      const icon = document.createElement('i');
      const label = document.createElement('span');
      button.href = resolvePage(user ? 'mypage.html' : 'login.html');
      button.classList.toggle('is-authenticated', Boolean(user));
      button.setAttribute('aria-label', user ? user.id + ' 계정 페이지로 이동' : '로그인 페이지로 이동');
      icon.className = 'fa-solid ' + (user ? 'fa-user-check' : 'fa-user');
      icon.setAttribute('aria-hidden', 'true');
      label.className = 'auth-user-label';
      label.textContent = user ? user.id + '님' : '로그인';
      button.replaceChildren(icon, label);
    });
    document.querySelectorAll('.listing-button').forEach(function (button) {
      button.href = resolvePage('index.html#register-listing');
      button.setAttribute('aria-label', user ? '매물 등록 화면 열기' : '회원 전용 매물 등록 안내 열기');
    });

    document.querySelectorAll('.utility-signup-button').forEach(function (button) {
      button.href = resolvePage('signup.html');
      const shouldHideSignup = Boolean(user);
      button.hidden = shouldHideSignup;
      button.setAttribute('aria-hidden', String(shouldHideSignup));
    });

    document.querySelectorAll('.utility-links').forEach(function (container) {
      let mypageLink = container.querySelector('.utility-mypage');
      let adminLink = container.querySelector('.utility-admin');
      let notificationLink = container.querySelector('.utility-notifications');
      let logoutButton = container.querySelector('.utility-logout');
      if (!mypageLink) {
        mypageLink = document.createElement('a');
        mypageLink.className = 'utility-mypage';
        mypageLink.href = resolvePage('mypage.html');
        mypageLink.innerHTML = '<i class="fa-solid fa-user-gear" aria-hidden="true"></i><span>마이페이지</span>';
        container.appendChild(mypageLink);
      }
      if (!adminLink) {
        adminLink = document.createElement('a');
        adminLink.className = 'utility-admin';
        adminLink.href = resolvePage('admin.html');
        adminLink.innerHTML = '<i class="fa-solid fa-user-tie" aria-hidden="true"></i><span>관리자</span>';
        container.appendChild(adminLink);
      }
      if (!notificationLink) {
        notificationLink = document.createElement('a');
        notificationLink.className = 'utility-notifications';
        notificationLink.href = resolvePage('mypage.html') + '#notifications';
        notificationLink.innerHTML = '<i class="fa-solid fa-bell" aria-hidden="true"></i><span>알림</span>';
        container.insertBefore(notificationLink, mypageLink);
      }
      if (!logoutButton) {
        logoutButton = document.createElement('button');
        logoutButton.type = 'button';
        logoutButton.className = 'utility-logout';
        logoutButton.innerHTML = '<i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i><span>로그아웃</span>';
        mypageLink.insertAdjacentElement('afterend', logoutButton);
        logoutButton.addEventListener('click', async function () {
          logoutButton.disabled = true;
          try {
            await logout();
            window.location.href = resolvePage('index.html');
          } catch (error) {
            logoutButton.disabled = false;
          }
        });
      }
      mypageLink.hidden = !user;
      mypageLink.setAttribute('aria-hidden', String(!user));
      logoutButton.hidden = !user;
      logoutButton.setAttribute('aria-hidden', String(!user));
      notificationLink.hidden = !user;
      notificationLink.setAttribute('aria-hidden', String(!user));
      adminLink.hidden = !user || user.role !== 'admin';
      adminLink.setAttribute('aria-hidden', String(!user || user.role !== 'admin'));
      if (user) {
        let notificationPanel = document.getElementById('zipaiNotificationPanel');
        if (!notificationPanel) {
          notificationPanel = document.createElement('section');
          notificationPanel.id = 'zipaiNotificationPanel';
          notificationPanel.className = 'zipai-notification-panel';
          notificationPanel.hidden = true;
          notificationPanel.setAttribute('aria-label', '알림 목록');
          notificationPanel.innerHTML = '<div class="zipai-notification-head"><strong>알림</strong><button type="button" data-read-all>모두 읽음</button><button type="button" data-close aria-label="알림 닫기">×</button></div><div class="zipai-notification-list"></div><div class="zipai-notification-detail" hidden><button type="button" data-detail-back>← 알림 목록</button><span class="zipai-notification-detail-icon"><i class="fa-solid fa-bell"></i></span><h3></h3><time></time><p></p><a class="zipai-notification-go">해당 페이지로 바로가기 →</a></div>';
          document.body.appendChild(notificationPanel);
          notificationPanel.querySelector('[data-close]').addEventListener('click', function () { notificationPanel.hidden = true; });
          notificationPanel.querySelector('[data-detail-back]').addEventListener('click', function () { notificationPanel.querySelector('.zipai-notification-detail').hidden = true; notificationPanel.querySelector('.zipai-notification-list').hidden = false; });
        }
        const notificationTarget = function (item) {
          const id = encodeURIComponent(item.relatedId || '');
          if (item.relatedType === 'inquiry') return resolvePage('customer-center.html') + '?reply=' + id + '#inquiry-history';
          if (item.relatedType === 'visit') return resolvePage('lifestyle-analysis.html') + '?visit=' + id + '#activitySection';
          if (item.relatedType === 'property') return resolvePage('index.html') + '?property=' + id;
          if (item.relatedType === 'defense_report') return resolvePage('mypage.html') + '?report=' + id;
          return resolvePage('mypage.html');
        };
        const showNotificationDetail = function (item, button) {
          const detail = notificationPanel.querySelector('.zipai-notification-detail');
          notificationPanel.querySelector('.zipai-notification-list').hidden = true; detail.hidden = false;
          detail.querySelector('h3').textContent = item.title;
          detail.querySelector('time').textContent = new Date(item.createdAt).toLocaleString('ko-KR');
          detail.querySelector('p').textContent = item.message;
          const go = detail.querySelector('.zipai-notification-go'); go.href = notificationTarget(item);
          go.textContent = item.relatedType ? '해당 내용 상세 화면으로 이동 →' : '마이페이지로 이동 →';
          if (!item.readAt) fetch('/api/notifications/' + encodeURIComponent(item.id) + '/read', { method: 'PATCH', credentials: 'same-origin' }).then(loadNotifications);
          button.classList.remove('is-unread');
        };
        const renderNotifications = function (payload) {
          const list = notificationPanel.querySelector('.zipai-notification-list');
          list.replaceChildren();
          (payload.items || []).forEach(function (item) {
            const button = document.createElement('button');
            button.type = 'button'; button.className = 'zipai-notification-item';
            button.classList.toggle('is-unread', !item.readAt);
            const title = document.createElement('strong'), message = document.createElement('span'), time = document.createElement('small');
            title.textContent = item.title; message.textContent = item.message;
            time.textContent = new Date(item.createdAt).toLocaleString('ko-KR');
            button.append(title, message, time); list.appendChild(button);
            button.addEventListener('click', function () {
              showNotificationDetail(item, button);
            });
          });
          if (!list.children.length) list.textContent = '새 알림이 없습니다.';
          const label = notificationLink.querySelector('span');
          if (label) label.textContent = payload.unreadCount ? '알림 ' + payload.unreadCount : '알림';
        };
        const loadNotifications = function () { return fetch('/api/notifications', { credentials: 'same-origin' }).then(function (response) { return response.ok ? response.json() : null; }).then(function (payload) { if (payload) renderNotifications(payload); }); };
        if (!notificationLink.dataset.panelBound) {
          notificationLink.dataset.panelBound = 'true';
          notificationLink.addEventListener('click', function (event) { event.preventDefault(); notificationPanel.hidden = !notificationPanel.hidden; if (!notificationPanel.hidden) { notificationPanel.querySelector('.zipai-notification-detail').hidden=true;notificationPanel.querySelector('.zipai-notification-list').hidden=false;loadNotifications(); } });
          notificationPanel.querySelector('[data-read-all]').addEventListener('click', function () { fetch('/api/notifications/read-all', { method: 'PATCH', credentials: 'same-origin' }).then(loadNotifications); });
        }
        loadNotifications().catch(function () { /* 알림 표시는 부가 기능이므로 헤더 렌더링을 유지 */ });
      }
    });
  }

  function listingGateElement() {
    let gate = document.getElementById('listingMemberGate');
    if (gate) return gate;
    gate = document.createElement('div');
    gate.id = 'listingMemberGate';
    gate.className = 'listing-member-gate';
    gate.hidden = true;
    gate.innerHTML =
      '<section class="listing-member-card" role="dialog" aria-modal="true" aria-labelledby="listingMemberTitle">' +
        '<button class="listing-member-close" type="button" aria-label="안내 닫기">×</button>' +
        '<span class="listing-member-symbol"><i class="fa-solid fa-house-lock" aria-hidden="true"></i></span>' +
        '<small>MEMBERS ONLY</small><h2 id="listingMemberTitle">매물 등록은 회원만 이용할 수 있습니다</h2>' +
        '<p>회원가입 또는 로그인 후 매물 정보를 안전하게 등록하고 관리할 수 있습니다.</p>' +
        '<div class="listing-member-actions">' +
          '<a class="listing-member-primary" href="' + resolvePage('signup.html') + '"><i class="fa-solid fa-user-plus" aria-hidden="true"></i><span><strong>회원가입</strong><small>ZipAI 회원으로 시작하기</small></span></a>' +
          '<a href="' + resolvePage('login.html') + '"><i class="fa-solid fa-right-to-bracket" aria-hidden="true"></i><span><strong>로그인하기</strong><small>기존 계정으로 이용하기</small></span></a>' +
        '</div>' +
      '</section>';
    document.body.appendChild(gate);
    gate.querySelector('.listing-member-close').addEventListener('click', function () {
      gate.hidden = true;
      document.body.classList.remove('listing-gate-open');
    });
    gate.addEventListener('click', function (event) {
      if (event.target === gate) {
        gate.hidden = true;
        document.body.classList.remove('listing-gate-open');
      }
    });
    return gate;
  }

  function showListingMemberGate() {
    const gate = listingGateElement();
    gate.hidden = false;
    document.body.classList.add('listing-gate-open');
    gate.querySelector('.listing-member-close').focus();
  }

  function setupListingAccess() {
    if (document.documentElement.dataset.listingAccessReady === 'true') return;
    document.documentElement.dataset.listingAccessReady = 'true';
    document.addEventListener('click', function (event) {
      const trigger = event.target.closest('.listing-button,[href$="#register-listing"]');
      if (!trigger || getUser()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      showListingMemberGate();
    }, true);
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      const gate = document.getElementById('listingMemberGate');
      if (gate && !gate.hidden) {
        gate.hidden = true;
        document.body.classList.remove('listing-gate-open');
      }
    });
    if (!getUser() && window.location.hash === '#register-listing') {
      history.replaceState(null, '', window.location.pathname + window.location.search);
      showListingMemberGate();
    }
  }

  function getCurrentPage() {
    return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  }

  function setHeaderActiveLink(activePage) {
    const header = document.querySelector('.zipai-header');
    if (!header) return;
    const targetPage = getPageName(activePage);
    const currentPage = getCurrentPage();
    header.querySelectorAll('.menu-links a').forEach(function (link) {
      const isActive = getPageName(link.getAttribute('href')) === targetPage;
      link.classList.toggle('active', isActive);
      if (isActive && targetPage === currentPage) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function setupHeaderActiveState() {
    const currentPage = getCurrentPage();
    const fraudPages = ['fraud_result.html', 'charter-rate-calculator.html', 'contract-guide.html', 'checklist.html'];
    if (fraudPages.includes(currentPage)) {
      setHeaderActiveLink('fraud_result.html');
      return;
    }
    if (['trend1.html', 'trend2.html', 'trend3.html', 'trend4.html'].includes(currentPage)) {
      setHeaderActiveLink('trend1.html');
      return;
    }
    const readyPages = ['index.html', 'finance-policy.html', 'safety.html', 'happy-housing.html', 'lifestyle-analysis.html', 'community.html'];
    setHeaderActiveLink(readyPages.includes(currentPage) ? currentPage : '');
  }

  function setupPendingHeaderLinks() {
    const header = document.querySelector('.zipai-header');
    if (!header) return;
    const pendingHrefs = ['charter-rate-calculator.html', 'checklist.html'];
    header.querySelectorAll('.menu-links a').forEach(function (link) {
      const href = getPageName(link.getAttribute('href'));
      if (!pendingHrefs.includes(href) || link.dataset.pendingReady === 'true') return;
      link.dataset.pendingReady = 'true';
      link.dataset.originalHref = href;
      link.href = '#';
      link.setAttribute('aria-disabled', 'true');
      link.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setupHeaderActiveState();
      });
    });
  }

  function setupFraudSubnav() {
    const header = document.querySelector('.zipai-header');
    const fraudLink = header && Array.from(header.querySelectorAll('.menu-links a')).find(function (link) {
      return getPageName(link.getAttribute('href')) === 'fraud_result.html';
    });
    if (!header || !fraudLink || fraudLink.dataset.subnavReady === 'true') return;

    const items = [
      { href: 'fraud_result.html', label: '안전 진단 결과' },
      { href: 'checklist.html', label: '체크리스트' },
      { href: 'charter-rate-calculator.html', label: '전세가율 계산' },
      { href: 'contract-guide.html', label: '계약가이드' }
    ];
    const currentPage = getCurrentPage();
    const fraudPages = items.map(function (item) { return item.href.toLowerCase(); });
    let subnavWrap = document.querySelector('.subnav-wrap');
    const hasFraudSubnav = subnavWrap && subnavWrap.querySelector('nav[aria-label="사기방지 메뉴"]');

    if (!hasFraudSubnav) {
      subnavWrap = document.createElement('div');
      const nav = document.createElement('nav');
      subnavWrap.className = 'subnav-wrap';
      nav.className = 'subnav';
      nav.setAttribute('aria-label', '사기방지 메뉴');
      items.forEach(function (item) {
        const link = document.createElement('a');
        link.href = resolvePage(item.href);
        link.textContent = item.label;
        nav.appendChild(link);
      });
      subnavWrap.appendChild(nav);
      header.insertAdjacentElement('afterend', subnavWrap);
    }

    subnavWrap.classList.add('header-fraud-subnav');
    subnavWrap.querySelectorAll('.subnav a').forEach(function (link) {
      const href = getPageName(link.getAttribute('href'));
      link.classList.toggle('active', href === currentPage);
    });

    function setFraudSubnavOpen(isOpen) {
      subnavWrap.classList.toggle('is-open', isOpen);
      fraudLink.classList.toggle('is-subnav-open', isOpen);
      fraudLink.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) setHeaderActiveLink('fraud_result.html');
      else setupHeaderActiveState();
    }

    fraudLink.dataset.subnavReady = 'true';
    fraudLink.setAttribute('aria-haspopup', 'true');
    let fraudSubnavCloseTimer = 0;

    function openFraudSubnav() {
      clearTimeout(fraudSubnavCloseTimer);
      setFraudSubnavOpen(true);
    }

    function closeFraudSubnav() {
      clearTimeout(fraudSubnavCloseTimer);
      setFraudSubnavOpen(false);
    }

    function scheduleFraudSubnavClose() {
      clearTimeout(fraudSubnavCloseTimer);
      fraudSubnavCloseTimer = setTimeout(closeFraudSubnav, 160);
    }

    setFraudSubnavOpen(false);
    fraudLink.addEventListener('mouseenter', openFraudSubnav);
    fraudLink.addEventListener('focus', openFraudSubnav);
    fraudLink.addEventListener('mouseleave', scheduleFraudSubnavClose);
    subnavWrap.addEventListener('mouseenter', openFraudSubnav);
    subnavWrap.addEventListener('mouseleave', scheduleFraudSubnavClose);
    subnavWrap.addEventListener('focusin', openFraudSubnav);
    subnavWrap.addEventListener('focusout', function () {
      setTimeout(function () {
        if (!subnavWrap.contains(document.activeElement) && document.activeElement !== fraudLink) {
          scheduleFraudSubnavClose();
        }
      }, 0);
    });
    header.querySelectorAll('.menu-links a').forEach(function (link) {
      if (link === fraudLink) return;
      link.addEventListener('mouseenter', scheduleFraudSubnavClose);
      link.addEventListener('focus', scheduleFraudSubnavClose);
    });
    fraudLink.addEventListener('click', function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openFraudSubnav();
    });
  }

  window.ZipaiAuth = {
    getUser: getUser,
    login: login,
    signup: signup,
    logout: logout,
    refreshUser: refreshUser,
    refresh: refreshUser,
    get ready() { return authReady; },
    updateLoginButtons: updateLoginButtons,
    resolvePage: resolvePage
  };

  function initAuthUi() {
    setupListingAccess();
    updateLoginButtons();
    setupPendingHeaderLinks();
    setupHeaderActiveState();
    setupFraudSubnav();
    setupGlobalSearch();
  }

  function setupGlobalSearch() {
    document.querySelectorAll('.icon-button[aria-label="검색"]').forEach(function (button) {
      button.addEventListener('click', function () {
        const input = document.getElementById('searchInput');
        if (input) { input.scrollIntoView({ behavior: 'smooth', block: 'center' }); input.focus(); return; }
        window.location.href = resolvePage('index.html') + '?focusSearch=1#property-search';
      });
    });
    if (new URLSearchParams(window.location.search).get('focusSearch') === '1') {
      const input = document.getElementById('searchInput');
      if (input) setTimeout(function () { input.scrollIntoView({ behavior: 'smooth', block: 'center' }); input.focus(); }, 100);
    }
  }

  authReady = refreshUser();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAuthUi);
  else initAuthUi();
})();
