import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { User } from '@/types/user'
import { composeUserDetailAddressLine } from '@/features/user/detail/ui/user-basic-info/display'
import { formatDate } from '@/shared/utils'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { toDisplayGender } from '@/features/user/api/map-member-gender-birth'
import {
  formatInstructorEducationLevelDisplay,
  isInstructorMaskedPlaceholder,
} from '@/features/user/api/map-instructor-activity-display'
import { instructorCmsProfileToApplicantInstructorRowPartial } from '@/features/user/api/map-instructor-cms-profile'
import dayjs from 'dayjs'

const REMOTE_RESUME_PLACEHOLDER_EDUCATION = '-'
const REMOTE_RESUME_PLACEHOLDER_SCHOOL = '-'

function mapApprovalStatus(status: string | undefined): ApplicantInstructorRow['approvalStatus'] {
  const upper = status?.trim().toUpperCase()
  if (upper === 'APPROVED' || upper === 'ACTIVE') return 'approved'
  if (upper === 'PENDING' || upper === 'REQUESTED') return 'pending'
  if (upper === 'REJECTED' || upper === 'REVOKED') return 'rejected'
  return 'approved'
}

function mapCertificationsToQualifications(
  certifications: User['instructorCertifications']
): NonNullable<ApplicantInstructorRow['qualifications']> {
  if (!certifications?.length) return []
  return certifications.map(cert => {
    const year = cert.issuedDate
      ? dayjs(cert.issuedDate).isValid()
        ? dayjs(cert.issuedDate).format('YYYY')
        : cert.issuedDate.slice(0, 4)
      : undefined
    return {
      name: cert.name,
      ...(year ? { year } : {}),
    }
  })
}

const HIGHEST_EDUCATION_PIPE_SEP = ' | ' as const

function splitHighestEducationLabel(label: string | undefined): {
  levelPart: string | undefined
  schoolName: string | undefined
} {
  const trimmed = label?.trim()
  if (!trimmed) return { levelPart: undefined, schoolName: undefined }
  const idx = trimmed.indexOf(HIGHEST_EDUCATION_PIPE_SEP)
  if (idx === -1) return { levelPart: trimmed, schoolName: undefined }
  return {
    levelPart: trimmed.slice(0, idx).trim() || undefined,
    schoolName: trimmed.slice(idx + HIGHEST_EDUCATION_PIPE_SEP.length).trim() || undefined,
  }
}

/** `educationLevel` 요약("college4 / graduated" 등) → 이력서 최종 학력 1행 */
function mapEducationLevelToEducationItems(
  educationLevel: string | undefined,
  schoolName?: string
): NonNullable<ApplicantInstructorRow['educations']> {
  const raw = educationLevel?.trim()
  if (!raw || raw === '-') return []
  if (isInstructorMaskedPlaceholder(raw)) {
    return [{ schoolType: raw }]
  }

  const display = formatInstructorEducationLevelDisplay(raw) ?? raw
  const [schoolType] = display.split(/\s*\/\s*/).map(part => part.trim())
  const resolvedSchoolName = schoolName?.trim()
  return [
    {
      ...(schoolType ? { schoolType } : !schoolType ? { schoolType: display } : {}),
      ...(resolvedSchoolName && !isInstructorMaskedPlaceholder(resolvedSchoolName)
        ? { schoolName: resolvedSchoolName }
        : {}),
    },
  ]
}

function parseCareerYearsFromLabel(label: string | undefined): number {
  const trimmed = label?.trim()
  if (!trimmed || isInstructorMaskedPlaceholder(trimmed)) return 0
  const yearMatch = trimmed.match(/^(\d+)년$/)
  if (yearMatch) return Number(yearMatch[1])
  if (/^\d+$/.test(trimmed)) return Number(trimmed)
  return 0
}

export function userToApplicantInstructorRow(user: Omit<User, 'password'>): ApplicantInstructorRow {
  const grade = user.listMetrics?.jaEvaluationGrade?.trim()
  const careerLabel =
    user.listMetrics?.instructorCareerYearsLabel?.trim() || user.instructorCareerText?.trim()
  const careerYears = parseCareerYearsFromLabel(careerLabel)
  const years = careerYears > 0 ? careerYears : (user.participationHistory ?? 0)
  const membersRemote = isMembersRemoteEnabled()
  const affiliation = user.affiliation?.trim() || (membersRemote ? '-' : 'JA 강사')
  const rawEducationLevel = user.listMetrics?.highestEducationLabel?.trim()
  const { levelPart: rawEducationLevelPart, schoolName: schoolFromLabel } =
    splitHighestEducationLabel(rawEducationLevel)
  const educationLevel =
    (rawEducationLevelPart
      ? formatInstructorEducationLevelDisplay(rawEducationLevelPart)
      : undefined) || (membersRemote ? REMOTE_RESUME_PLACEHOLDER_EDUCATION : '4년제 졸업')
  const educationSchoolName =
    schoolFromLabel && !isInstructorMaskedPlaceholder(schoolFromLabel)
      ? schoolFromLabel
      : membersRemote
        ? REMOTE_RESUME_PLACEHOLDER_SCHOOL
        : '-*대학교'
  /** API `profile.essays.freeWrite1` 또는 legacy `selfIntroduction` */
  const freeWriting1FromApi = user.instructorSelfIntroduction?.trim() ?? ''
  const qualifications = mapCertificationsToQualifications(user.instructorCertifications)
  const educationsFromSummary = mapEducationLevelToEducationItems(
    rawEducationLevelPart ?? rawEducationLevel,
    schoolFromLabel
  )
  const teachingExperience =
    careerLabel && !isInstructorMaskedPlaceholder(careerLabel)
      ? careerLabel
      : years > 0
        ? `${years}년`
        : membersRemote
          ? '-'
          : '3년'

  const cmsPartial = user.instructorCmsProfile
    ? instructorCmsProfileToApplicantInstructorRowPartial(user.instructorCmsProfile)
    : null

  const baseRow = {
    id: user.id,
    no: 1,
    instructorName: user.name,
    lectureExperienceYears: years,
    educationLevel,
    educationSchoolName,
    contact: user.phone ?? '',
    email: user.email ?? '',
    address: composeUserDetailAddressLine(user) || user.schoolInfo?.address || '',
    affiliation,
    approvalStatus: mapApprovalStatus(user.instructorApprovalStatus),
    schoolName: user.schoolInfo?.schoolName ?? user.affiliatedSchoolName ?? '-',
    nameEnglish: user.nameEn ?? (membersRemote ? '-' : 'Park Tinto'),
    birthDate: user.birthDate ? formatDate(user.birthDate) : membersRemote ? '-' : '1990.09.15',
    gender: (() => {
      const display = toDisplayGender(user.gender)
      if (display !== '-') return display
      return membersRemote ? '-' : '남성'
    })(),
    bankName: user.instructorInfo?.bankName ?? '',
    accountNumber: user.instructorInfo?.accountNumber ?? '',
    accountHolder: user.instructorInfo?.accountHolder ?? '',
    evaluationGrade: grade || (membersRemote ? '-' : 'A'),
    teachingExperience,
    oneLineIntro: user.bio?.trim() ? user.bio : '-',
    businessIncomeEarnerStatus:
      user.instructorInfo?.isBusinessIncome === true
        ? '해당'
        : user.instructorInfo?.isBusinessIncome === false
          ? '해당 없음'
          : '해당 없음',
    lectureFeeBasisDisplay:
      user.listMetrics?.instructorFeeGradeLabel?.trim() || (membersRemote ? '-' : '특강 강사비 | 915,000원'),
    settlementStatusLabel: user.listMetrics?.settlementStatusLabel?.trim() || undefined,
    freeWriting1: freeWriting1FromApi,
    freeWriting2: '',
    freeWriting3: '',
    freeWriting4: '',
    careerDetails: [],
    jaKoreaActivities: [],
    educations: educationsFromSummary,
    qualifications,
    awards: membersRemote
      ? []
      : [
          { year: '2024', name: 'OO교육원 웹마스터 915기 교육 수료' },
          { year: '2020', name: '서울특별시 대통령배 OO부문 금상' },
        ],
  }

  if (!cmsPartial) {
    return baseRow
  }

  return {
    ...baseRow,
    ...cmsPartial,
    educationLevel: cmsPartial.educationLevel || baseRow.educationLevel,
    educationSchoolName:
      cmsPartial.educationSchoolName !== '-'
        ? cmsPartial.educationSchoolName
        : baseRow.educationSchoolName,
    teachingExperience: cmsPartial.teachingExperience || baseRow.teachingExperience,
    oneLineIntro: cmsPartial.oneLineIntro !== '-' ? cmsPartial.oneLineIntro : baseRow.oneLineIntro,
    freeWriting1: cmsPartial.freeWriting1 || baseRow.freeWriting1,
    qualifications:
      (cmsPartial.qualifications?.length ?? 0) > 0
        ? cmsPartial.qualifications
        : baseRow.qualifications,
    awards: (cmsPartial.awards?.length ?? 0) > 0 ? cmsPartial.awards : baseRow.awards,
    careerDetails:
      (cmsPartial.careerDetails?.length ?? 0) > 0
        ? cmsPartial.careerDetails
        : baseRow.careerDetails,
    jaKoreaActivities:
      (cmsPartial.jaKoreaActivities?.length ?? 0) > 0
        ? cmsPartial.jaKoreaActivities
        : baseRow.jaKoreaActivities,
    educations:
      (cmsPartial.educations?.length ?? 0) > 0 ? cmsPartial.educations : baseRow.educations,
  }
}

export function maskedUserForInstructorDetail(user: Omit<User, 'password'>): Omit<User, 'password'> {
  return {
    ...user,
    phone: user.phone ? MASKING_POLICY.phone(user.phone) : user.phone,
    email: user.email ? MASKING_POLICY.email(user.email) : user.email,
    instructorInfo: user.instructorInfo
      ? {
          ...user.instructorInfo,
          accountNumber: MASKING_POLICY.accountNumber(user.instructorInfo.accountNumber),
          accountHolder: MASKING_POLICY.accountHolderName(user.instructorInfo.accountHolder),
        }
      : user.instructorInfo,
  }
}
