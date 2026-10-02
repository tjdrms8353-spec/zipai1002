(function () {
  'use strict';
  const form = document.getElementById('happyEligibilityForm');
  const result = document.getElementById('eligibilityResult');
  if (!form || !result) return;

  const $ = function (id) { return document.getElementById(id); };
  const typeSelect = $('applicantType');
  const typeInfo = {
    student: { label: '대학생·취업준비생', guide: '재학·입학·복학 예정 또는 취업준비생 인정기간과 혼인 여부를 확인하세요.', question: '재학·입학·복학 예정 또는 공고에서 정한 취업준비생이며 혼인 중이 아닌가요?' },
    youth: { label: '청년', guide: '공고일 기준 연령, 혼인 여부와 소득활동 요건을 확인하세요.', question: '공고에서 정한 청년 연령 또는 소득활동 요건과 혼인 여부를 충족하나요?' },
    newlywed: { label: '신혼부부·예비신혼부부', guide: '혼인기간, 예비혼인 증빙, 자녀 여부와 세대구성을 확인하세요.', question: '혼인기간·예비혼인·자녀 등 공고에서 정한 신혼부부 요건을 충족하나요?' },
    singleParent: { label: '한부모가족', guide: '자녀 연령과 한부모가족 인정 범위를 확인하세요.', question: '공고에서 정한 자녀 연령 및 한부모가족 요건을 충족하나요?' },
    senior: { label: '고령자', guide: '공고일 기준 연령과 세대구성원 요건을 확인하세요.', question: '공고일 기준 고령자 연령과 세대구성 요건을 충족하나요?' },
    benefit: { label: '주거급여수급자', guide: '공고일 현재 주거급여 수급 여부를 확인하세요.', question: '공고일 현재 주거급여 수급자 요건을 충족하나요?' },
    industrial: { label: '산업단지 근로자', guide: '대상 산업단지 및 입주기업 재직·예정 여부를 확인하세요.', question: '공고가 지정한 산업단지 입주기업의 근로자 또는 입주예정자인가요?' }
  };

  function radio(name) { const el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : 'unknown'; }
  function number(id) { const value = $(id).value; return value === '' ? null : Number(value); }
  function format(value) { return Number(value).toLocaleString('ko-KR') + '만원'; }
  function compare(actualId, limitId) { const actual = number(actualId); const limit = number(limitId); if (actual === null || limit === null) return { state: 'unknown' }; return { state: actual <= limit ? 'yes' : 'no', actual: actual, limit: limit }; }
  function ageOnDate() { const birth = $('birthDate').value; const notice = $('noticeDate').value; if (!birth || !notice) return null; const b = new Date(birth + 'T00:00:00'); const n = new Date(notice + 'T00:00:00'); if (b > n) return null; let age = n.getFullYear() - b.getFullYear(); if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) age -= 1; return age; }

  function updateAge() { const age = ageOnDate(); $('ageOutput').textContent = age === null ? '' : '모집공고일 기준 만 ' + age + '세입니다.' + (typeSelect.value === 'youth' ? (age >= 19 && age <= 39 ? ' 일반적인 청년 연령 범위(만 19~39세)에 해당합니다.' : ' 일반적인 청년 연령 범위 밖이므로 공고의 다른 청년 인정요건을 확인하세요.') : ''); }
  function updateCompare() {
    const income = compare('monthlyIncome', 'incomeLimit');
    $('incomeCompare').className = 'compare-output ' + (income.state === 'yes' ? 'compare-pass' : income.state === 'no' ? 'compare-fail' : '');
    $('incomeCompare').textContent = income.state === 'unknown' ? '두 금액을 입력하면 자동으로 비교해 드려요.' : income.state === 'yes' ? '소득 상한보다 ' + format(income.limit - income.actual) + ' 낮습니다.' : '소득 상한을 ' + format(income.actual - income.limit) + ' 초과합니다.';
    const assets = compare('totalAssets', 'assetLimit'); const car = compare('carValue', 'carLimit');
    const states = [assets.state, car.state]; $('assetCompare').className = 'compare-output ' + (states.includes('no') ? 'compare-fail' : states.every(function (s) { return s === 'yes'; }) ? 'compare-pass' : '');
    $('assetCompare').textContent = states.includes('no') ? '입력한 금액 중 공고 상한을 초과하는 항목이 있습니다.' : states.every(function (s) { return s === 'yes'; }) ? '총자산과 자동차가액 모두 입력한 공고 상한 이내입니다.' : '보유액과 공고 상한을 입력하면 자동으로 비교해 드려요.';
  }
  function updateProgress() { const groups = [typeSelect.value, radio('homeless') !== 'unknown' ? 'x' : '', radio('category') !== 'unknown' ? 'x' : '', number('monthlyIncome') !== null && number('incomeLimit') !== null ? 'x' : '', number('totalAssets') !== null && number('assetLimit') !== null && number('carValue') !== null && number('carLimit') !== null ? 'x' : '', radio('connection') !== 'unknown' ? 'x' : '']; const percent = Math.round(groups.filter(Boolean).length / groups.length * 100); $('diagnosisProgressBar').style.width = percent + '%'; $('diagnosisProgressText').textContent = percent + '% 입력'; }

  typeSelect.addEventListener('change', function () { const info = typeInfo[this.value]; $('applicantTypeGuide').textContent = info ? info.guide : '계층을 선택하면 확인할 기본요건을 알려드려요.'; $('categoryQuestion').textContent = info ? info.question : '선택한 계층의 기본요건을 충족하나요?'; if (this.value === 'newlywed' || this.value === 'singleParent') { if (!$('assetLimit').value) $('assetLimit').value = 34500; if (!$('carLimit').value) $('carLimit').value = 4542; } updateAge(); updateCompare(); updateProgress(); });
  form.addEventListener('input', function () { updateAge(); updateCompare(); updateProgress(); });

  function row(label, state, detail) { const icon = state === 'yes' ? 'fa-check' : state === 'no' ? 'fa-xmark' : 'fa-question'; const text = state === 'yes' ? '통과' : state === 'no' ? '미충족' : '확인 필요'; return '<li class="check-' + state + '"><i class="fa-solid ' + icon + '"></i><div><strong>' + label + '<em>' + text + '</em></strong><span>' + detail + '</span></div></li>'; }
  form.addEventListener('submit', function (event) {
    event.preventDefault(); if (!typeInfo[typeSelect.value]) { typeSelect.focus(); return; }
    const age = ageOnDate(); let ageState = 'unknown'; let ageDetail = '생년월일과 모집공고일을 입력해 공고일 기준 나이를 확인하세요.';
    if (age !== null) { ageState = typeSelect.value === 'youth' ? (age >= 19 && age <= 39 ? 'yes' : 'unknown') : 'yes'; ageDetail = '공고일 기준 만 ' + age + '세입니다.' + (ageState === 'unknown' ? ' 연령 외 인정요건을 공고에서 확인하세요.' : ''); }
    const income = compare('monthlyIncome', 'incomeLimit'); const assets = compare('totalAssets', 'assetLimit'); const car = compare('carValue', 'carLimit');
    const checks = [
      { label: '연령 계산', state: ageState, detail: ageDetail },
      { label: '무주택 요건', state: radio('homeless'), detail: '본인 또는 공고에서 정한 세대 범위의 주택소유 여부 기준입니다.' },
      { label: '계층 기본요건', state: radio('category'), detail: typeInfo[typeSelect.value].question },
      { label: '월평균소득', state: income.state, detail: income.state === 'unknown' ? '실제 소득과 공고 상한을 모두 입력하세요.' : format(income.actual) + ' / 상한 ' + format(income.limit) },
      { label: '총자산', state: assets.state, detail: assets.state === 'unknown' ? '총자산과 공고 상한을 모두 입력하세요.' : format(assets.actual) + ' / 상한 ' + format(assets.limit) },
      { label: '자동차가액', state: car.state, detail: car.state === 'unknown' ? '차량가액과 공고 상한을 모두 입력하세요.' : format(car.actual) + ' / 상한 ' + format(car.limit) },
      { label: '지역·직장 연계', state: radio('connection'), detail: '거주지·학교·직장 소재지에 따른 신청 또는 순위 조건입니다.' }
    ];
    const failed = checks.filter(function (c) { return c.state === 'no'; }).length; const unknown = checks.filter(function (c) { return c.state === 'unknown'; }).length; const state = failed ? 'fail' : unknown ? 'check' : 'pass';
    const title = failed ? failed + '개 항목이 기준을 충족하지 못했어요' : unknown ? unknown + '개 항목을 더 확인해 주세요' : '기본요건에 해당할 가능성이 높아요';
    result.className = 'diagnosis-result result-' + state;
    result.innerHTML = '<div class="result-status"><i class="fa-solid ' + (state === 'pass' ? 'fa-circle-check' : state === 'fail' ? 'fa-circle-xmark' : 'fa-magnifying-glass') + '"></i><small>' + typeInfo[typeSelect.value].label + ' 간편진단</small><h3>' + title + '</h3><p>통과 ' + checks.filter(function (c) { return c.state === 'yes'; }).length + ' · 확인 필요 ' + unknown + ' · 미충족 ' + failed + '</p></div><ul class="detailed-checks">' + checks.map(function (c) { return row(c.label, c.state, c.detail); }).join('') + '</ul><a href="https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancList.do?mi=1026" target="_blank" rel="noopener noreferrer">모집공고에서 최종 확인 <i class="fa-solid fa-arrow-up-right-from-square"></i></a>';
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  form.addEventListener('reset', function () { setTimeout(function () { $('applicantTypeGuide').textContent = '계층을 선택하면 확인할 기본요건을 알려드려요.'; $('categoryQuestion').textContent = '선택한 계층의 기본요건을 충족하나요?'; $('ageOutput').textContent = ''; updateCompare(); updateProgress(); result.className = 'diagnosis-result'; result.innerHTML = '<div class="result-placeholder"><i class="fa-solid fa-clipboard-check"></i><h3>항목을 선택해 주세요</h3><p>입력을 마치면 신청 가능성 및 추가로 확인할 내용을 알려드려요.</p></div>'; }, 0); });
  updateProgress();
})();
