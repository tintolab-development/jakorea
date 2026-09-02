/**
 * 일반 프로그램 기관 신청 폼 — 단락 간 조건부 노출(응답 값 기반).
 * 템플릿 편집기·신청 정보 미리보기가 동일 스토어를 구독한다.
 */

import { useSyncExternalStore } from 'react'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@/features/template/model/program-application-form-instructor-draft'

export type InstitutionSexOffenseConsentSubmissionRequest = 'request' | 'no_submit'
export type InstitutionSexOffenseConsentInquiryMethod = 'ja_system' | 'criminal_record_site'
export type InstitutionSexOffenseConsentSiteSubmission = 'direct' | 'online'

const DEFAULT_SEX_OFFENSE_CONSENT_SUBMISSION_REQUEST: InstitutionSexOffenseConsentSubmissionRequest =
  'request'
const DEFAULT_SEX_OFFENSE_CONSENT_INQUIRY_METHOD: InstitutionSexOffenseConsentInquiryMethod =
  'criminal_record_site'
const DEFAULT_SEX_OFFENSE_CONSENT_SITE_SUBMISSION: InstitutionSexOffenseConsentSiteSubmission =
  'online'

let sexOffenseConsentSubmissionRequest: InstitutionSexOffenseConsentSubmissionRequest =
  DEFAULT_SEX_OFFENSE_CONSENT_SUBMISSION_REQUEST
let sexOffenseConsentInquiryMethod: InstitutionSexOffenseConsentInquiryMethod =
  DEFAULT_SEX_OFFENSE_CONSENT_INQUIRY_METHOD
let sexOffenseConsentSiteSubmission: InstitutionSexOffenseConsentSiteSubmission =
  DEFAULT_SEX_OFFENSE_CONSENT_SITE_SUBMISSION
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

export function getInstitutionSexOffenseConsentInquiryMethod(): InstitutionSexOffenseConsentInquiryMethod {
  return sexOffenseConsentInquiryMethod
}

export function patchInstitutionSexOffenseConsentInquiryMethod(
  value: InstitutionSexOffenseConsentInquiryMethod
): void {
  if (sexOffenseConsentInquiryMethod === value) return
  sexOffenseConsentInquiryMethod = value
  emit()
}

export function getInstitutionSexOffenseConsentSiteSubmission(): InstitutionSexOffenseConsentSiteSubmission {
  return sexOffenseConsentSiteSubmission
}

export function patchInstitutionSexOffenseConsentSiteSubmission(
  value: InstitutionSexOffenseConsentSiteSubmission
): void {
  if (sexOffenseConsentSiteSubmission === value) return
  sexOffenseConsentSiteSubmission = value
  emit()
}

export function resetInstitutionApplicationFormVisibility(): void {
  sexOffenseConsentSubmissionRequest = DEFAULT_SEX_OFFENSE_CONSENT_SUBMISSION_REQUEST
  sexOffenseConsentInquiryMethod = DEFAULT_SEX_OFFENSE_CONSENT_INQUIRY_METHOD
  sexOffenseConsentSiteSubmission = DEFAULT_SEX_OFFENSE_CONSENT_SITE_SUBMISSION
  emit()
}

/** 「동의서 제출 요청」 선택 시에만 조회 방식 단락 노출 */
export function shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph(): boolean {
  return sexOffenseConsentSubmissionRequest === 'request'
}

/** 기관 온라인 제출 선택 시에만 강사 신청 — 성범죄 경력 조회서 제출 단락 노출 */
export function shouldShowInstructorApplicationCrimeRecordParagraph(): boolean {
  if (!shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph()) return false
  if (sexOffenseConsentInquiryMethod !== 'criminal_record_site') return false
  return sexOffenseConsentSiteSubmission === 'online'
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
