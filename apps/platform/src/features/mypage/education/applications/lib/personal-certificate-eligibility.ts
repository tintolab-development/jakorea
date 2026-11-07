import type { ProgramApplicationType } from '../api/types'

function isExcludedGeminiSurface(input: {
  programType?: string | null
  detailCase?: string | null
}): boolean {
  if ((input.detailCase ?? '').trim().toLowerCase() === 'gemini') return true
  const type = (input.programType ?? '').trim().toUpperCase()
  return type === 'GEMINI_TRAINING' || type === 'GEMINI' || type === 'VISITING_TRAINING'
}

/**
 * 플랫폼 개인 수료증 발급 CTA 대상.
 * TRAINED_TEACHER / GEMINI / ORGANIZATION·UJAT 기관 플로우는 제외.
 * GENERAL_EDUCATION(일반) INDIVIDUAL만.
 */
export function shouldShowPersonalCertificateAction(input: {
  applicationType?: ProgramApplicationType | string | null
  programType?: string | null
  programGroup?: string | null
  detailCase?: string | null
  isTeacher?: boolean
}): boolean {
  if ((input.applicationType ?? '').trim().toUpperCase() !== 'INDIVIDUAL') return false
  if (isExcludedGeminiSurface(input)) return false
  const programType = (input.programType ?? '').trim().toUpperCase()
  const programGroup = (input.programGroup ?? '').trim().toUpperCase()
  if (programType === 'TRAINED_TEACHER' || programGroup === 'TRAINED_TEACHER') return false
  const detailCase = (input.detailCase ?? '').trim().toLowerCase()
  if (
    detailCase === 'ujat-participant' ||
    detailCase === 'ujat-volunteer' ||
    detailCase === 'instructor' ||
    detailCase === 'volunteer' ||
    detailCase === 'gemini'
  ) {
    return false
  }
  // detailCase general 또는 programType GENERAL_* / 비어 있음(상세 programType 지연)
  if (detailCase && detailCase !== 'general') return false
  if (
    programType &&
    !programType.startsWith('GENERAL') &&
    programType !== 'GENERAL_EDUCATION' &&
    programType !== 'GENERAL_INDIVIDUAL'
  ) {
    return false
  }
  return true
}

export function hasIssueCertificateListAction(
  availableActions: readonly string[] | null | undefined,
): boolean {
  return (availableActions ?? []).some(action => action.trim().toUpperCase() === 'ISSUE_CERTIFICATE')
}

/** 발급 CTA 최종 가능 여부 — availability SSOT */
export function isPersonalCertificateActionable(availability: {
  available?: boolean
  canDownload?: boolean
} | null | undefined): boolean {
  if (!availability) return false
  return availability.canDownload === true || availability.available === true
}

export function portalCertificateDocumentLabel(
  certificateType: string | null | undefined,
): '수료증' | '참가인증서' {
  const normalized = (certificateType ?? '').trim().toUpperCase()
  if (normalized === 'PARTICIPATION' || normalized.includes('PARTICIPATION')) {
    return '참가인증서'
  }
  return '수료증'
}

export function portalCertificateCtaButtonLabel(input: {
  certificateType: string | null | undefined
  action: 'issue' | 'download'
}): string {
  const documentLabel = portalCertificateDocumentLabel(input.certificateType)
  return input.action === 'download' ? `${documentLabel} 다운로드` : `${documentLabel} 발급하기`
}

export function portalCertificateIssueType(
  certificateType: string | null | undefined,
): 'AUTO' | 'COMPLETION' | 'PARTICIPATION' {
  const normalized = (certificateType ?? '').trim().toUpperCase()
  if (normalized === 'COMPLETION') return 'COMPLETION'
  if (normalized === 'PARTICIPATION') return 'PARTICIPATION'
  return 'AUTO'
}
