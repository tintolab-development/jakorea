import { shouldUsePlatformMockData } from '@/shared/lib/dev-auth'
import type { DirectionsInfo } from '../model/types'

/**
 * 마곡나루역 프라이빗타워Ⅱ (마곡중앙로 171)
 * @see https://jusoga.com — lat/lng
 */
export const DIRECTIONS_MAP_LAT = 37.569052535398
export const DIRECTIONS_MAP_LNG = 126.82795142525

/** 카카오맵 앱/웹에서 해당 위치 열기 (API 키 불필요) */
export const DIRECTIONS_KAKAO_MAP_URL = `https://map.kakao.com/link/map/${encodeURIComponent('사단법인 제이에이코리아')},${DIRECTIONS_MAP_LAT},${DIRECTIONS_MAP_LNG}`

/**
 * mock용 지도 HTML — Leaflet 고정 뷰(줌 버튼·휠·드래그 확대 불가).
 * 카카오맵 스타일 A핀 + 「제이에이코리아」라벨 마커를 DivIcon으로 표시한다.
 * Admin에서 카카오「지도 퍼가기」Roughmap HTML을 넣으면 이 필드를 교체하면 된다.
 */
function buildAddressMapHtml(): string {
  const mapId = 'ja-directions-locked-map'
  const lat = DIRECTIONS_MAP_LAT
  const lng = DIRECTIONS_MAP_LNG
  const label = '제이에이코리아'

  return `
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
<div id="${mapId}" style="width:100%;height:100%;min-height:100%;"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<script>
(function () {
  var el = document.getElementById('${mapId}');
  if (!el || typeof L === 'undefined') return;
  var map = L.map(el, {
    center: [${lat}, ${lng}],
    zoom: 16,
    zoomControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    touchZoom: false,
    attributionControl: false
  });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);

  var markerHtml =
    '<div class="ja-kakao-marker">' +
      '<div class="ja-kakao-marker__bubble">${label}</div>' +
      '<div class="ja-kakao-marker__pin" aria-hidden="true"><span>A</span></div>' +
    '</div>';

  var icon = L.divIcon({
    className: 'ja-kakao-marker-wrap',
    html: markerHtml,
    iconSize: [160, 78],
    iconAnchor: [80, 78]
  });

  L.marker([${lat}, ${lng}], { icon: icon, interactive: false }).addTo(map);

  requestAnimationFrame(function () {
    map.invalidateSize();
  });
})();
</script>
`.trim()
}

export const MOCK_DIRECTIONS: DirectionsInfo = {
  addressKo: '서울특별시 강서구 마곡중앙로 171 (마곡나루역 프라이빗타워2차 714호)',
  addressEn: '714, Magokjungang-ro 171, Gangseo-gu, Seoul, Republic of Korea',
  kakaoMapHtml: buildAddressMapHtml(),
  phone: '02-783-2367',
  fax: '070-4275-5115',
  email: 'jakorea@jakorea.org',
  updatedAt: '2026-07-01T00:00:00.000Z',
}

export function getMockDirections(): DirectionsInfo | null {
  if (!shouldUsePlatformMockData()) return null
  return MOCK_DIRECTIONS
}
