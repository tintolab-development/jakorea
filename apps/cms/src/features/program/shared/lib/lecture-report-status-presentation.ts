/**
 * 강의보고서 「강의 진행 여부」·「제출 현황」 Text 색 정본.
 * 기관 강사·개인형 강사 보고서 섹션과 회원 상세 보고서 이력 모달이 같이 쓴다.
 * 라벨은 각 mapper 결과를 그대로 쓰고 색만 정한다. 제출 판정·보기 권한은 다루지 않는다.
 */

const NEUTRAL = 'var(--default-BK, #3d3d3d)'
const GREEN = 'var(--color-green, #1e8c29)'
const RED = 'var(--color-red, #c32f4a)'

/** 진행 완료 검정 · 그 외(진행 예정) 초록 */
export function getLectureReportProgressAccent(label: string): string {
  return label === '진행 완료' ? NEUTRAL : GREEN
}

/** 미제출 빨강 · 진행 예정 초록 · 그 외(제출 완료 등) 검정 */
export function getLectureReportSubmissionAccent(label: string): string {
  if (label === '미제출') return RED
  if (label === '진행 예정') return GREEN
  return NEUTRAL
}
