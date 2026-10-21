import { updateAdminProgramRemote } from '@/features/program/general/api/programs-api-client'
import { isGeneralRecruitmentRowProgram } from '@/features/program/general/lib/is-general-recruitment-row-program'
import { serializeGeneralProgramServiceDetailJson } from '@/features/program/general/lib/general-program-service-detail-json'
import type { Program } from '@/types/domain'

/**
 * 모집 행 PATCH는 행만 갱신한다. CMS 봉사자 모집 화면은 nested `volunteerRecruitmentInfo`를 본다.
 * 그 객체를 serviceDetailJson에 남겨, 재조회가 수정 전 nested를 다시 그리지 않게 한다.
 */
export async function persistGeneralRecruitmentNestedSnapshot(program: Program): Promise<void> {
  if (!isGeneralRecruitmentRowProgram(program)) return
  const serviceDetailJson = serializeGeneralProgramServiceDetailJson(program, {
    omitRecruitmentWindow: true,
    keepNestedRecruitmentInfo: true,
  })
  if (!serviceDetailJson) return
  await updateAdminProgramRemote(program.id, { serviceDetailJson })
}
