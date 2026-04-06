/** 강사 회원 목록 — 강사 유형 필터 (표시 라벨과 값 동일) */
export const INSTRUCTOR_TYPE_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: '전체', value: '' },
  { label: 'JA 강사단', value: 'JA 강사단' },
  { label: '특강 강사', value: '특강 강사' },
  { label: '제미나이', value: '제미나이' },
]

/** 강사 회원 목록 — 정산 현황 필터 */
export const INSTRUCTOR_SETTLEMENT_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: '전체', value: '' },
  { label: '해당 없음', value: '해당 없음' },
  { label: '확인 대기 중', value: '확인 대기 중' },
  { label: '일부 지급 완료', value: '일부 지급 완료' },
  { label: '계좌 지급 완료', value: '계좌 지급 완료' },
]
