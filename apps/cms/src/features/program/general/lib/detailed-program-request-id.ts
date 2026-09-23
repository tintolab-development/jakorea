import { TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE } from '@/features/template/lib/template-form-select-options'

/** overlay/도메인에 남는 세부 프로그램 마스터 id → create/update `detailedProgramId` */
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

/** 세부 프로그램명을 교재/팀구분 필드에 복사한 값이면 요청에서 제외 */
export function omitIfDetailedProgramNameAlias(
  value: string | undefined,
  detailedProgramName: string | undefined
): string | undefined {
  const field = value?.trim()
  const alias = detailedProgramName?.trim()
  if (!field) return undefined
  if (alias && field === alias) return undefined
  if (field === '해당없음') return undefined
  return value
}
