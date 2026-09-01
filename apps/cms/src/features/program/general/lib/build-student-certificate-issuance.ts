import { DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES } from '@/features/template/ui/template-management/template-custom-fields-form'
import type { SchoolDetailStudentRow } from '../model/school-detail-types'
import { resolveStudentCertificateTemplateName } from './student-certificate-template'
import type { StudentCertificateKind } from './resolve-student-certificate-kind'

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

function formatProgramPeriod(
  programStartDate?: Date | string | null,
  programEndDate?: Date | string | null
): string {
  const format = (value: Date | string | null | undefined): string | null => {
    if (value == null || value === '') return null
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return null
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}.${m}.${d}`
  }

  const start = format(programStartDate)
  const end = format(programEndDate)
  if (start && end) return `${start} ~ ${end}`
  return '2026.01.01 ~ 2026.12.31'
}

export function buildStudentCertificateProgramPeriodLabel(
  programStartDate?: Date | string | null,
  programEndDate?: Date | string | null
): string {
  return formatProgramPeriod(programStartDate, programEndDate)
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
  return `${documentTitle}_${safeName}_${y}${m}${d}`
}

export function buildStudentCertificateDownloadContext(input: {
  student: SchoolDetailStudentRow
  certificateKind: StudentCertificateKind
  schoolName: string
  educationGrade: string
  programTitle: string
  programStartDate?: Date | string | null
  programEndDate?: Date | string | null
  issuanceReasonLabel: string
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
    programPeriodLabel: buildStudentCertificateProgramPeriodLabel(
      input.programStartDate,
      input.programEndDate
    ),
    issuanceReasonLabel: input.issuanceReasonLabel,
  }
}
