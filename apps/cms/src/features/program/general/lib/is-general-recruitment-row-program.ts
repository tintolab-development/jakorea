import type { Program } from '@/types/domain'
import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import { isUjatPrimaryProgramId } from '@/features/program/ujat/lib/is-ujat-primary-program'

/**
 * 일반 프로그램 모집 행 — 비고 `remarks` / 기타사항 `otherMatters` 를 행·nested에 쓴다.
 *
 * `looksLikeUjatProgramId`의 `/^18xxxx$/` 는 일반 프로그램 id(186021 등)까지 UJAT로 본다.
 * 그 판별로 강사 비고가 `otherNotes`(기타사항 HTML)로 저장되면 안 된다.
 */
export function isGeneralRecruitmentRowProgram(program: Program): boolean {
  if (isCompanySchoolProgram(program)) return false
  if (isTrainedTeachersDetailProgram(program)) return false
  if (program.backendProgramType === 'UJAT') return false
  const id = String(program.id ?? '')
  if (id.startsWith('ujat-')) return false
  if (isUjatPrimaryProgramId(id)) return false
  return true
}
