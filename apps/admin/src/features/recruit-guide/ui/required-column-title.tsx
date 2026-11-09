/**
 * 채용 안내 표 — 수정 모드 열 제목 필수 표시 (`타이틀 *`)
 * 글자 옆 2px에 붙여 헤더 텍스트가 밀리지 않는다 (기업후원 안내·재능기부 소개 표와 동일 패턴)
 */
export function requiredColumnTitle(label: string) {
  return (
    <span className="recruit-guide-table__th-label">
      {label}
      <span className="recruit-guide-table__required" aria-hidden>
        *
      </span>
    </span>
  )
}
