import { updateAdminProgramRemote } from '@/features/program/general/api/programs-api-client'
import { isGeneralRecruitmentRowProgram } from '@/features/program/general/lib/is-general-recruitment-row-program'
import { serializeGeneralRecruitmentNestedServiceDetailPatch } from '@/features/program/general/lib/general-program-service-detail-json'
import { hasSingleTypedVolunteerInterviewRow } from '@/features/program/general/api/adapters/general-program-adapters'
import { omitVolunteerInterviewSaveKeysFromServiceDetailJson } from '@/features/program/shared/lib/volunteer-interview-config'
import type { Program } from '@/types/domain'

/**
 * 모집 행 PATCH는 행만 갱신한다. CMS 봉사자 모집 화면은 nested `volunteerRecruitmentInfo`를 본다.
 * 그 객체를 serviceDetailJson에 남겨, 재조회가 수정 전 nested를 다시 그리지 않게 한다.
 * 공통정보·overlay는 보내지 않는다(R8b — 오래된 GET 값으로 덮어쓰기 방지).
 */
export async function persistGeneralRecruitmentNestedSnapshot(program: Program): Promise<void> {
  if (!isGeneralRecruitmentRowProgram(program)) return
  const serviceDetailJson = buildGeneralRecruitmentNestedSnapshotServiceDetailJson(program)
  if (!serviceDetailJson) return
  await updateAdminProgramRemote(program.id, { serviceDetailJson })
}

/**
 * nested 스냅샷 PATCH 본문. R8b: 공통정보 전체가 아니라 nested 모집 정보만 보낸다(BE deep merge).
 * 면접 일정 표시 객체(`volunteerInterviewScheduleInfo`)는 BE 가 행 typed interviewConfig 로 다시 만든다
 * (keonhee 2026-10-25) — 반기 아닌 봉사 행 1개 프로그램은 본문에 넣지 않는다. 보낼 nested 가 없으면 undefined.
 */
export function buildGeneralRecruitmentNestedSnapshotServiceDetailJson(
  program: Program
): string | undefined {
  const nested = serializeGeneralRecruitmentNestedServiceDetailPatch(program)
  const serviceDetailJson = hasSingleTypedVolunteerInterviewRow(program)
    ? omitVolunteerInterviewSaveKeysFromServiceDetailJson(nested)
    : nested
  if (!serviceDetailJson || !hasNestedContent(serviceDetailJson)) return undefined
  return serviceDetailJson
}

function hasNestedContent(serviceDetailJson: string): boolean {
  try {
    const parsed = JSON.parse(serviceDetailJson) as { generalCommonInfo?: Record<string, unknown> }
    return Object.keys(parsed.generalCommonInfo ?? {}).length > 0
  } catch {
    return true
  }
}
