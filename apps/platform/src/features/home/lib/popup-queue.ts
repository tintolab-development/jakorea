/**
 * 홈 팝업 표시 대상 (QA-0482)
 *
 * PC는 최대 4개를 한 오버레이에 나란히 보여 준다(기존 동작).
 * 모바일은 화면을 다 덮지 않도록 한 번에 하나만 보여 주고, 닫으면 다음 팝업이 나온다.
 * (닫은 팝업은 호출부에서 visible 목록에서 빠지므로 첫 항목만 고르면 순서대로 이어진다.)
 */
export function selectRenderedHomePopups<T>(visiblePopups: readonly T[], isMobile: boolean): T[] {
  if (!isMobile) return [...visiblePopups]
  return visiblePopups.slice(0, 1)
}
