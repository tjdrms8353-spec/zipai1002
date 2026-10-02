(function () {
  'use strict';
  const form = document.getElementById('registryAnalysisForm');
  if (!form) return;
  const status = document.getElementById('registryAnalysisStatus');
  const result = document.getElementById('registryAnalysisResult');
  const list = document.getElementById('registryFindingList');
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const file = document.getElementById('registryFile').files[0];
    if (!file || !document.getElementById('registryConsent').checked) return form.reportValidity();
    if (file.size > 10 * 1024 * 1024) { status.textContent = 'PDF는 10MB 이하로 선택해 주세요.'; return; }
    const button = form.querySelector('button');
    button.disabled = true; status.textContent = 'PDF 문자와 위험 신호를 분석하고 있습니다.'; result.hidden = true;
    try {
      const data = new FormData(); data.append('file', file);
      const response = await fetch('/api/defense/registry-analysis', { method: 'POST', credentials: 'same-origin', body: data });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || 'PDF를 분석하지 못했습니다. 로그인 상태와 파일을 확인해 주세요.');
      render(payload.analysis);
      if (payload.analysis.suggestedSeniorDebtManwon) localStorage.setItem('zipaiRegistrySeniorDebt', String(payload.analysis.suggestedSeniorDebtManwon));
      status.textContent = payload.report ? '분석을 완료하고 원본 PDF와 결과를 마이페이지 진단 이력에 저장했습니다. 반드시 원문과 대조해 주세요.' : '분석을 완료했습니다. 반드시 원문과 대조해 주세요.';
    } catch (error) { status.textContent = error.message; } finally { button.disabled = false; }
  });

  function render(a) {
    document.getElementById('registryFindingCount').textContent = (a.findingCount || 0) + '개 신호';
    document.getElementById('registryDocumentMeta').innerHTML = '<div><dt>파일</dt><dd>' + escapeHtml(a.fileName) + '</dd></div><div><dt>페이지</dt><dd>' + escapeHtml(a.pageCount) + '</dd></div><div><dt>발급일</dt><dd>' + escapeHtml(a.issuedDateText) + '</dd></div><div><dt>분석 방식</dt><dd>' + (a.extractionMode === 'clova-ocr' ? 'CLOVA OCR' : 'PDF 문자 추출') + '</dd></div>';
    const findings = a.findings || [];
    list.innerHTML = findings.length ? findings.map(f => '<article class="registry-finding ' + escapeHtml(f.level) + '"><h4>' + escapeHtml(f.title) + ' · ' + escapeHtml(f.page) + '페이지</h4><p>' + escapeHtml(f.message) + '</p><span class="registry-evidence">근거 문맥: ' + escapeHtml(f.evidence) + '</span></article>').join('') : '<div class="registry-empty"><strong>설정된 위험 키워드를 찾지 못했습니다.</strong><p>위험이 없다는 뜻은 아닙니다. AI가 놓친 표기와 말소 여부를 원문에서 확인하세요.</p></div>';
    document.getElementById('registryDisclaimer').textContent = a.disclaimer || '';
    document.getElementById('registryLimitations').innerHTML = (a.limitations || []).map(x => '<li>' + escapeHtml(x) + '</li>').join('');
    result.hidden = false; result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
})();
