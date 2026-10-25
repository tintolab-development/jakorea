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
export async function persistGeneralRecruitmentNestedSnapshot(
  program: Program,
  options?: GeneralRecruitmentNestedSnapshotOptions
): Promise<void> {
  if (!isGeneralRecruitmentRowProgram(program)) return
  const serviceDetailJson = buildGeneralRecruitmentNestedSnapshotServiceDetailJson(program, options)
  if (!serviceDetailJson) return
  await updateAdminProgramRemote(program.id, { serviceDetailJson })
}

/**
 * nested 스냅샷 PATCH 본문. R8b: 공통정보 전체가 아니라 nested 모집 정보만 보낸다(BE deep merge).
 * 면접 일정 표시 객체(`volunteerInterviewScheduleInfo`)는 BE 가 행 typed interviewConfig 로 다시 만든다
 * (keonhee 2026-10-25) — 반기 아닌 봉사 행 1개 프로그램은 본문에 넣지 않는다. 보낼 nested 가 없으면 undefined.
 */
export type GeneralRecruitmentNestedSnapshotOptions = {
  /** 저장한 모집 탭. 봉사자 탭이면 프로그램 JSON 면접 스위치(`generalVolunteerInterviewEnabled`)를 함께 보낸다. */
  audience?: string
}

export function buildGeneralRecruitmentNestedSnapshotServiceDetailJson(
  program: Program,
  options?: GeneralRecruitmentNestedSnapshotOptions
): string | undefined {
  const nested = serializeGeneralRecruitmentNestedServiceDetailPatch(program)
  const serviceDetailJson = withVolunteerInterviewSwitch(
    hasSingleTypedVolunteerInterviewRow(program)
      ? omitVolunteerInterviewSaveKeysFromServiceDetailJson(nested)
      : nested,
    program,
    options
  )
  if (!serviceDetailJson || !hasNestedContent(serviceDetailJson)) return undefined
  return serviceDetailJson
}

/**
 * 봉사자 탭 저장 — 프로그램 JSON 루트 `generalVolunteerInterviewEnabled` 를 폼 면접 여부로 맞춘다.
 * BE 는 이 스위치와 봉사 행 interviewEnabled 를 OR 로 읽는다(keonhee 2026-10-25 23:1x) — 행만 false 면 프로그램은 켜진 채 남는다.
 * UJAT 은 봉사 운영 행 면접을 끌 수 없어 넣지 않는다. 값이 boolean 이 아니면 넣지 않는다(BE deep merge 로 유지).
 */
function withVolunteerInterviewSwitch(
  serviceDetailJson: string | undefined,
  program: Program,
  options: GeneralRecruitmentNestedSnapshotOptions | undefined
): string | undefined {
  if (options?.audience !== 'volunteer') return serviceDetailJson
  if ((program.backendProgramType ?? '').toUpperCase() === 'UJAT') return serviceDetailJson
  const enabled = program.generalVolunteerInterviewEnabled
  if (typeof enabled !== 'boolean') return serviceDetailJson
  const root = serviceDetailJson
    ? (JSON.parse(serviceDetailJson) as Record<string, unknown>)
    : { schemaVersion: 1, generalCommonInfo: {} }
  return JSON.stringify({ ...root, generalVolunteerInterviewEnabled: enabled })
}

function hasNestedContent(serviceDetailJson: string): boolean {
  try {
    const parsed = JSON.parse(serviceDetailJson) as {
      generalCommonInfo?: Record<string, unknown>
      generalVolunteerInterviewEnabled?: unknown
    }
    return (
      Object.keys(parsed.generalCommonInfo ?? {}).length > 0 ||
      typeof parsed.generalVolunteerInterviewEnabled === 'boolean'
    )
  } catch {
    return true
  }
}
