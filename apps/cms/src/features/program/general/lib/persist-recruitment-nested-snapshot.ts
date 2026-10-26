import { updateAdminProgramRemote } from '@/features/program/general/api/programs-api-client'
import { isGeneralRecruitmentRowProgram } from '@/features/program/general/lib/is-general-recruitment-row-program'
import {
  GENERAL_PROGRAM_SERVICE_DETAIL_JSON_VERSION,
  serializeGeneralRecruitmentNestedServiceDetailPatch,
} from '@/features/program/general/lib/general-program-service-detail-json'
import { hasSingleTypedVolunteerInterviewRow } from '@/features/program/general/api/adapters/general-program-adapters'
import { omitVolunteerInterviewSaveKeysFromServiceDetailJson } from '@/features/program/shared/lib/volunteer-interview-config'
import {
  normalizeInstructorTargetList,
  resolveProgramInstructorTargets,
  resolveProgramTargetLevels,
} from '@/features/program/shared/lib/program-detail-info-constants'
import type { ProgramUpdateRequest } from '@/shared/api/generated/dashboard/schemas/programUpdateRequest'
import type { Program } from '@/types/domain'

/** BE `StaffRecruitmentTargets.instructorCodes`가 먼저 읽는 overlay 키. */
const INSTRUCTOR_RECRUIT_TARGETS_OVERLAY_KEY = 'recruit.instructor.recruitTargets'

/**
 * 모집 행 PATCH는 행만 갱신한다. CMS 봉사자 모집 화면은 nested `volunteerRecruitmentInfo`를 본다.
 * 그 객체를 serviceDetailJson에 남겨, 재조회가 수정 전 nested를 다시 그리지 않게 한다.
 * 공통정보·overlay 전체는 보내지 않는다(R8b — 오래된 GET 값으로 덮어쓰기 방지).
 * 참여자 교육 대상·강사 모집 대상은 저장된 값과 다를 때만 루트·요청 필드에 덧붙인다.
 */
export async function persistGeneralRecruitmentNestedSnapshot(
  program: Program,
  options?: GeneralRecruitmentNestedSnapshotOptions
): Promise<void> {
  if (!isGeneralRecruitmentRowProgram(program)) return
  const update = buildGeneralRecruitmentAuxiliaryUpdate(program, options)
  if (!update) return
  await updateAdminProgramRemote(program.id, update)
}

/**
 * 모집 탭 보조 PATCH. nested 모집 정보에, 이번 탭에서 바뀐 대상 코드만 얹는다.
 * 교육 대상은 요청 `targetLevels`와 JSON 루트·`program.targetLevels`에 같이 넣는다.
 * 강사 모집 대상은 overlay 키 하나만 넣는다(BE deep merge — 나머지 overlay 키는 유지).
 */
export function buildGeneralRecruitmentAuxiliaryUpdate(
  program: Program,
  options?: GeneralRecruitmentNestedSnapshotOptions
): Pick<ProgramUpdateRequest, 'serviceDetailJson' | 'targetLevels' | 'targetLevel'> | undefined {
  const nestedJson = buildGeneralRecruitmentNestedSnapshotServiceDetailJson(program, options)
  const persisted = options?.persisted
  const targetLevels =
    options?.audience === 'participant' && persisted
      ? changedParticipantTargetLevels(program, persisted)
      : undefined
  const instructorRecruitTargets =
    options?.audience === 'instructor'
      ? changedInstructorRecruitTargets(program, options.baseline ?? persisted)
      : undefined
  const serviceDetailJson = mergeChangedRecruitmentRootFields(nestedJson, {
    targetLevels,
    instructorRecruitTargets,
  })
  if (!serviceDetailJson && targetLevels === undefined) return undefined
  return {
    ...(serviceDetailJson ? { serviceDetailJson } : {}),
    ...(targetLevels
      ? {
          targetLevels: targetLevels.levels,
          ...(targetLevels.levels[0] ? { targetLevel: targetLevels.levels[0] } : {}),
        }
      : {}),
  }
}

/**
 * nested 스냅샷 PATCH 본문. R8b: 공통정보 전체가 아니라 nested 모집 정보만 보낸다(BE deep merge).
 * 면접 일정 표시 객체(`volunteerInterviewScheduleInfo`)는 BE 가 행 typed interviewConfig 로 다시 만든다
 * (keonhee 2026-10-25) — 반기 아닌 봉사 행 1개 프로그램은 본문에 넣지 않는다. 보낼 nested 가 없으면 undefined.
 */
export type GeneralRecruitmentNestedSnapshotOptions = {
  /** 저장한 모집 탭. 봉사자 탭이면 프로그램 JSON 면접 스위치(`generalVolunteerInterviewEnabled`)를 함께 보낸다. */
  audience?: string
  /**
   * GET에 남은 프로그램. 참여자 교육 대상은 편집 시드(라벨로 키운 값)가 아니라 이 컬럼과 비교한다.
   */
  persisted?: Program
  /** 편집 진입 프로그램. 강사 모집 대상은 폼 시드와 비교해, 바꾸지 않았으면 overlay 키를 보내지 않는다. */
  baseline?: Program
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

function sameCodes(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false
  return left.every((code, index) => code === right[index])
}

/** 저장된 컬럼과 폼 교육 대상이 다를 때만. 같으면 undefined — R8b처럼 필드를 생략한다. */
function changedParticipantTargetLevels(
  draft: Program,
  persisted: Program
): { levels: string[] } | undefined {
  const next = resolveProgramTargetLevels(draft)
  const prev = resolveProgramTargetLevels(persisted)
  if (sameCodes(next, prev)) return undefined
  return { levels: next }
}

/** 편집 시드와 폼 강사 모집 대상이 다를 때만. 시드가 없으면 보내지 않는다. */
function changedInstructorRecruitTargets(
  draft: Program,
  baseline: Program | undefined
): string[] | undefined {
  if (!baseline) return undefined
  const next = resolveProgramInstructorTargets(draft)
  const prev = resolveProgramInstructorTargets(baseline)
  if (sameCodes(next, prev)) return undefined
  return normalizeInstructorTargetList(next)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * 바뀐 대상만 JSON에 얹는다. 공통정보 키는 추가하지 않는다.
 * 강사 대상은 overlay 한 키만 넣어, deep merge가 나머지 overlay를 유지하게 한다.
 */
function mergeChangedRecruitmentRootFields(
  serviceDetailJson: string | undefined,
  fields: {
    targetLevels?: { levels: string[] }
    instructorRecruitTargets?: string[]
  }
): string | undefined {
  if (fields.targetLevels === undefined && fields.instructorRecruitTargets === undefined) {
    return serviceDetailJson
  }
  const root = serviceDetailJson
    ? (JSON.parse(serviceDetailJson) as Record<string, unknown>)
    : { schemaVersion: GENERAL_PROGRAM_SERVICE_DETAIL_JSON_VERSION }
  if (fields.targetLevels !== undefined) {
    root.targetLevels = fields.targetLevels.levels
    const programNode = isRecord(root.program) ? root.program : {}
    root.program = { ...programNode, targetLevels: fields.targetLevels.levels }
  }
  if (fields.instructorRecruitTargets !== undefined) {
    const registration = isRecord(root.registration) ? root.registration : {}
    const overlay = isRecord(registration.overlay) ? registration.overlay : {}
    root.registration = {
      ...registration,
      overlay: {
        ...overlay,
        [INSTRUCTOR_RECRUIT_TARGETS_OVERLAY_KEY]: fields.instructorRecruitTargets,
      },
    }
  }
  return JSON.stringify(root)
}
