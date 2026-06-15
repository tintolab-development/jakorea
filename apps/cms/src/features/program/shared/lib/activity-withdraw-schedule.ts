/** 활동 포기 모달 — 교육 일정 선택 옵션 (참여 기관·봉사자·강사 등 공통) */
export interface ActivityWithdrawScheduleOption {
  value: string
  label: string
}

export interface ActivityWithdrawScheduleConfirmPayload {
  stopSessionKey: string
  stopScheduleLabel: string
}
