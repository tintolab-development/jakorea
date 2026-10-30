/**
 * 모집 상세정보(공용 단락) — RHF 필드 폼. 텍스트·리치텍스트·미디어(썸네일·첨부) 키 전부.
 *
 * Part3 5단계: 일반 모집 overlay 스토어에서 `<prefix>.detailInfo.*` 키 묶음을 RHF로 옮겼다.
 * - prefix: 일반 기관·개인(`recruit.detailInfo`), 1사1교, TT, 강사, 봉사자(반기 포함), Gemini, UJAT 기관.
 *   공용 단락 하나가 모든 유형에 쓰이므로 저장 위치도 하나다(키·값 형태는 그대로).
 * - 일반 위저드: 텍스트는 RHF `recruitmentKv`가 정본이고 같은 값을 이 폼에도 둔다. 미디어는 위저드가 모델링하지 않아 이 폼이 정본.
 * - 1사1교·TT RHF 마운트 중: 그 RHF가 소유한 상세정보 키는 그쪽으로 가고 나머지만 이 폼(예전 스토어와 같은 라우팅).
 * - 일반 모집 스토어(`general-recruit-overlay-sync`)는 이 폼을 합성해서 기존 읽기·collect 결과를 그대로 만든다.
 */
import { createScopedRhfFieldForm } from '@/features/template/ui/form-set/shared/scoped-rhf-field-form'
import { filterUjatTypedRecruitmentOverlayPatch } from '@/features/program/ujat/lib/ujat-typed-recruitment-overlay-write-block'
import {
  peekGeneralRecruitFieldRecord,
  replaceGeneralRecruitFields,
  replaceGeneralRecruitFieldsForScope,
  updateGeneralRecruitField,
  useGeneralRecruitField,
  writeGeneralRecruitFields,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-field-binding'

export const RECRUIT_DETAIL_INFO_FIELD_PREFIXES = [
  'recruit.detailInfo',
  'economyRecruit.detailInfo',
  'trainedTeachersRecruit.detailInfo',
  'ujatRecruit.detailInfo',
  'recruitVolunteer.detailInfo',
  'recruitVolunteer.h1.detailInfo',
  'recruitVolunteer.h2.detailInfo',
  'recruitInstructor.detailInfo',
  'geminiRecruit.detailInfo',
] as const

export function isRecruitDetailInfoFieldKey(key: string): boolean {
  return RECRUIT_DETAIL_INFO_FIELD_PREFIXES.some(prefix => key.startsWith(`${prefix}.`))
}

export const recruitDetailInfoFieldForm = createScopedRhfFieldForm({
  ownsKey: isRecruitDetailInfoFieldKey,
})

function ownedOnly(record: Record<string, unknown>): Record<string, unknown> {
  return recruitDetailInfoFieldForm.split(record).owned
}

/** 활성 양식 상세정보 레코드(예전 `getGeneralRecruitOverlayRecord()` 의 상세정보 부분) */
export function getRecruitDetailInfoRecord(): Record<string, unknown> {
  return recruitDetailInfoFieldForm.getRecord()
}

/** 양식별 상세정보 레코드(예전 `peekGeneralRecruitOverlayRecord(code)` 의 상세정보 부분, 위저드·1사1교·TT 병합 포함) */
export function peekRecruitDetailInfoRecord(
  templateCode: string | undefined | null
): Record<string, unknown> {
  return ownedOnly(peekGeneralRecruitFieldRecord(recruitDetailInfoFieldForm, templateCode))
}

export function getRecruitDetailInfoScope(): string {
  return recruitDetailInfoFieldForm.getScope()
}

export function getRecruitDetailInfoVersion(): number {
  return recruitDetailInfoFieldForm.getVersion()
}

export function subscribeRecruitDetailInfo(listener: () => void): () => void {
  return recruitDetailInfoFieldForm.subscribe(listener)
}

export function patchRecruitDetailInfo(partial: Record<string, unknown>): void {
  const allowed = filterUjatTypedRecruitmentOverlayPatch(partial)
  if (allowed == null) return
  writeGeneralRecruitFields(recruitDetailInfoFieldForm, allowed)
}

export function updateRecruitDetailInfoKey<T>(key: string, updater: (prev: T | undefined) => T): void {
  updateGeneralRecruitField(recruitDetailInfoFieldForm, key, updater)
}

export function replaceRecruitDetailInfoForScope(
  templateCode: string | undefined | null,
  next: Record<string, unknown>
): void {
  replaceGeneralRecruitFieldsForScope(recruitDetailInfoFieldForm, templateCode, ownedOnly(next))
}

export function replaceActiveRecruitDetailInfo(next: Record<string, unknown>): void {
  replaceGeneralRecruitFields(recruitDetailInfoFieldForm, ownedOnly(next))
}

/** 상세정보 단락 입력 바인딩 */
export function useRecruitDetailInfoField<T>(key: string, defaultValue: T): [T, (next: T) => void] {
  return useGeneralRecruitField(recruitDetailInfoFieldForm, key, defaultValue)
}
