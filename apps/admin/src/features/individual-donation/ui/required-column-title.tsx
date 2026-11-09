/**
 * 개인후원 표 — 수정 모드 열 제목 필수 표시 (`메인 텍스트 *`)
 * 별표는 글자 흐름 밖(절대 배치)이라 헤더 글자 위치가 움직이지 않는다 (재능기부 소개·기업후원 안내 표와 동일 패턴)
 */
export function requiredColumnTitle(label: string) {
  return (
    <span className="individual-donation-table__th-label">
      {label}
      <span className="individual-donation-table__required" aria-hidden>
        *
      </span>
    </span>
  )
}
