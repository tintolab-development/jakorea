import { mockUsers } from '@/data/mock/users'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import type { InstitutionApplicationDetailEditFields } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-edit-fields'
import type { Program } from '@/types/domain'

/** 신청 학년 — 1학년 ~ 6학년 */
export const INSTITUTION_APPLICATION_GRADE_OPTIONS = Array.from({ length: 6 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}학년`,
}))

export interface InstitutionAffiliatedTeacherOption {
  value: string
  label: string
  mobile: string
  email: string
}

export function normalizeInstitutionApplicationGradeForSelect(grade?: string): string {
  if (!grade?.trim()) return ''
  const match = grade.trim().match(/^(\d+)/)
  return match ? match[1]! : grade.trim()
}

export function formatInstitutionApplicationGradeDisplay(gradeValue: string): string {
  const trimmed = gradeValue.trim()
  if (!trimmed) return ''
  if (trimmed.endsWith('학년')) return trimmed
  return `${trimmed}학년`
}

/** 프로그램 등록 교육 형태가 「참여자 선택」일 때만 신청 상세에서 희망 교육 형태 노출 */
export function shouldShowInstitutionApplicationEducationFormatField(
  program?: Program | null
): boolean {
  if (!program) return false
  const label = resolveGeneralProgramCommonInfo(program).educationFormLabel?.trim() ?? ''
  return label.includes('참여자')
}

export function getInstitutionAffiliatedTeacherOptions(
  schoolName?: string,
  currentTeacherName?: string
): InstitutionAffiliatedTeacherOption[] {
  const normalizedSchool = schoolName?.trim()
  if (!normalizedSchool) return []

  const schoolUser = mockUsers.find(
    user =>
      user.role === 'SCHOOL' && user.schoolInfo?.schoolName?.trim() === normalizedSchool
  )
  const teachers =
    schoolUser?.schoolInfo?.affiliatedTeachers?.filter(row => row.employmentStatus === 'ACTIVE') ??
    []

  const options: InstitutionAffiliatedTeacherOption[] = teachers.map(row => ({
    value: row.id,
    label: row.name,
    mobile: row.phone,
    email: row.email,
  }))

  const currentName = currentTeacherName?.trim()
  if (currentName && !options.some(option => option.label === currentName)) {
    options.unshift({
      value: `legacy:${currentName}`,
      label: currentName,
      mobile: '',
      email: '',
    })
  }

  return options
}

export function parseInstitutionTeacherInfoFromDetail(
  detail?: { teacherInfo?: string },
  institution?: { teacherName?: string; contact?: string }
): Pick<
  InstitutionApplicationDetailEditFields,
  'teacherName' | 'teacherPhone' | 'teacherMobile' | 'teacherEmail'
> {
  const raw = detail?.teacherInfo?.trim()
  if (raw) {
    const parsed: {
      name?: string
      tel?: string
      mobile?: string
      email?: string
    } = {}

    for (const segment of raw.split('|').map(part => part.trim()).filter(Boolean)) {
      const nameMatch = segment.match(/^담당\s*교사\s*:\s*(.+)$/i)
      if (nameMatch) {
        parsed.name = nameMatch[1]?.trim()
        continue
      }
      const telMatch = segment.match(/^Tel\s*:\s*(.+)$/i)
      if (telMatch) {
        parsed.tel = telMatch[1]?.trim()
        continue
      }
      const mobileMatch = segment.match(/^M\s*:\s*(.+)$/i)
      if (mobileMatch) {
        parsed.mobile = mobileMatch[1]?.trim()
        continue
      }
      const emailMatch = segment.match(/^E-mail\s*:\s*(.+)$/i)
      if (emailMatch) {
        parsed.email = emailMatch[1]?.trim()
      }
    }

    return {
      teacherName: parsed.name ?? institution?.teacherName ?? '',
      teacherPhone: parsed.tel ?? institution?.contact ?? '',
      teacherMobile: parsed.mobile ?? '',
      teacherEmail: parsed.email ?? '',
    }
  }

  return {
    teacherName: institution?.teacherName ?? '',
    teacherPhone: institution?.contact ?? '',
    teacherMobile: '',
    teacherEmail: '',
  }
}

export function formatInstitutionTeacherInfoForDetail(fields: {
  teacherName: string
  teacherPhone: string
  teacherMobile: string
  teacherEmail: string
}): string | undefined {
  const parts: string[] = []
  const name = fields.teacherName.trim()
  if (name) parts.push(`담당 교사 : ${name}`)
  const tel = fields.teacherPhone.trim()
  if (tel) parts.push(`Tel : ${tel}`)
  const mobile = fields.teacherMobile.trim()
  if (mobile) parts.push(`M : ${mobile}`)
  const email = fields.teacherEmail.trim()
  if (email) parts.push(`E-mail : ${email}`)
  return parts.length > 0 ? parts.join(' | ') : undefined
}
