/**
 * 일반 프로그램 상세 수정 — generalRegistration overlay 스토어 시드·저장.
 * 순수 계산은 `general-registration-overlay-from-program.ts`(스토어 없음)에 있다.
 * 기존 import 경로 호환을 위해 순수 함수도 여기서 다시 내보낸다.
 */
import type { Program } from '@/types/domain'
import { resolveProgramSurveyMenuKeys } from '@/features/program/general/lib/general-survey-menu-keys'
import type { GeneralRegistrationEditorExtras } from '@/features/program/general/lib/registration-overlay-to-program'
import { deriveIndependentEditorExtrasFromProgram } from '@/features/program/general/lib/overlay-phase1/common-info-domain'
import {
  getProgramRegistrationOverlayRecord,
  pickProgramRegistrationOverlayByPrefix,
  replaceProgramRegistrationOverlayPrefix,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import {
  BASIC,
  GENERAL_REGISTRATION_OVERLAY_PREFIX,
  KPI,
  WAGE,
  buildGeneralRegistrationOverlayFromProgram,
  extrasFromGeneralProgram,
  fillPerScheduleEducationFormMaps,
  isEmptyOverlayText,
  isEmptyPaymentItemValues,
  isEmptyWageFee,
  mergeGeneralRegistrationOverlayPreferExisting,
  overlayFromProgram,
  preferFilled,
} from '@/features/program/general/lib/general-registration-overlay-from-program'

export {
  GENERAL_REGISTRATION_OVERLAY_PREFIX,
  buildGeneralRegistrationOverlayFromProgram,
  countRegularCurriculumSessions,
  countRegularScheduleDetails,
  countScheduleCurriculumGroups,
  describeIncompleteGeneralProgramDetailEditRequiredFields,
  extrasFromGeneralProgram,
  generalRegistrationRequiredFieldContextFromDetailEdit,
  hasIncompleteGeneralProgramDetailEditRequiredFields,
  mergeGeneralRegistrationOverlayPreferExisting,
  mergeRegistrationOverlayNestedSsot,
  resyncGeneralRegistrationOverlayFromProgram,
} from '@/features/program/general/lib/general-registration-overlay-from-program'

export function seedGeneralRegistrationOverlayFromProgram(program: Program): void {
  const fromProgram = buildGeneralRegistrationOverlayFromProgram(program)
  const saved = overlayFromProgram(program)
  // 중첩 행에서 만든 overlay가 진실. saved는 중첩에 없는 키만 남긴다.
  const merged = { ...saved, ...fromProgram }
  merged[`${WAGE}.grade1Fee`] = preferFilled(
    fromProgram[`${WAGE}.grade1Fee`] as number | null,
    saved[`${WAGE}.grade1Fee`] as number | null | undefined,
    isEmptyWageFee
  )
  merged[`${WAGE}.grade2Fee`] = preferFilled(
    fromProgram[`${WAGE}.grade2Fee`] as number | null,
    saved[`${WAGE}.grade2Fee`] as number | null | undefined,
    isEmptyWageFee
  )
  merged[`${WAGE}.grade3Fee`] = preferFilled(
    fromProgram[`${WAGE}.grade3Fee`] as number | null,
    saved[`${WAGE}.grade3Fee`] as number | null | undefined,
    isEmptyWageFee
  )
  merged[`${WAGE}.paymentItemValues`] = preferFilled(
    fromProgram[`${WAGE}.paymentItemValues`] as unknown[],
    saved[`${WAGE}.paymentItemValues`] as unknown[] | undefined,
    isEmptyPaymentItemValues
  )
  merged[`${WAGE}.paymentItemLabels`] = preferFilled(
    String(fromProgram[`${WAGE}.paymentItemLabels`] ?? ''),
    saved[`${WAGE}.paymentItemLabels`] as string | undefined,
    isEmptyOverlayText
  )
  // dispatched 학교/학급 수는 canonical KPI 조회 전까지 비운다.
  merged[`${KPI}.dispatchedSchool`] = null
  merged[`${KPI}.dispatchedClass`] = null
  const surveyKeys = resolveProgramSurveyMenuKeys({
    generalSurveyMenuKeys: program.generalSurveyMenuKeys,
    registrationOverlay: merged,
  })
  merged[`${BASIC}.surveyItems`] = {
    survey: surveyKeys.includes('survey'),
    satisfaction: surveyKeys.includes('satisfaction'),
    lecture_evaluation: surveyKeys.includes('lecture_evaluation'),
  }
  fillPerScheduleEducationFormMaps(merged, program)
  replaceProgramRegistrationOverlayPrefix(GENERAL_REGISTRATION_OVERLAY_PREFIX, merged)
  setGeneralRegistrationDetailEditExtras(extrasFromGeneralProgram(program))
}

/** 공통정보 RHF 저장 직전 — 폼이 반영한 Program 스냅샷으로 overlay KV 동기화 */
export function writeGeneralRegistrationOverlayFromCommonInfoFormValues(
  draftFromForm: Program
): void {
  const fromForm = buildGeneralRegistrationOverlayFromProgram(draftFromForm)
  const saved = readGeneralRegistrationOverlayForSave()
  const merged = mergeGeneralRegistrationOverlayPreferExisting(
    saved,
    fromForm,
    new Set(Object.keys(draftFromForm.generalCommonInfo ?? {}))
  )
  for (const key of [
    `${KPI}.participantCount`,
    `${KPI}.instructor`,
    `${KPI}.volunteer`,
  ] as const) {
    if (Object.prototype.hasOwnProperty.call(saved, key) && saved[key] == null) {
      merged[key] = saved[key]
    }
  }
  replaceProgramRegistrationOverlayPrefix(GENERAL_REGISTRATION_OVERLAY_PREFIX, merged)
  setGeneralRegistrationDetailEditExtras(
    deriveIndependentEditorExtrasFromProgram({
      ...draftFromForm,
      registrationOverlay: merged,
    })
  )
}

export function readGeneralRegistrationOverlayForSave(): Record<string, unknown> {
  return pickProgramRegistrationOverlayByPrefix(
    GENERAL_REGISTRATION_OVERLAY_PREFIX,
    getProgramRegistrationOverlayRecord()
  )
}

let detailEditExtras: GeneralRegistrationEditorExtras | null = null

export function setGeneralRegistrationDetailEditExtras(
  extras: GeneralRegistrationEditorExtras
): void {
  detailEditExtras = extras
}

export function getGeneralRegistrationDetailEditExtras(): GeneralRegistrationEditorExtras {
  return (
    detailEditExtras ?? {
      programType: 'curriculum',
      sessionRoundType: 'single',
    }
  )
}
