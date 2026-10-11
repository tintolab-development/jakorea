import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'

/** 기관 신청 상세 — 진행 희망 교육 일정 빈 상태 (requested-schedules SSOT 기준) */
export function institutionHopeScheduleEmptyMessage(row: ApplicantSchoolRow): string {
  if (row.requestedSchedulesSyncState === 'loading') {
    return '희망 교육 일정을 불러오는 중입니다.'
  }
  if (row.appliedAt?.trim()) {
    return '희망 교육 일정이 저장되지 않았습니다. 재제출 또는 관리자에게 문의해 주세요.'
  }
  return '등록된 교육 일정이 없습니다.'
}
