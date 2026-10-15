import type { Program } from '@/types/domain'
import { TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE } from '@/features/template/lib/template-form-select-options'

/** overlay/도메인에 남는 세부 프로그램 마스터 id → create/update `detailedProgramId` */
/**
 * BE `serviceDetailJson.generalCommonInfo`에 미러되는 `detailedProgramId`.
 * 일반 일정형은 마스터 id를 남기면 저장이 거부된다 — 커리큘럼→일정 전환 시 제거.
 */
export function omitMirroredDetailedProgramMasterIdFromCommonInfo(
  common: Program['generalCommonInfo']
): Program['generalCommonInfo'] {
  if (!common) return common
  if (!Object.prototype.hasOwnProperty.call(common, 'detailedProgramId')) return common
  const { detailedProgramId: _removed, ...rest } = common as Program['generalCommonInfo'] & {
    detailedProgramId?: unknown
  }
  void _removed
  return rest
}

export function parseDetailedProgramMasterId(
  value: string | number | null | undefined
): number | undefined {
  if (value == null) return undefined
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : undefined
  }
  const trimmed = value.trim()
  if (!trimmed || trimmed === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE) return undefined
  if (!/^\d+$/.test(trimmed)) return undefined
  const parsed = Number(trimmed)
  return parsed > 0 ? parsed : undefined
}

/**
 * 커리큘럼형 등록 필수 검증용 — 요청 body에 `detailedProgramId`로 실릴 수 있는 값인지.
 * 「해당없음」·1사1교/UJAT 가짜 sentinel·빈 값은 false.
 */
export function isDetailedProgramMasterId(value: unknown): boolean {
  if (typeof value !== 'string' && typeof value !== 'number') return false
  return parseDetailedProgramMasterId(value) !== undefined
}

/** 등록 양식에 교재명 입력란이 없어, 세부명·일정/차시 제목이 textbookName으로 들어간 값 */
export function derivedTextbookNameAliases(program: {
  generalCommonInfo?: {
    detailedProgramName?: string
    scheduleDetails?: Array<{ name?: string; scheduleLabel?: string }>
    curriculumSessions?: Array<{ title?: string }>
  }
}): string[] {
  const common = program.generalCommonInfo
  const scheduleJoined = (common?.scheduleDetails ?? [])
    .map(detail => detail.name?.trim() || detail.scheduleLabel?.trim())
    .filter(Boolean)
    .join(', ')
  const curriculumJoined = (common?.curriculumSessions ?? [])
    .map(session => session.title?.trim())
    .filter(Boolean)
    .join(', ')
  return [common?.detailedProgramName, scheduleJoined || undefined, curriculumJoined || undefined]
    .map(value => value?.trim())
    .filter((value): value is string => Boolean(value))
}

/** 세부 프로그램명·일정/차시 제목을 교재 필드에 복사한 값이면 요청에서 제외 */
export function omitIfDetailedProgramNameAlias(
  value: string | undefined,
  detailedProgramName: string | undefined,
  extraAliases: readonly (string | undefined)[] = []
): string | undefined {
  const field = value?.trim()
  if (!field) return undefined
  if (field === '해당없음') return undefined
  const aliases = [detailedProgramName, ...extraAliases]
    .map(alias => alias?.trim())
    .filter((alias): alias is string => Boolean(alias))
  if (aliases.includes(field)) return undefined
  return value
}
