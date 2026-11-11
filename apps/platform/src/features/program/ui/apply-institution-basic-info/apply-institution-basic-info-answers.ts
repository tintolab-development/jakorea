import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'

export type PortalEducationFormat = 'online' | 'offline' | 'hybrid'

const EDUCATION_FORMAT_VALUES = new Set<PortalEducationFormat>([
  'online',
  'offline',
  'hybrid',
])

export type ApplyInstitutionBasicInfoValues = {
  schoolName: string
  /** 기관 소재지 표시 (프로필 자동) */
  regionLabel: string
  applicationGrade: string
  addressDetail: string
  classCount: string
  studentCount: string
  educationFormat: PortalEducationFormat | ''
  educationPlace: string
  educationPlaceDetail: string
  teacherName: string
  teacherTel: string
  teacherMobile: string
  teacherEmail: string
  applicationReason: string
  otherRequests: string
}

export function normalizePortalEducationFormat(raw: unknown): PortalEducationFormat | '' {
  if (typeof raw !== 'string') return ''
  const value = raw.trim().toLowerCase()
  return EDUCATION_FORMAT_VALUES.has(value as PortalEducationFormat)
    ? (value as PortalEducationFormat)
    : ''
}

export function emptyInstitutionBasicInfo(): ApplyInstitutionBasicInfoValues {
  return {
    schoolName: '',
    regionLabel: '',
    applicationGrade: '',
    addressDetail: '',
    classCount: '',
    studentCount: '',
    educationFormat: '',
    educationPlace: 'inside',
    educationPlaceDetail: '',
    teacherName: '',
    teacherTel: '',
    teacherMobile: '',
    teacherEmail: '',
    applicationReason: '',
    otherRequests: '',
  }
}

export type BasicInfoAnswerFromValuesOptions = {
  /** 서버 런타임에서 선택 가능할 때만 희망 교육 형태·장소를 보낸다. */
  includePreferredEducationFields?: boolean
  /**
   * 교육 장소 행을 노출하는 유형(교육받은 교사·1사1교 기관 신청)이면 true —
   * 희망 교육 형태 노출 여부와 무관하게 화면의 교육 장소·상세 장소를 보낸다.
   */
  includeEducationPlaceFields?: boolean
  /** UI가 숨겨져도 서버 draft에 이미 있던 educationFormat은 보존한다. */
  existingAnswer?: unknown
}

export function basicInfoAnswerFromValues(
  values: ApplyInstitutionBasicInfoValues,
  options?: BasicInfoAnswerFromValuesOptions,
): Record<string, unknown> | null {
  const schoolName = values.schoolName.trim()
  if (!schoolName) return null
  const classCount = Number.parseInt(values.classCount, 10)
  const studentCount = Number.parseInt(values.studentCount, 10)
  const applicationGrade = values.applicationGrade.trim()
  const addressDetail = values.addressDetail.trim()
  const regionLabel = values.regionLabel.trim()
  const includePreferredEducation = options?.includePreferredEducationFields === true
  const includeEducationPlace =
    includePreferredEducation || options?.includeEducationPlaceFields === true
  const existingAnswer =
    options?.existingAnswer && typeof options.existingAnswer === 'object'
      ? (options.existingAnswer as Record<string, unknown>)
      : null
  const educationFormat = normalizePortalEducationFormat(values.educationFormat)
  const preservedEducationFormat = normalizePortalEducationFormat(
    existingAnswer?.educationFormat,
  )
  const educationPlace = values.educationPlace.trim()
  const preservedEducationPlace =
    typeof existingAnswer?.educationPlace === 'string'
      ? existingAnswer.educationPlace.trim()
      : ''
  const educationPlaceDetail = values.educationPlaceDetail.trim()
  const preservedEducationPlaceDetail =
    typeof existingAnswer?.educationPlaceDetail === 'string'
      ? existingAnswer.educationPlaceDetail.trim()
      : ''

  return {
    schoolName,
    ...(regionLabel ? { regionLabel, organizationRegion: regionLabel } : {}),
    ...(applicationGrade ? { applicationGrade, educationGrade: applicationGrade } : {}),
    ...(addressDetail ? { addressDetail, detailAddress: addressDetail } : {}),
    ...(Number.isFinite(classCount) && classCount > 0 ? { classCount } : {}),
    ...(Number.isFinite(studentCount) && studentCount > 0
      ? { studentCount, totalStudents: studentCount }
      : {}),
    ...((includePreferredEducation && educationFormat) ||
    (!includePreferredEducation && preservedEducationFormat)
      ? {
          educationFormat: includePreferredEducation
            ? educationFormat
            : preservedEducationFormat,
        }
      : {}),
    ...((includeEducationPlace && educationPlace) ||
    (!includeEducationPlace && preservedEducationPlace)
      ? {
          educationPlace: includeEducationPlace ? educationPlace : preservedEducationPlace,
        }
      : {}),
    ...((includeEducationPlace && educationPlaceDetail) ||
    (!includeEducationPlace && preservedEducationPlaceDetail)
      ? {
          educationPlaceDetail: includeEducationPlace
            ? educationPlaceDetail
            : preservedEducationPlaceDetail,
        }
      : {}),
    ...(values.teacherName.trim() ? { teacherName: values.teacherName.trim() } : {}),
    ...(values.teacherTel.trim()
      ? { teacherTel: formatKoreanPhoneNumber(values.teacherTel.trim()) }
      : {}),
    ...(values.teacherMobile.trim()
      ? { teacherMobile: formatKoreanPhoneNumber(values.teacherMobile.trim()) }
      : {}),
    ...(values.teacherEmail.trim() ? { teacherEmail: values.teacherEmail.trim() } : {}),
    ...(values.applicationReason.trim()
      ? { applicationReason: values.applicationReason.trim() }
      : {}),
    ...(values.otherRequests.trim() ? { otherRequests: values.otherRequests.trim() } : {}),
  }
}

function readStringField(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const raw = row[key]
    if (typeof raw === 'string' && raw.trim()) return raw.trim()
    if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  }
  return ''
}

export function basicInfoValuesFromDraftAnswer(
  answer: unknown,
): ApplyInstitutionBasicInfoValues | null {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return null
  const row = answer as Record<string, unknown>
  const schoolName = readStringField(row, 'schoolName')
  const applicationGrade = readStringField(row, 'applicationGrade', 'educationGrade')
  const regionLabel = readStringField(row, 'regionLabel', 'organizationRegion')
  const addressDetail = readStringField(row, 'addressDetail', 'detailAddress')
  const classCount = readStringField(row, 'classCount')
  const studentCount = readStringField(row, 'studentCount', 'totalStudents')
  const educationFormat = normalizePortalEducationFormat(row.educationFormat)
  const educationPlace = readStringField(row, 'educationPlace') || 'inside'
  const educationPlaceDetail = readStringField(row, 'educationPlaceDetail')
  const teacherName = readStringField(row, 'teacherName')
  const teacherTel = formatKoreanPhoneNumber(readStringField(row, 'teacherTel'))
  const teacherMobile = formatKoreanPhoneNumber(readStringField(row, 'teacherMobile'))
  const teacherEmail = readStringField(row, 'teacherEmail')
  const applicationReason = readStringField(row, 'applicationReason')
  const otherRequests = readStringField(row, 'otherRequests')

  if (
    !schoolName &&
    !applicationGrade &&
    !addressDetail &&
    !classCount &&
    !studentCount &&
    !applicationReason &&
    !otherRequests
  ) {
    return null
  }

  return {
    ...emptyInstitutionBasicInfo(),
    schoolName,
    regionLabel,
    applicationGrade,
    addressDetail,
    classCount,
    studentCount,
    educationFormat,
    educationPlace,
    educationPlaceDetail,
    teacherName,
    teacherTel,
    teacherMobile,
    teacherEmail,
    applicationReason,
    otherRequests,
  }
}
