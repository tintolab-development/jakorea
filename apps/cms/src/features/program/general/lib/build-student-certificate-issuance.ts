import { DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES } from '@/features/template/ui/template-management/template-custom-fields-form'
import type { SchoolDetailStudentRow } from '../model/school-detail-types'
import { resolveStudentCertificateTemplateName } from './student-certificate-template'
import type { StudentCertificateKind } from './resolve-student-certificate-kind'

export function certificateKindFromEligibilityApiType(
  apiType: 'COMPLETION' | 'PARTICIPATION'
): StudentCertificateKind {
  return apiType === 'COMPLETION' ? 'completion' : 'participation'
}

export const COMPLETION_CERTIFICATE_DOCUMENT_TITLE = '수료증'
export const PARTICIPATION_CERTIFICATE_DOCUMENT_TITLE = '참가인증서'

const COMPLETION_CERTIFICATE_BODY_CONTENT =
  '귀하는 위의 과정에 참여하여\n교육과정을 수료하였음을 확인합니다.'

const PARTICIPATION_CERTIFICATE_BODY_CONTENT =
  '귀하는 위 프로그램에 참여하였음을 확인합니다.'

export interface StudentCertificateDownloadContext {
  student: Pick<SchoolDetailStudentRow, 'id' | 'name' | 'birthDate' | 'gradeClass'>
  certificateKind: StudentCertificateKind
  schoolName: string
  educationGrade: string
  programTitle: string
  programPeriodLabel: string
  /** 발급 사유 — 참여자 정보 「발급목적」 행 */
  issuanceReasonLabel: string
  /** 고유번호 발급 키 — 있으면 백엔드 allocate에 전달 */
  programId?: string | number
  /** 기관 학생 명단 발급 — `…/serial/roster` */
  organizationApplicationId?: string | number
  rosterId?: number
}

function resolveDocumentTitle(kind: StudentCertificateKind): string {
  return resolveStudentCertificateTemplateName(kind)
}

function resolveBodyContent(kind: StudentCertificateKind): string {
  return kind === 'completion'
    ? COMPLETION_CERTIFICATE_BODY_CONTENT
    : PARTICIPATION_CERTIFICATE_BODY_CONTENT
}

function formatAffiliation(
  schoolName: string,
  educationGrade: string,
  gradeClass: string
): string {
  return [schoolName, educationGrade, gradeClass]
    .map(part => part?.trim())
    .filter(Boolean)
    .join(' ')
}

function formatProgramPeriodDate(value: Date | string | null | undefined): string | null {
  if (value == null || value === '') return null
  if (typeof value === 'string') {
    const ymd = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (ymd && !value.includes('T') && !value.includes('Z')) {
      return `${ymd[1]}.${ymd[2]}.${ymd[3]}`
    }
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
  return parts.replaceAll('-', '.')
}

function formatProgramPeriod(
  programStartDate?: Date | string | null,
  programEndDate?: Date | string | null
): string {
  const start = formatProgramPeriodDate(programStartDate)
  const end = formatProgramPeriodDate(programEndDate)
  if (start && end) return `${start} ~ ${end}`
  return '2026.01.01 ~ 2026.12.31'
}

export function buildStudentCertificateProgramPeriodLabel(
  programStartDate?: Date | string | null,
  programEndDate?: Date | string | null
): string {
  return formatProgramPeriod(programStartDate, programEndDate)
}

/** 서버 `certificatePeriodLabel`을 최우선. 없으면 시작·종료일로만 조합하고, 한쪽만 있으면 쓰지 않는다. */
export function resolveStudentCertificateProgramPeriodLabel(input: {
  certifiedPeriodLabel?: string | null
  certifiedPeriodStart?: Date | string | null
  certifiedPeriodEnd?: Date | string | null
  programStartDate?: Date | string | null
  programEndDate?: Date | string | null
  requireCertifiedPeriod?: boolean
}): string | null {
  const certifiedLabel = input.certifiedPeriodLabel?.trim()
  if (certifiedLabel) return certifiedLabel
  const certifiedStart = formatProgramPeriodDate(input.certifiedPeriodStart)
  const certifiedEnd = formatProgramPeriodDate(input.certifiedPeriodEnd)
  if (certifiedStart && certifiedEnd) return `${certifiedStart} ~ ${certifiedEnd}`
  if (input.requireCertifiedPeriod) return null
  return formatProgramPeriod(input.programStartDate, input.programEndDate)
}

export function buildStudentCertificateParticipantInfo(
  ctx: StudentCertificateDownloadContext
): string {
  return [
    ctx.student.name,
    ctx.student.birthDate?.replace(/\s/g, '') ?? '-',
    formatAffiliation(ctx.schoolName, ctx.educationGrade, ctx.student.gradeClass) || '-',
    ctx.programTitle,
    ctx.programPeriodLabel,
    ctx.issuanceReasonLabel,
  ].join('\n')
}

export function buildStudentCertificateInitialStringValues(
  ctx: StudentCertificateDownloadContext
): Record<string, string> {
  return {
    ...DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES,
    titleName: resolveDocumentTitle(ctx.certificateKind),
    bodyContent: resolveBodyContent(ctx.certificateKind),
    participantInfo: buildStudentCertificateParticipantInfo(ctx),
  }
}

export function buildStudentCertificateFileName(ctx: StudentCertificateDownloadContext): string {
  const documentTitle = resolveDocumentTitle(ctx.certificateKind)
  const safeName = ctx.student.name.replace(/[/\\?%*:|"<>]/g, '_').trim() || '학생'
  const now = new Date()
  const y = String(now.getFullYear()).slice(2)
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `[JA Korea] ${documentTitle}_${safeName}_${y}${m}${d}`
}

export function buildStudentCertificateDownloadContext(input: {
  student: SchoolDetailStudentRow
  certificateKind: StudentCertificateKind
  schoolName: string
  educationGrade: string
  programTitle: string
  programStartDate?: Date | string | null
  programEndDate?: Date | string | null
  /** 서버 `certificatePeriodLabel`. 있으면 날짜 조합보다 우선한다. */
  certifiedPeriodLabel?: string | null
  /** 서버 `certificatePeriodStartDate`. */
  certifiedPeriodStart?: Date | string | null
  /** 서버 `certificatePeriodEndDate`. */
  certifiedPeriodEnd?: Date | string | null
  /** GIVE_UP 참가인증서 — 인증 기간이 없으면 프로그램 전체 기간으로 대체하지 않는다. */
  requireCertifiedPeriod?: boolean
  issuanceReasonLabel: string
  programId?: string | number
  organizationApplicationId?: string | number
  rosterId?: number
}): StudentCertificateDownloadContext {
  return {
    student: {
      id: input.student.id,
      name: input.student.name,
      birthDate: input.student.birthDate,
      gradeClass: input.student.gradeClass,
    },
    certificateKind: input.certificateKind,
    schoolName: input.schoolName,
    educationGrade: input.educationGrade,
    programTitle: input.programTitle,
    programPeriodLabel:
      resolveStudentCertificateProgramPeriodLabel({
        certifiedPeriodLabel: input.certifiedPeriodLabel,
        certifiedPeriodStart: input.certifiedPeriodStart,
        certifiedPeriodEnd: input.certifiedPeriodEnd,
        programStartDate: input.programStartDate,
        programEndDate: input.programEndDate,
        requireCertifiedPeriod: input.requireCertifiedPeriod,
      }) ?? '',
    issuanceReasonLabel: input.issuanceReasonLabel,
    ...(input.programId != null ? { programId: input.programId } : {}),
    ...(input.organizationApplicationId != null
      ? { organizationApplicationId: input.organizationApplicationId }
      : {}),
    ...(input.rosterId != null ? { rosterId: input.rosterId } : {}),
  }
}
