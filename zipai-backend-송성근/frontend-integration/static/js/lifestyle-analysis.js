(async function () {
  'use strict';

  let rooms = [];
  let selectedRoomId = '';
  let isAdmin = false;
  const visitKey = 'zipaiRoomVisits';
  const offerKey = 'zipaiRoomOffers';
  let visitCache = [];
  let offerCache = [];
  const roomList = document.getElementById('availableRooms');
  const visitForm = document.getElementById('visitForm');
  const visitDate = visitForm.elements.date;
  const visitTime = document.getElementById('visitTime');
  const offerForm = document.getElementById('offerForm');
  const toast = document.getElementById('roomToast');
  const hero = document.getElementById('roomHero');
  const heroBackground = hero.querySelector('.room-hero-background');
  const stageControls = Array.from(document.querySelectorAll('.journey-row[data-stage]'));
  const stageImages = {
    select: '../../static/images/room-connect/room-select.png',
    reserve: '../../static/images/room-connect/visit-reservation.png',
    schedule: '../../static/images/room-connect/schedule-confirmation.png',
    contract: '../../static/images/room-connect/safe-contract.png'
  };
  let activeStage = 'select';
  let backgroundTimer = 0;

  Object.keys(stageImages).forEach(function (stage) {
    const image = new Image();
    image.src = stageImages[stage];
  });

  function showStage(stage, commit) {
    if (!stageImages[stage]) return;
    if (commit) activeStage = stage;
    window.clearTimeout(backgroundTimer);
    heroBackground.classList.add('is-switching');
    backgroundTimer = window.setTimeout(function () {
      heroBackground.style.backgroundImage = 'url("' + stageImages[stage] + '")';
      hero.dataset.stage = stage;
      heroBackground.classList.remove('is-switching');
    }, 120);
    stageControls.forEach(function (control) {
      const active = control.dataset.stage === stage;
      control.classList.toggle('is-active', active);
      if (active) control.setAttribute('aria-current', 'step');
      else control.removeAttribute('aria-current');
    });
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function read(key) {
    if (key === visitKey) return visitCache;
    if (key === offerKey) return offerCache;
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function save(key, value) {
    if (key === visitKey) visitCache = value;
    if (key === offerKey) offerCache = value;
  }

  async function api(path, options) {
    const response = await fetch(path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...options });
    const payload = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(payload.message || '서버 요청을 처리하지 못했습니다.');
    return payload;
  }

  async function loadServerActivity() {
    const results = await Promise.all([api(isAdmin ? '/api/admin/visits?size=100' : '/api/visits'), api('/api/room-offers')]);
    visitCache = results[0].items || [];
    offerCache = results[1].items || [];
  }

  function storedFavoriteDetails() {
    try {
      const value = JSON.parse(localStorage.getItem('zipaiFavoriteProperties') || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) { return []; }
  }

  function priceLabel(room) {
    const deposit = Number(room.deposit || 0).toLocaleString('ko-KR');
    if (room.deal === 'jeonse' || !Number(room.monthly || 0)) return '전세 ' + deposit + '만 원';
    return deposit + ' / ' + Number(room.monthly || 0).toLocaleString('ko-KR') + '만 원';
  }

  async function loadFavoriteRooms() {
    if (window.ZipaiAuth) await window.ZipaiAuth.ready;
    const saved = storedFavoriteDetails();
    const details = new Map(saved.map(function (item) { return [String(item.id), item]; }));
    let ids = [];
    if (window.ZipaiAuth && window.ZipaiAuth.getUser()) {
      const results = await Promise.all([api('/api/favorites'), api('/api/general-properties')]);
      ids = (results[0].ids || []).map(String);
      (results[1].items || []).forEach(function (item) { if (!details.has(String(item.id))) details.set(String(item.id), item); });
    } else {
      try { ids = JSON.parse(localStorage.getItem('zipdosoFavorites') || '[]').map(String); } catch (error) { ids = []; }
    }
    rooms = ids.map(function (id) {
      const item = details.get(id) || { id: id, title: '찜한 매물 #' + id, address: '메인 매물 찾기에서 상세 정보를 다시 확인해 주세요.' };
      return {
        id: String(item.id), title: item.title || '찜한 매물 #' + id,
        area: item.address || item.area || '주소 정보 없음', price: priceLabel(item),
        time: item.walk || '방문 시간 협의', imageUrl: item.imageUrl || '/static/img/properties/studio.jpg'
      };
    });
    selectedRoomId = rooms.length ? rooms[0].id : '';
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.setTimeout(function () { toast.classList.remove('is-visible'); }, 2400);
  }

  function renderRooms() {
    if (!rooms.length) {
      roomList.innerHTML = '<div class="favorite-room-empty"><i class="fa-regular fa-heart"></i><strong>찜한 매물이 없습니다.</strong><p>매물 찾기에서 관심 있는 매물을 찜한 뒤 다시 확인해 주세요.</p><a href="../../index.html">매물 찾으러 가기</a></div>';
      return;
    }
    const selected = rooms.find(function (room) { return room.id === selectedRoomId; }) || rooms[0];
    roomList.innerHTML = '<div class="favorite-room-picker"><label for="favoriteRoomSelect">찜한 매물 선택 <b>' + rooms.length + '개</b></label><select id="favoriteRoomSelect">' + rooms.map(function (room) {
      return '<option value="' + escapeHtml(room.id) + '"' + (room.id === selected.id ? ' selected' : '') + '>' + escapeHtml(room.title) + '</option>';
    }).join('') + '</select></div>' +
      '<button class="visit-room-card is-selected" type="button" data-room="' + escapeHtml(selected.id) + '">' +
        '<span class="visit-room-photo"><img src="' + escapeHtml(selected.imageUrl) + '" alt="' + escapeHtml(selected.title) + ' 대표 이미지"></span>' +
        '<span class="visit-room-copy"><span>방문 가능</span><h3>' + escapeHtml(selected.title) + '</h3><p>' + escapeHtml(selected.area) + '</p>' +
        '<span class="room-meta"><strong>' + escapeHtml(selected.price) + '</strong><small>' + escapeHtml(selected.time) + '</small></span></span></button>';
  }

  function approvedSlot(roomId, date, time, ignoredId) {
    return read(visitKey).some(function (visit) {
      return visit.status === 'approved' && visit.roomId === roomId && visit.date === date && visit.time === time && visit.id !== ignoredId;
    });
  }

  function updateTimeOptions() {
    const roomId = document.getElementById('visitRoom').value;
    const date = visitDate.value;
    const previous = visitTime.value;
    if (!roomId || !date) {
      visitTime.innerHTML = '<option value="">날짜와 방을 먼저 선택해 주세요</option>';
      visitTime.disabled = true;
      return;
    }
    visitTime.disabled = false;
    visitTime.innerHTML = '<option value="">시간 선택</option>' + Array.from({ length: 24 }, function (_, hour) {
      const time = String(hour).padStart(2, '0') + ':00';
      const closed = approvedSlot(roomId, date, time);
      return '<option value="' + time + '"' + (closed ? ' disabled' : '') + '>' + time + (closed ? ' (마감)' : '') + '</option>';
    }).join('');
    if (previous && !approvedSlot(roomId, date, previous)) visitTime.value = previous;
  }

  function selectRoom(id) {
    const room = rooms.find(function (item) { return item.id === id; });
    if (!room) return;
    document.getElementById('visitRoom').value = room.id;
    document.getElementById('selectedRoomName').value = room.title;
    document.querySelectorAll('[data-room]').forEach(function (button) {
      button.classList.toggle('is-selected', button.dataset.room === room.id);
    });
    updateTimeOptions();
  }

  function renderActivity() {
    const visits = read(visitKey);
    const offers = read(offerKey);
    document.getElementById('visitCount').textContent = visits.length + '건';
    document.getElementById('offerCount').textContent = offers.length + '건';
    document.getElementById('visitList').innerHTML = visits.length ? visits.map(function (item) {
      const status = item.status || 'pending';
      const statusText = ({pending:'승인 대기',reschedule_requested:'일정 변경 승인 대기',approved:'예약 확정',rejected:'요청 거절',cancelled_by_user:'사용자 취소',cancelled_by_admin:'관리자 취소',completed:'방문 완료',no_show:'노쇼'})[status] || status;
      const actions = isAdmin && status === 'pending'
        ? '<div class="approval-actions"><button type="button" data-action="approve" data-visit-id="' + item.id + '">승인</button><button type="button" data-action="reject" data-visit-id="' + item.id + '">거절</button></div>'
        : (!isAdmin && ['pending','reschedule_requested','approved'].includes(status)
          ? '<div class="approval-actions"><button type="button" data-member-action="reschedule" data-visit-id="' + item.id + '">일정 변경</button><button type="button" data-member-action="cancel" data-visit-id="' + item.id + '">예약 취소</button></div>' : '');
      const reason=item.decisionReason?'<small class="visit-reason">처리 사유: '+escapeHtml(item.decisionReason)+'</small>':'';
      const note=item.userMessage?'<small class="visit-note">관리자 안내: '+escapeHtml(item.userMessage)+'</small>':'';
      return '<div class="activity-item" data-visit-row="'+item.id+'"><div><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.date) + ' · ' + escapeHtml(item.time) + ' · ' + escapeHtml(item.phone) + '</small><small>문의: '+escapeHtml(item.question||'없음')+'</small>'+reason+note+actions+'</div><span class="activity-status is-' + status + '">' + statusText + '</span></div>';
    }).join('') : '<div class="activity-empty">신청한 방문 일정이 없습니다.</div>';
    document.getElementById('offerList').innerHTML = offers.length ? offers.map(function (item) {
      return '<div class="activity-item"><div><strong>' + escapeHtml(item.title) + '</strong><small>입주 가능 ' + escapeHtml(item.moveIn) + ' · ' + escapeHtml(item.agreement) + '</small></div><span class="activity-status">연결 준비</span></div>';
    }).join('') : '<div class="activity-empty">내놓은 방이 없습니다.</div>';
  }

  roomList.addEventListener('click', function (event) {
    const card = event.target.closest('[data-room]');
    if (!card) return;
    selectRoom(card.dataset.room);
    visitForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  roomList.addEventListener('change', function (event) {
    if (event.target.id !== 'favoriteRoomSelect') return;
    selectedRoomId = event.target.value;
    renderRooms();
    selectRoom(selectedRoomId);
  });
  visitDate.addEventListener('change', updateTimeOptions);

  visitForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const data = new FormData(visitForm);
    const room = rooms.find(function (item) { return item.id === data.get('room'); });
    if (!room) {
      showToast('방문할 방을 먼저 선택해 주세요.');
      return;
    }
    if (!data.get('time') || approvedSlot(room.id, data.get('date'), data.get('time'))) {
      showToast('이미 마감된 시간이므로 다른 시간을 선택해 주세요.');
      updateTimeOptions();
      return;
    }
    try {
      const payload = await api('/api/visits', { method: 'POST', body: JSON.stringify({ roomId: room.id, title: room.title, date: data.get('date'), time: data.get('time'), phone: data.get('phone'), question: data.get('question') }) });
      visitCache.unshift(payload.item);
    } catch (error) {
      showToast(error.message);
      return;
    }
    visitForm.reset();
    document.getElementById('selectedRoomName').value = '방을 먼저 선택해 주세요';
    document.querySelectorAll('[data-room]').forEach(function (button) { button.classList.remove('is-selected'); });
    updateTimeOptions();
    renderActivity();
    showToast('방문 승인 요청이 접수되었습니다.');
  });

  document.getElementById('visitList').addEventListener('click', async function (event) {
    const memberButton=event.target.closest('[data-member-action]');
    if(memberButton&&!isAdmin){
      const id=Number(memberButton.dataset.visitId),visit=read(visitKey).find(function(item){return item.id===id;});if(!visit)return;
      try{
        if(memberButton.dataset.memberAction==='cancel'){
          const reason=window.prompt('예약 취소 사유를 입력해 주세요.');if(reason===null)return;
          await api('/api/visits/'+id+'/cancel',{method:'PATCH',body:JSON.stringify({reason:reason})});
          showToast('방문 예약을 취소했습니다.');
        }else{
          const date=window.prompt('변경할 날짜를 YYYY-MM-DD 형식으로 입력해 주세요.',visit.date);if(date===null)return;
          const time=window.prompt('변경할 시간을 HH:00 형식으로 입력해 주세요.',String(visit.time).slice(0,5));if(time===null)return;
          const reason=window.prompt('일정 변경 사유를 입력해 주세요.','일정 변경을 요청합니다.');if(reason===null)return;
          await api('/api/visits/'+id+'/reschedule',{method:'PATCH',body:JSON.stringify({date:date,time:time,reason:reason})});
          showToast('일정 변경 요청을 접수했습니다.');
        }
        await loadServerActivity();renderActivity();updateTimeOptions();
      }catch(error){showToast(error.message);}return;
    }
    const button = event.target.closest('[data-visit-id]');
    if (!button || !isAdmin) return;
    const id = Number(button.dataset.visitId);
    const visits = read(visitKey);
    const visit = visits.find(function (item) { return item.id === id; });
    if (!visit || (visit.status && visit.status !== 'pending')) return;
    try {
      const action = button.dataset.action === 'approve' ? 'approve' : 'reject';
      const payload = await api('/api/visits/' + visit.id + '/' + action, { method: 'PATCH', body: '{}' });
      Object.assign(visit, payload.item);
      showToast(action === 'approve' ? '방문 요청을 승인했습니다. 예약이 확정되었습니다.' : '방문 요청을 거절했습니다.');
    } catch (error) {
      showToast(error.message);
      return;
    }
    renderActivity();
    updateTimeOptions();
  });

  offerForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const data = new FormData(offerForm);
    const offer = {
      title: data.get('title'), district: data.get('district'),
      deposit: data.get('deposit'), monthly: data.get('monthly'), maintenance: data.get('maintenance'),
      contractEnd: data.get('contractEnd'), moveIn: data.get('moveIn'),
      availableTime: data.get('availableTime'), agreement: data.get('agreement'), description: data.get('description')
    };
    try {
      const payload = await api('/api/room-offers', { method: 'POST', body: JSON.stringify(offer) });
      offerCache.unshift(payload.item);
    } catch (error) {
      showToast(error.message);
      return;
    }
    offerForm.reset();
    renderActivity();
    showToast('퇴실 예정 방이 등록되었습니다.');
    document.getElementById('activitySection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.querySelectorAll('[data-scroll]').forEach(function (button) {
    button.addEventListener('click', function () {
      document.getElementById(button.dataset.scroll).scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  stageControls.forEach(function (control) {
    control.addEventListener('mouseenter', function () { showStage(control.dataset.stage, false); });
    control.addEventListener('focus', function () { showStage(control.dataset.stage, false); });
    control.addEventListener('mouseleave', function () { showStage(activeStage, false); });
    control.addEventListener('blur', function () { showStage(activeStage, false); });
    if (control.tagName === 'BUTTON') {
      control.addEventListener('click', function () {
        showStage(control.dataset.stage, true);
        const target = document.getElementById(control.dataset.target);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  });

  if ('IntersectionObserver' in window) {
    const sectionStages = [
      { element: document.getElementById('availableRooms'), stage: 'select' },
      { element: document.getElementById('visitForm'), stage: 'reserve' },
      { element: document.getElementById('activitySection'), stage: 'schedule' }
    ];
    const stageObserver = new IntersectionObserver(function (entries) {
      const visible = entries.filter(function (entry) { return entry.isIntersecting; }).sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
      if (!visible) return;
      const match = sectionStages.find(function (item) { return item.element === visible.target; });
      if (match) {
        activeStage = match.stage;
        stageControls.forEach(function (control) {
          const active = control.dataset.stage === activeStage;
          control.classList.toggle('is-active', active);
          if (active) control.setAttribute('aria-current', 'step');
          else control.removeAttribute('aria-current');
        });
      }
    }, { threshold: [0.35, 0.6] });
    sectionStages.forEach(function (item) { if (item.element) stageObserver.observe(item.element); });
  }

  if (window.ZipaiAuth) await window.ZipaiAuth.ready;
  isAdmin = Boolean(window.ZipaiAuth && window.ZipaiAuth.getUser() && window.ZipaiAuth.getUser().role === 'admin');
  document.getElementById('visitActivityTitle').textContent = isAdmin ? '방문 요청 관리' : '내 방문 신청 현황';
  document.getElementById('visitActivityDescription').textContent = isAdmin
    ? '관리자 권한으로 전체 방문 요청을 확인하고 승인하거나 거절할 수 있습니다.'
    : '내가 신청한 방문 일정과 관리자의 승인·거절 결과만 확인할 수 있습니다.';
  try {
    await Promise.all([loadFavoriteRooms(), loadServerActivity()]);
  } catch (error) {
    showToast(error.message);
  }
  renderRooms();
  renderActivity();
  const linkedVisit=new URLSearchParams(location.search).get('visit');
  if(linkedVisit){const row=document.querySelector('[data-visit-row="'+CSS.escape(linkedVisit)+'"]');if(row){row.classList.add('is-linked');row.scrollIntoView({behavior:'smooth',block:'center'});}}
  updateTimeOptions();
})();
