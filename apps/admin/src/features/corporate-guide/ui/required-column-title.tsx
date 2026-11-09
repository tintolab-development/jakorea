/**
 * 기업후원 안내 표 — 수정 모드 열 제목 필수 표시 (`타이틀 *`)
 * 글자 옆 2px에 겹치지 않게 붙여 헤더 텍스트가 밀리지 않는다 (talent-intro how-table와 동일 패턴)
 */
export function requiredColumnTitle(label: string) {
  return (
    <span className="corporate-guide-table__th-label">
      {label}
      <span className="corporate-guide-table__required" aria-hidden>
        *
      </span>
    </span>
  )
}
