/**
 * Portal 신청 POST 직전 answers 점검용. 개인정보 원문은 남기지 않는다.
 */

import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import type { PortalSaveApplicationRequest } from '../api/application-types.ts'

const IDS = PROGRAM_APPLICATION_FORM_INSTITUTION_IDS

function jsType(value: unknown): string {
  if (value == null) return String(value)
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function objectKeys(value: unknown): string[] | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return Object.keys(value)
}

function readSchedule(answers: Record<string, unknown>): unknown {
  return answers[IDS.scheduleChoice]
}

function readSubmission(answers: Record<string, unknown>): unknown {
  return answers[IDS.sexOffenseConsentSubmissionRequest]
}

function readInquiry(answers: Record<string, unknown>): unknown {
  return answers[IDS.sexOffenseConsentInquiryMethod]
}

export type PortalApplicationSubmitDebugSnapshot = {
  programId: number | null
  recruitmentId: number | null | undefined
  formBindingId: number | null | undefined
  templateVersionId: number | null | undefined
  applicationType: string | null | undefined
  answerKeys: string[]
  answerTypes: Record<string, string>
  schedule: unknown
  guidanceIncluded: boolean
  submissionType: string
  submissionKeys: string[] | null
  submissionRequest: unknown
  inquiryType: string
  inquiryIncluded: boolean
  inquiryKeys: string[] | null
  inquiryFieldsPresent: boolean
}

export function summarizePortalApplicationSubmit(input: {
  programId: number | null
  body: Pick<
    PortalSaveApplicationRequest,
    'recruitmentId' | 'formBindingId' | 'applicationType' | 'answers'
  >
  templateVersionId?: number | null
}): PortalApplicationSubmitDebugSnapshot {
  const answers =
    input.body.answers && typeof input.body.answers === 'object' && !Array.isArray(input.body.answers)
      ? (input.body.answers as Record<string, unknown>)
      : {}
  const answerKeys = Object.keys(answers)
  const answerTypes: Record<string, string> = {}
  for (const key of answerKeys) {
    answerTypes[key] = jsType(answers[key])
  }
  const submission = readSubmission(answers)
  const inquiry = readInquiry(answers)
  const inquiryKeys = objectKeys(inquiry)
  return {
    programId: input.programId,
    recruitmentId: input.body.recruitmentId,
    formBindingId: input.body.formBindingId,
    templateVersionId: input.templateVersionId ?? null,
    applicationType: input.body.applicationType,
    answerKeys,
    answerTypes,
    schedule: readSchedule(answers),
    guidanceIncluded: IDS.guidance in answers,
    submissionType: jsType(submission),
    submissionKeys: objectKeys(submission),
    submissionRequest:
      submission && typeof submission === 'object' && !Array.isArray(submission)
        ? (submission as Record<string, unknown>).submissionRequest ?? null
        : null,
    inquiryType: jsType(inquiry),
    inquiryIncluded: IDS.sexOffenseConsentInquiryMethod in answers,
    inquiryKeys,
    inquiryFieldsPresent: Boolean(
      inquiryKeys?.includes('inquiryMethod') &&
        inquiryKeys.includes('siteSubmission') &&
        inquiryKeys.includes('institutionId') &&
        inquiryKeys.includes('verificationNumber'),
    ),
  }
}

export function readApplicationApiErrorEnvelope(error: unknown): {
  code: string | null
  message: string | null
  field: unknown
  traceId: string | null
  details: unknown
} {
  const empty = {
    code: null,
    message: null,
    field: null,
    traceId: null,
    details: null,
  }
  if (typeof error !== 'object' || error == null || !('response' in error)) return empty
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (!data || typeof data !== 'object') return empty
  const body = data as {
    message?: unknown
    error?: {
      code?: unknown
      message?: unknown
      field?: unknown
      traceId?: unknown
      details?: unknown
    }
  }
  const nested = body.error
  return {
    code: typeof nested?.code === 'string' ? nested.code : null,
    message:
      typeof nested?.message === 'string'
        ? nested.message
        : typeof body.message === 'string'
          ? body.message
          : null,
    field: nested && 'field' in nested ? nested.field : null,
    traceId: typeof nested?.traceId === 'string' ? nested.traceId : null,
    details: nested && 'details' in nested ? nested.details : null,
  }
}
