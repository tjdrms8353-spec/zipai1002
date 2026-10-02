(function () {
  'use strict';

  const mapElement = document.getElementById('realMap');

  function showError(message) {
    if (mapElement) mapElement.innerHTML = '<div class="map-fallback">' + message + '</div>';
  }

  function loadHome() {
    const script = document.createElement('script');
    script.src = 'static/js/home.js';
    document.body.appendChild(script);
  }

  const config = window.ZIPAI_CONFIG || {};
  if (!config.naverMapNcpKeyId) {
    showError('네이버 지도 인증키가 필요합니다. static/js/map-config.js에 ncpKeyId를 입력해 주세요.');
    return;
  }

  const sdk = document.createElement('script');
  sdk.src = 'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=' + encodeURIComponent(config.naverMapNcpKeyId);
  sdk.async = true;
  sdk.onload = loadHome;
  sdk.onerror = function () {
    showError('네이버 지도를 불러오지 못했습니다. 인증키와 Web 서비스 URL을 확인해 주세요.');
  };
  document.head.appendChild(sdk);
})();
