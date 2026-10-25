import { updateAdminProgramRemote } from '@/features/program/general/api/programs-api-client'
import { isGeneralRecruitmentRowProgram } from '@/features/program/general/lib/is-general-recruitment-row-program'
import { serializeGeneralRecruitmentNestedServiceDetailPatch } from '@/features/program/general/lib/general-program-service-detail-json'
import type { Program } from '@/types/domain'

/**
 * 모집 행 PATCH는 행만 갱신한다. CMS 봉사자 모집 화면은 nested `volunteerRecruitmentInfo`를 본다.
 * 그 객체를 serviceDetailJson에 남겨, 재조회가 수정 전 nested를 다시 그리지 않게 한다.
 * 공통정보·overlay는 보내지 않는다(R8b — 오래된 GET 값으로 덮어쓰기 방지).
 */
export async function persistGeneralRecruitmentNestedSnapshot(program: Program): Promise<void> {
  if (!isGeneralRecruitmentRowProgram(program)) return
  // R8b: 공통정보 전체가 아니라 nested 모집 정보만 보낸다(BE deep merge).
  const serviceDetailJson = serializeGeneralRecruitmentNestedServiceDetailPatch(program)
  if (!serviceDetailJson) return
  await updateAdminProgramRemote(program.id, { serviceDetailJson })
}
