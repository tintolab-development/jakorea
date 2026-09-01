/**
 * 일반 프로그램 기관 신청 폼 — 단락 간 조건부 노출(응답 값 기반).
 * 템플릿 편집기·신청 정보 미리보기가 동일 스토어를 구독한다.
 */

import { useSyncExternalStore } from 'react'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@/features/template/model/program-application-form-instructor-draft'

export type InstitutionSexOffenseConsentSubmissionRequest = 'request' | 'no_submit'

const DEFAULT_SEX_OFFENSE_CONSENT_SUBMISSION_REQUEST: InstitutionSexOffenseConsentSubmissionRequest =
  'request'

let sexOffenseConsentSubmissionRequest: InstitutionSexOffenseConsentSubmissionRequest =
  DEFAULT_SEX_OFFENSE_CONSENT_SUBMISSION_REQUEST
let visibilityVersion = 0
const listeners = new Set<() => void>()

function emit() {
  visibilityVersion += 1
  listeners.forEach(listener => listener())
}

export function subscribeInstitutionApplicationFormVisibility(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getInstitutionApplicationFormVisibilityVersion(): number {
  return visibilityVersion
}

export function getInstitutionSexOffenseConsentSubmissionRequest(): InstitutionSexOffenseConsentSubmissionRequest {
  return sexOffenseConsentSubmissionRequest
}

export function patchInstitutionSexOffenseConsentSubmissionRequest(
  value: InstitutionSexOffenseConsentSubmissionRequest
): void {
  if (sexOffenseConsentSubmissionRequest === value) return
  sexOffenseConsentSubmissionRequest = value
  emit()
}

export function resetInstitutionApplicationFormVisibility(): void {
  sexOffenseConsentSubmissionRequest = DEFAULT_SEX_OFFENSE_CONSENT_SUBMISSION_REQUEST
  emit()
}

/** 「동의서 제출 요청」 선택 시에만 조회 방식 단락 노출 */
export function shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph(): boolean {
  return sexOffenseConsentSubmissionRequest === 'request'
}

/** 기관 「동의서 제출 요청」 선택 시에만 강사 신청 — 성범죄 경력 조회서 제출 단락 노출 */
export function shouldShowInstructorApplicationCrimeRecordParagraph(): boolean {
  return shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph()
}

export function getInstructorApplicationFormHiddenParagraphIds(): ReadonlySet<string> | undefined {
  if (shouldShowInstructorApplicationCrimeRecordParagraph()) return undefined
  return new Set([PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.crimeRecord])
}

export function useInstitutionApplicationFormVisibilityVersion(): number {
  return useSyncExternalStore(
    subscribeInstitutionApplicationFormVisibility,
    getInstitutionApplicationFormVisibilityVersion,
    getInstitutionApplicationFormVisibilityVersion
  )
}
