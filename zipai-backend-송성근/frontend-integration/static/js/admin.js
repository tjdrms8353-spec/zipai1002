(async function () {
  'use strict';

  const auth = window.ZipaiAuth;
  const deniedView = document.querySelector('[data-admin-view="denied"]');
  const adminView = document.querySelector('[data-admin-view="dashboard"]');
  const switchButton = document.getElementById('adminSwitchAccount');
  const logoutButton = document.getElementById('adminLogout');
  if (!auth || !deniedView || !adminView || !switchButton || !logoutButton) return;

  await auth.ready;
  const user = auth.getUser();
  const isAdmin = Boolean(user && user.role === 'admin');
  deniedView.hidden = isAdmin;
  adminView.hidden = !isAdmin;
  switchButton.addEventListener('click', logout);
  logoutButton.addEventListener('click', logout);
  async function logout() {
    await auth.logout();
    window.location.href = auth.resolvePage('login.html');
  }
  if (!isAdmin) return;

  const searchInput = document.getElementById('adminSearch');
  const categoryFilter = document.getElementById('adminCategoryFilter');
  const statusFilter = document.getElementById('adminStatusFilter');
  const list = document.getElementById('adminInquiryList');
  const empty = document.getElementById('adminEmpty');
  const resultCount = document.getElementById('adminResultCount');
  const detailEmpty = document.getElementById('adminDetailEmpty');
  const detailContent = document.getElementById('adminDetailContent');
  const statusSelect = document.getElementById('adminDetailStatus');
  const replyMessage = document.getElementById('adminReplyMessage');
  const statusLabels = { received: '접수', in_progress: '확인 중', answered: '답변 완료' };
  let selectedId = null;
  let items = [];
  let inquiryPage = 0, inquiryTotalPages = 1;
  document.getElementById('adminUserId').textContent = user.id;

  async function api(path, options) {
    const response = await fetch(path, {
      credentials: 'same-origin',
      headers: options && options.body ? { 'Content-Type': 'application/json' } : {},
      ...options
    });
    const payload = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(payload.message || '요청을 처리하지 못했습니다.');
    return payload;
  }

  function formatDate(value, withTime) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('ko-KR', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(date);
  }

  function filteredItems() {
    const query = searchInput.value.trim().toLowerCase();
    return items.filter(function (item) {
      if (categoryFilter.value && item.category !== categoryFilter.value) return false;
      if (statusFilter.value && item.status !== statusFilter.value) return false;
      return !query || [item.title, item.email, item.message, item.username].join(' ').toLowerCase().includes(query);
    });
  }

  function updateStats() {
    resultCount.textContent = items.length + '건';
  }

  async function loadDashboard() { const payload=await api('/api/admin/dashboard');const s=payload.statistics||{};document.getElementById('adminNewMembers').textContent=s.newMembers||0;document.getElementById('adminNewInquiries').textContent=s.newInquiries||0;document.getElementById('adminUnanswered').textContent=s.unansweredInquiries||0;document.getElementById('adminPendingProperties').textContent=s.pendingProperties||0;document.getElementById('adminActiveMembers').textContent=s.activeMembers||0;document.getElementById('adminPendingVisits').textContent=s.pendingVisits||0; }

  function renderDetail() {
    const item = items.find(function (entry) { return entry.id === selectedId; });
    detailEmpty.hidden = Boolean(item);
    detailContent.hidden = !item;
    if (!item) return;
    document.getElementById('adminDetailCategory').textContent = item.category;
    document.getElementById('adminDetailDate').textContent = formatDate(item.createdAt, true);
    document.getElementById('adminDetailDate').dateTime = item.createdAt;
    document.getElementById('adminDetailTitle').textContent = item.title;
    document.getElementById('adminDetailEmail').textContent = item.email;
    document.getElementById('adminDetailMessage').textContent = item.message;
    replyMessage.value = item.answer || '';
    statusSelect.value = item.status;
  }

  function render() {
    const visible = filteredItems();
    updateStats();
    list.replaceChildren();
    resultCount.textContent = visible.length + '건';
    empty.hidden = visible.length > 0;
    list.hidden = visible.length === 0;
    visible.forEach(function (item) {
      const button = document.createElement('button');
      const category = document.createElement('span');
      const copy = document.createElement('span');
      const title = document.createElement('strong');
      const meta = document.createElement('small');
      const status = document.createElement('span');
      button.type = 'button';
      button.className = 'admin-inquiry' + (item.id === selectedId ? ' is-active' : '');
      button.dataset.id = item.id;
      category.className = 'admin-inquiry-category';
      copy.className = 'admin-inquiry-copy';
      status.className = 'admin-status';
      category.textContent = item.category;
      title.textContent = item.title;
      meta.textContent = (item.username || item.email) + ' · ' + formatDate(item.createdAt, false);
      status.textContent = statusLabels[item.status] || item.status;
      status.dataset.status = item.status;
      copy.append(title, meta);
      button.append(category, copy, status);
      list.appendChild(button);
    });
    renderDetail();
  }

  async function load() {
    try {
      const params=new URLSearchParams({page:String(inquiryPage),size:'20',query:searchInput.value.trim(),status:statusFilter.value});
      const payload = await api('/api/admin/inquiries?' + params);
      items = payload.items || [];
      inquiryTotalPages=Math.max(1,payload.totalPages||1);if(inquiryPage>=inquiryTotalPages)inquiryPage=inquiryTotalPages-1;
      document.getElementById('adminInquiryPage').textContent=(inquiryPage+1)+' / '+inquiryTotalPages;document.getElementById('adminInquiryPrev').disabled=inquiryPage===0;document.getElementById('adminInquiryNext').disabled=inquiryPage+1>=inquiryTotalPages;
      render();
    } catch (error) {
      window.alert(error.message);
    }
  }

  async function loadProperties() {
    const target = document.getElementById('adminPropertyList');
    if (!target) return;
    try {
      const payload = await api('/api/admin/properties');
      target.replaceChildren();
      (payload.items || []).forEach(function (item) {
        const row = document.createElement('article');
        const copy = document.createElement('span');
        const title = document.createElement('strong');
        const meta = document.createElement('small');
        const actions = document.createElement('span');
        row.className = 'admin-inquiry';
        copy.className = 'admin-inquiry-copy';
        title.textContent = item.title || '제목 없는 매물';
        meta.textContent = (item.owner || '-') + ' · ' + item.status;
        copy.append(title, meta);
        ['approved', 'rejected', 'closed'].forEach(function (status) {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = status === 'approved' ? '승인' : status === 'rejected' ? '거절' : '종료';
          button.addEventListener('click', async function () {
            await api('/api/admin/properties/' + item.id + '/status', {
              method: 'PATCH', body: JSON.stringify({ status: status })
            });
            await loadProperties();
          });
          actions.appendChild(button);
        });
        row.append(copy, actions);
        target.appendChild(row);
      });
      if (!target.children.length) target.textContent = '검토할 등록 매물이 없습니다.';
    } catch (error) {
      target.textContent = error.message;
    }
  }

  async function loadPosts() {
    const target = document.getElementById('adminPostList');
    if (!target) return;
    try {
      const params=new URLSearchParams({query:document.getElementById('adminPostSearch').value.trim(),deleted:document.getElementById('adminPostDeleted').value});
      const payload = await api('/api/admin/community/posts?' + params);
      target.replaceChildren();
      (payload.items || []).forEach(function (item) {
        const row = document.createElement('article');
        const copy = document.createElement('span');
        const title = document.createElement('strong');
        const meta = document.createElement('small');
        const remove = document.createElement('button');
        row.className = 'admin-inquiry';
        copy.className = 'admin-inquiry-copy';
        title.textContent = item.title;
        meta.textContent = item.username + ' · ' + formatDate(item.created_at, false);
        remove.type = 'button';
        const deleted=document.getElementById('adminPostDeleted').value==='true';remove.textContent = deleted?'복구':'삭제';
        remove.addEventListener('click', async function () {
          if(deleted){if(!window.confirm('이 게시글을 복구할까요?'))return;await api('/api/admin/community/posts/'+item.id+'/restore',{method:'PATCH',body:'{}'});}else{if (!window.confirm('이 게시글을 삭제할까요?')) return;const reason=window.prompt('삭제 사유를 입력해 주세요.','운영 정책 위반');if(reason===null)return;await api('/api/admin/community/posts/' + item.id, { method: 'DELETE',body:JSON.stringify({reason:reason}) });}
          await loadPosts();
        });
        copy.append(title, meta);
        row.append(copy, remove);
        target.appendChild(row);
      });
      if (!target.children.length) target.textContent = '등록된 게시글이 없습니다.';
    } catch (error) {
      target.textContent = error.message;
    }
  }

  async function loadVisits(){
    const target=document.getElementById('adminVisitList'),status=document.getElementById('adminVisitStatus').value;
    const labels={pending:'승인 대기',reschedule_requested:'일정 변경 대기',approved:'예약 확정',rejected:'거절',completed:'방문 완료',no_show:'노쇼',cancelled_by_user:'사용자 취소',cancelled_by_admin:'관리자 취소'};
    try{const payload=await api('/api/admin/visits?size=100&status='+encodeURIComponent(status));target.replaceChildren();
      (payload.items||[]).forEach(function(item){
        const row=document.createElement('article'),copy=document.createElement('span'),actions=document.createElement('span');row.className='admin-inquiry';copy.className='admin-inquiry-copy';copy.innerHTML='<strong></strong><small></small><small class="admin-visit-reason"></small>';copy.querySelector('strong').textContent=item.title||item.roomId;copy.querySelectorAll('small')[0].textContent=item.date+' '+String(item.time).slice(0,5)+' · '+(labels[item.status]||item.status)+' · '+item.phone;copy.querySelector('.admin-visit-reason').textContent=item.decisionReason?'처리 사유: '+item.decisionReason:'';
        const detail=document.createElement('button');detail.type='button';detail.textContent='상세';detail.addEventListener('click',async function(){try{const result=await api('/api/admin/visits/'+item.id);const v=result.item;window.alert('매물: '+v.title+'\n일시: '+v.date+' '+v.time+'\n연락처: '+v.phone+'\n문의: '+(v.question||'없음')+'\n처리 사유: '+(v.decisionReason||'없음')+'\n관리자 메모: '+(v.adminNote||'없음'));}catch(error){window.alert(error.message);}});actions.appendChild(detail);
        const available= ['pending','reschedule_requested'].includes(item.status)?[['approve','승인'],['reject','거절']]:item.status==='approved'?[['complete','방문 완료'],['no-show','노쇼'],['cancel','관리자 취소']]:[];
        available.forEach(function(entry){const button=document.createElement('button');button.type='button';button.textContent=entry[1];button.addEventListener('click',async function(){const needsReason=['reject','cancel'].includes(entry[0]);const reason=window.prompt(needsReason?'처리 사유를 입력해 주세요.':'처리 사유를 입력해 주세요.','');if(reason===null)return;const userMessage=window.prompt('사용자에게 전달할 방문 준비사항이나 안내를 입력해 주세요.','');if(userMessage===null)return;const adminNote=window.prompt('사용자에게 공개되지 않는 내부 관리자 메모를 입력해 주세요.','');if(adminNote===null)return;try{await api('/api/visits/'+item.id+'/'+entry[0],{method:'PATCH',body:JSON.stringify({reason:reason,userMessage:userMessage,adminNote:adminNote})});await Promise.all([loadVisits(),loadDashboard()]);}catch(error){window.alert(error.message);}});actions.appendChild(button);});row.append(copy,actions);target.appendChild(row);
      });if(!target.children.length)target.textContent='방문 요청이 없습니다.';}catch(error){target.textContent=error.message;}
  }
  async function loadAuditLogs(){const target=document.getElementById('adminAuditList');try{const payload=await api('/api/admin/audit-logs?size=30');target.replaceChildren();(payload.items||[]).forEach(item=>{const row=document.createElement('article'),copy=document.createElement('span');row.className='admin-inquiry';copy.className='admin-inquiry-copy';copy.innerHTML='<strong></strong><small></small>';copy.querySelector('strong').textContent=item.action+' · '+item.targetType+' #'+item.targetId;copy.querySelector('small').textContent=item.admin+' · '+formatDate(item.createdAt,true)+(item.detail?' · '+item.detail:'');row.append(copy);target.append(row);});if(!target.children.length)target.textContent='기록된 관리자 작업이 없습니다.';}catch(error){target.textContent=error.message;}}

  async function save(status, answer) {
    if (!selectedId) return;
    try {
      await api('/api/admin/inquiries/' + selectedId + '/answer', {
        method: 'PATCH',
        body: JSON.stringify({ status: status, answer: answer })
      });
      await load();
    } catch (error) {
      window.alert(error.message);
    }
  }

  list.addEventListener('click', function (event) {
    const button = event.target.closest('[data-id]');
    if (!button) return;
    selectedId = Number(button.dataset.id);
    render();
  });
  categoryFilter.addEventListener('change',render);let searchTimer;[searchInput,statusFilter].forEach(function(control){control.addEventListener(control.tagName==='INPUT'?'input':'change',function(){clearTimeout(searchTimer);searchTimer=setTimeout(function(){inquiryPage=0;load();},250);});});
  document.getElementById('adminInquiryPrev').addEventListener('click',function(){if(inquiryPage>0){inquiryPage--;load();}});document.getElementById('adminInquiryNext').addEventListener('click',function(){if(inquiryPage+1<inquiryTotalPages){inquiryPage++;load();}});
  document.getElementById('adminSaveStatus').addEventListener('click', function () {
    save(statusSelect.value, replyMessage.value.trim());
  });
  document.getElementById('adminSaveReply').addEventListener('click', function () {
    const answer = replyMessage.value.trim();
    if (!answer) {
      replyMessage.focus();
      return;
    }
    save('answered', answer);
  });
  document.getElementById('adminDeleteInquiry').hidden = true;
  document.getElementById('adminVisitStatus').addEventListener('change',loadVisits);
  document.getElementById('adminPostSearch').addEventListener('input',loadPosts);document.getElementById('adminPostDeleted').addEventListener('change',loadPosts);
  await Promise.all([load(), loadProperties(), loadPosts(),loadDashboard(),loadVisits(),loadAuditLogs()]);
})();
