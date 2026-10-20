import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-trained-teachers-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-institution-draft'
import type { ProgramDetailCase } from '@/features/program'
import {
  basicInfoValuesFromDraftAnswer,
  type ApplyTrainedTeachersBasicInfoValues,
} from '@/features/program/ui/apply-trained-teachers-basic-info/apply-trained-teachers-basic-info'
import type { EducationTeacherApplicationInstitution } from '../model/types'

const EDUCATION_FORMAT_LABELS: Record<string, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '온/오프라인',
}

const EDUCATION_PLACE_LABELS: Record<string, string> = {
  inside: '기관 안',
  outside: '기관 밖',
  custom: '기타(직접입력)',
}

/**
 * Portal `GET …/me/program-applications/…` MEMBER_SELF answers 기본정보 단락 id.
 * `teacherTel` / `teacherMobile` / `teacherEmail`은 마스킹되지 않은 원문 string.
 */
const PORTAL_BASIC_INFO_ANSWER_KEYS = [
  PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.basicInfo,
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo,
  PROGRAM_APPLICATION_FORM_ECONOMY_IDS.basicInfo,
  UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo,
] as const

function resolveBasicInfoAnswerKey(
  detailCase: ProgramDetailCase | undefined,
  programGroup?: string,
): string {
  if (detailCase === 'gemini') {
    return PROGRAM_APPLICATION_FORM_ECONOMY_IDS.basicInfo
  }
  if (detailCase === 'ujat-participant') {
    return UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo
  }
  if ((programGroup ?? '').toUpperCase() === 'TRAINED_TEACHER') {
    return PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.basicInfo
  }
  return PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo
}

function basicInfoAnswerKeysInPriority(
  detailCase: ProgramDetailCase | undefined,
  programGroup?: string,
): string[] {
  const preferred = resolveBasicInfoAnswerKey(detailCase, programGroup)
  return [preferred, ...PORTAL_BASIC_INFO_ANSWER_KEYS.filter(key => key !== preferred)]
}

function formatApplicationGradeLabel(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (trimmed.endsWith('학년')) return trimmed
  if (/^\d+$/.test(trimmed)) return `${trimmed}학년`
  return trimmed
}

function formatClassAndHeadcount(values: ApplyTrainedTeachersBasicInfoValues): string {
  const classCount = Number.parseInt(values.classCount, 10)
  const studentCount = Number.parseInt(values.studentCount, 10)
  const classPart =
    Number.isFinite(classCount) && classCount > 0 ? `${classCount}개 학급` : values.classCount.trim()
  const studentPart =
    Number.isFinite(studentCount) && studentCount > 0
      ? `총 ${studentCount}명`
      : values.studentCount.trim()
  if (classPart && studentPart) return `${classPart} | ${studentPart}`
  return classPart || studentPart
}

/** 이름 | 내선 | 휴대폰 | 이메일 — Portal 본인 상세는 원문(비마스킹)을 그대로 표시 */
function formatTeacherContact(values: ApplyTrainedTeachersBasicInfoValues): string {
  const parts = [
    values.teacherName.trim(),
    values.teacherTel.trim(),
    values.teacherMobile.trim(),
    values.teacherEmail.trim(),
  ].filter(Boolean)
  return parts.join(' | ')
}

function formatVenue(values: ApplyTrainedTeachersBasicInfoValues): string | undefined {
  const place = values.educationPlace.trim()
  if (!place) return undefined
  const base = EDUCATION_PLACE_LABELS[place] ?? place
  const detail = values.educationPlaceDetail.trim()
  if (place === 'custom' && detail) return detail
  if (detail && place !== 'custom') return `${base} · ${detail}`
  return base
}

function readAnswerStringField(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const raw = row[key]
    if (typeof raw === 'string' && raw.trim()) return raw.trim()
    if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  }
  return ''
}

function readPreferredFieldsFromAnswerRow(
  row: Record<string, unknown>,
  values: ApplyTrainedTeachersBasicInfoValues,
): Pick<EducationTeacherApplicationInstitution, 'preferredEducationForm' | 'venue'> {
  const preferred: Pick<EducationTeacherApplicationInstitution, 'preferredEducationForm' | 'venue'> =
    {}

  if (Object.prototype.hasOwnProperty.call(row, 'educationFormat')) {
    const formatRaw = readAnswerStringField(row, 'educationFormat')
    if (formatRaw) {
      preferred.preferredEducationForm =
        EDUCATION_FORMAT_LABELS[formatRaw] ?? formatRaw
    }
  }

  if (Object.prototype.hasOwnProperty.call(row, 'educationPlace')) {
    const venue = formatVenue({
      ...values,
      educationPlace: readAnswerStringField(row, 'educationPlace'),
      educationPlaceDetail: Object.prototype.hasOwnProperty.call(row, 'educationPlaceDetail')
        ? readAnswerStringField(row, 'educationPlaceDetail')
        : values.educationPlaceDetail,
    })
    if (venue) preferred.venue = venue
  }

  return preferred
}

function institutionFromBasicInfoValues(
  values: ApplyTrainedTeachersBasicInfoValues,
  preferredFromAnswers?: Pick<
    EducationTeacherApplicationInstitution,
    'preferredEducationForm' | 'venue'
  >,
): EducationTeacherApplicationInstitution {
  const preferredEducationForm = preferredFromAnswers?.preferredEducationForm
  const venue = preferredFromAnswers?.venue

  return {
    name: values.schoolName.trim(),
    grade: formatApplicationGradeLabel(values.applicationGrade),
    address: values.regionLabel.trim(),
    addressDetail: values.addressDetail.trim(),
    classAndHeadcount: formatClassAndHeadcount(values),
    ...(preferredEducationForm ? { preferredEducationForm } : {}),
    ...(venue ? { venue } : {}),
    teacherContact: formatTeacherContact(values),
    reason: values.applicationReason.trim(),
    otherRequests: values.otherRequests.trim(),
  }
}

export function mapTeacherInstitutionFromApplicationAnswers(
  answers: Record<string, unknown> | undefined,
  detailCase: ProgramDetailCase | undefined,
  programGroup?: string,
): EducationTeacherApplicationInstitution | null {
  if (!answers || Object.keys(answers).length === 0) return null

  for (const key of basicInfoAnswerKeysInPriority(detailCase, programGroup)) {
    const raw = answers[key]
    const values = basicInfoValuesFromDraftAnswer(raw)
    if (!values) continue
    const row =
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {}
    const preferredFromAnswers = readPreferredFieldsFromAnswerRow(row, values)
    return institutionFromBasicInfoValues(values, preferredFromAnswers)
  }

  return null
}
