import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import type { ProgramDetailRecruitmentAudience } from '@/features/program/shared/lib/apply-recruitment-additional-content-html'

/**
 * 일반 프로그램 강사 모집 비고 「해당 없음」 → 강사 모집 행 `remarksNotApplicable` 저장 값.
 *
 * - 폼(RHF) `instructorRecruitmentNotesNotApplicable`이 정본. GET 강사 모집 행에서 시드한다.
 * - 강사 audience + 일반 모집 행 프로그램(`writesRowFields`)에서만 값을 낸다.
 * - 폼 값이 없으면(행 값 null로 시드 안 됨, 1사1교·UJAT·교육받은 교사) `undefined` → 행을 건드리지 않는다.
 */
export function resolveInstructorRowRemarksNotApplicable(
  values: Pick<ProgramDetailEditFormValues, 'instructorRecruitmentNotesNotApplicable'>,
  audience: ProgramDetailRecruitmentAudience,
  writesRowFields: boolean
): boolean | undefined {
  if (audience !== 'instructor' || !writesRowFields) return undefined
  const value = values.instructorRecruitmentNotesNotApplicable
  if (value === undefined) return undefined
  return value === 'not_applicable'
}
