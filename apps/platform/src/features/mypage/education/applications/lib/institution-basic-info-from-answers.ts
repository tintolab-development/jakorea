import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-trained-teachers-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-institution-draft'
import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/gemini-visiting-training-application-form-institution-draft'
import type { ProgramDetailCase } from '@/features/program'
import {
  basicInfoValuesFromDraftAnswer,
  emptyTrainedTeachersBasicInfo,
  type ApplyTrainedTeachersBasicInfoValues,
} from '@/features/program/ui/apply-trained-teachers-basic-info/apply-trained-teachers-basic-info'
import type { EducationTeacherApplicationInstitution } from '../model/types'

const EDUCATION_FORMAT_LABELS: Record<string, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '온/오프라인',
  ONLINE: '온라인',
  OFFLINE: '오프라인',
  HYBRID: '온/오프라인',
}

const EDUCATION_PLACE_LABELS: Record<string, string> = {
  inside: '기관 안',
  outside: '기관 밖',
  custom: '기타(직접입력)',
  INSIDE: '기관 안',
  OUTSIDE: '기관 밖',
  CUSTOM: '기타(직접입력)',
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

function readNestedValue(row: Record<string, unknown>, path: string): unknown {
  if (path in row) return row[path]
  const parts = path.split('.')
  if (parts.length < 2) return undefined
  let current: unknown = row
  for (const part of parts) {
    const next = asRecordIfObject(current)
    if (!next) return undefined
    current = next[part]
  }
  return current
}

function stringifyAnswerField(raw: unknown): string {
  if (typeof raw === 'string') return raw.trim()
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  return ''
}

function readAnswerStringField(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const direct = stringifyAnswerField(row[key])
    if (direct) return direct
    if (key.includes('.')) {
      const nested = stringifyAnswerField(readNestedValue(row, key))
      if (nested) return nested
    }
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

function asRecordIfObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readLabeledTableCell(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function readLabeledTableValue(row: Record<string, unknown>, labelIncludes: string[]): string {
  const dataRows = row.dataRows
  if (!Array.isArray(dataRows)) return ''
  for (const item of dataRows) {
    if (!Array.isArray(item)) continue
    const label = typeof item[0] === 'string' ? item[0] : ''
    const value = readLabeledTableCell(item[1])
    if (value && labelIncludes.some(token => label.includes(token))) return value
  }
  return ''
}

function readGeminiInstitutionFromAnswers(
  answers: Record<string, unknown>,
): EducationTeacherApplicationInstitution {
  const training = asRecordIfObject(
    answers[GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.trainingInfo],
  )
  const contact = asRecordIfObject(
    answers[GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.contactPerson],
  )
  const overlay = asRecordIfObject(answers.geminiApplication) ?? answers

  const studentCountRaw =
    (training
      ? readAnswerStringField(training, 'studentCount', 'totalStudents', 'participantCount', 'headcount')
      : '') ||
    readAnswerStringField(overlay, 'application.gemini.inst.headcount', 'headcount')
  const jobTitle =
    (contact
      ? readAnswerStringField(contact, 'jobTitle', 'position', 'rank', 'contactJobTitle')
      : '') ||
    (contact ? readLabeledTableValue(contact, ['직급', '직위']) : '') ||
    readAnswerStringField(overlay, 'application.gemini.inst.contactJobTitle', 'contactJobTitle')
  const subject =
    (contact
      ? readAnswerStringField(contact, 'subject', 'classSubject', 'contactSubject')
      : '') ||
    (contact ? readLabeledTableValue(contact, ['과목']) : '') ||
    readAnswerStringField(overlay, 'application.gemini.inst.contactSubject')
  const teacherName =
    (contact
      ? readAnswerStringField(contact, 'teacherName', 'managerName', 'contactName', 'name') ||
        readLabeledTableValue(contact, ['담당 교사', '교사명', '담당자', '성명', '이름'])
      : '') ||
    readAnswerStringField(overlay, 'teacherName', 'managerName', 'contactName', 'teacherContactName')
  const teacherTel = contact
    ? readAnswerStringField(contact, 'teacherTel', 'tel', 'phone')
    : ''
  const teacherMobile = contact
    ? readAnswerStringField(contact, 'teacherMobile', 'mobile')
    : ''
  const teacherEmail = contact
    ? readAnswerStringField(contact, 'teacherEmail', 'email')
    : ''

  const name =
    readAnswerStringField(
      overlay,
      'institutionName',
      'schoolName',
      'organizationName',
      'teacherSchoolName',
      'approvedInstitutionName',
      'application.gemini.inst.institutionName',
    ) ||
    (training
      ? readAnswerStringField(training, 'institutionName', 'schoolName', 'organizationName') ||
        readLabeledTableValue(training, ['신청 기관명', '기관명', '학교명', '소속', '학교/기관명'])
      : '')
  const grade = formatApplicationGradeLabel(
    readAnswerStringField(
      overlay,
      'applicationGrade',
      'educationGrade',
      'requestedGrade',
      'grade',
      'application.gemini.inst.grade',
    ) ||
      (training
        ? readAnswerStringField(training, 'applicationGrade', 'educationGrade', 'grade') ||
          readLabeledTableValue(training, ['학년', '담당학년', '신청 학년'])
        : ''),
  )
  const address =
    readAnswerStringField(
      overlay,
      'regionLabel',
      'organizationRegion',
      'institutionAddress',
      'address',
      'application.gemini.inst.address',
    ) ||
    (training
      ? readAnswerStringField(training, 'regionLabel', 'organizationRegion', 'institutionAddress', 'address') ||
        readLabeledTableValue(training, ['소재지', '주소', '지역', '기관 소재지'])
      : '')
  const addressDetail =
    readAnswerStringField(
      overlay,
      'addressDetail',
      'detailAddress',
      'institutionAddressDetail',
      'application.gemini.inst.addressDetail',
    ) ||
    (training
      ? readAnswerStringField(training, 'addressDetail', 'detailAddress') ||
        readLabeledTableValue(training, ['상세주소', '상세 주소'])
      : '')
  const classCountRaw =
    readAnswerStringField(overlay, 'classCount', 'application.gemini.inst.classCount') ||
    (training
      ? readAnswerStringField(training, 'classCount', 'classCnt') ||
        readLabeledTableValue(training, ['학급'])
      : '')

  const teacherContact = [teacherName, teacherTel, teacherMobile, teacherEmail]
    .map(part => part.trim())
    .filter(Boolean)
    .join(' | ')

  const classAndHeadcount = formatClassAndHeadcount({
    ...emptyTrainedTeachersBasicInfo(),
    classCount: classCountRaw,
    studentCount: studentCountRaw,
  })

  return {
    name,
    grade,
    address,
    addressDetail,
    classAndHeadcount,
    teacherContact,
    reason: '',
    otherRequests: '',
    ...(studentCountRaw
      ? { studentCount: studentCountRaw.endsWith('명') ? studentCountRaw : `${studentCountRaw}명` }
      : {}),
    ...(jobTitle && jobTitle !== teacherName ? { jobTitle } : {}),
    ...(subject ? { subject } : {}),
  }
}

export function mapTeacherInstitutionFromApplicationAnswers(
  answers: Record<string, unknown> | undefined,
  detailCase: ProgramDetailCase | undefined,
  programGroup?: string,
): EducationTeacherApplicationInstitution | null {
  if (!answers || Object.keys(answers).length === 0) return null

  if (detailCase === 'gemini') {
    const gemini = readGeminiInstitutionFromAnswers(answers)
    const hasGeminiFields = Boolean(
      gemini.name ||
        gemini.grade ||
        gemini.address ||
        gemini.addressDetail ||
        gemini.teacherContact ||
        gemini.studentCount ||
        gemini.jobTitle ||
        gemini.subject,
    )
    if (hasGeminiFields) return gemini
  }

  for (const key of basicInfoAnswerKeysInPriority(detailCase, programGroup)) {
    if (key === GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.trainingInfo) continue
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
