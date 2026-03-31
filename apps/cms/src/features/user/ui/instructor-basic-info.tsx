import { useMemo } from 'react'
import dayjs from 'dayjs'
import type { User } from '@/types/user'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import { formatDate } from '@/shared/utils'
import { AppButton } from '@/shared/ui/app-button'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { ApplicantInstructorBasicInfo } from '@/features/program/ui/detail-modal/applicants/applicant-instructor-basic-info'
import { ApplicantInstructorResume } from '@/features/program/ui/detail-modal/applicants/applicant-instructor-resume'
import './instructor-basic-info.css'

interface InstructorBasicInfoProps {
  user: Omit<User, 'password'>
  personalInfoRevealed?: boolean
}

function toInstructorRow(user: Omit<User, 'password'>): ApplicantInstructorRow {
  const grade = user.listMetrics?.jaEvaluationGrade?.trim()
  const years = user.participationHistory ?? 0
  const affiliation = user.affiliation?.trim() || 'JA 강사'
  return {
    id: user.id,
    no: 1,
    instructorName: user.name,
    lectureExperienceYears: years,
    educationLevel: '4년제 졸업',
    educationSchoolName: '-*대학교',
    contact: user.phone ?? '',
    email: user.email ?? '',
    address: user.detailAddress ?? user.schoolInfo?.address ?? '',
    affiliation,
    approvalStatus: 'approved',
    schoolName: user.schoolInfo?.schoolName ?? '-',
    nameEnglish: user.nameEn ?? 'Park Tinto',
    birthDate: user.birthDate ? formatDate(user.birthDate) : '1990.09.15',
    gender: user.gender ?? '남성',
    bankName: user.instructorInfo?.bankName ?? '',
    accountNumber: user.instructorInfo?.accountNumber ?? '',
    accountHolder: user.instructorInfo?.accountHolder ?? '',
    evaluationGrade: grade || 'A',
    teachingExperience: years > 0 ? `${years}년` : '3년',
    oneLineIntro: user.bio ?? '-',
    businessIncomeEarnerStatus:
      user.instructorInfo?.isBusinessIncome === true
        ? '해당'
        : user.instructorInfo?.isBusinessIncome === false
          ? '해당 없음'
          : '해당 없음',
    lectureFeeBasisDisplay: '특강 강사비 | 915,000원',
    settlementStatusLabel: user.listMetrics?.settlementStatusLabel?.trim() || undefined,
    freeWriting1: '-',
    freeWriting2: '-',
    freeWriting3: '-',
    freeWriting4: '-',
    careerDetails: [],
    educations: [],
    qualifications: [],
    awards: [],
  }
}

function maskedUser(user: Omit<User, 'password'>): Omit<User, 'password'> {
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

function memberJoinDateDisplay(createdAt: User['createdAt']): string {
  const d = dayjs(createdAt)
  return d.isValid() ? d.format('YYYY. MM. DD') : '-'
}

function memberLinkedSocialDisplay(socialAccounts: User['socialAccounts']): string {
  return socialAccounts?.length ? socialAccounts.join(' | ') : '-'
}

export function InstructorBasicInfo({
  user,
  personalInfoRevealed = false,
}: InstructorBasicInfoProps) {
  const sourceUser = personalInfoRevealed ? user : maskedUser(user)
  const row = useMemo(() => toInstructorRow(sourceUser), [sourceUser])
  const memberFooter = useMemo(
    () => ({
      joinDate: memberJoinDateDisplay(sourceUser.createdAt),
      linkedSocial: memberLinkedSocialDisplay(sourceUser.socialAccounts),
    }),
    [sourceUser.createdAt, sourceUser.socialAccounts]
  )
  const consentDate = '2026.01.15 09:15:42'

  return (
    <div className="instructor-basic-info">
      <ApplicantInstructorBasicInfo
        instructor={row}
        maskSensitive={false}
        showApprovalStatus={false}
        showOneLineIntro={false}
        showPostApprovalFields
        memberBasicInfoFooter={memberFooter}
        privacyMaskAddress={!personalInfoRevealed}
      />

      <section className="user-consent-agreement-section">
        <div className="user-detail-section__head">
          <div className="user-detail-section__title">정보 제공 동의</div>
          <p className="user-detail-section__caption">
            *미동의 시 프로그램 신청 및 활동에 제한이 있을 수 있습니다.
          </p>
        </div>
        <div className="user-detail-modal__basic-inner">
          <div className="user-detail-modal__basic-table-wrap">
            <table className="user-detail-modal__basic-table">
              <colgroup>
                <col style={{ width: '240px' }} />
                <col />
                <col style={{ width: '240px' }} />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label">
                    개인정보 수집 동의
                  </td>
                  <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
                    <span className="instructor-basic-info__consent-value-wrap">
                      <span>동의</span>
                      <span className="instructor-basic-info__consent-separator">|</span>
                      <span className="instructor-basic-info__consent-date">{consentDate}</span>
                    </span>
                  </td>
                  <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label">
                    마케팅 제공 동의
                  </td>
                  <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
                    <span className="instructor-basic-info__consent-value-wrap">
                      <span>동의</span>
                      <span className="instructor-basic-info__consent-separator">|</span>
                      <span className="instructor-basic-info__consent-date">{consentDate}</span>
                    </span>
                  </td>
                </tr>
                {[
                  '지급처 작성 동의',
                  '성범죄 경력조회 동의',
                  '행정정보 공동이용 사전 동의',
                  '교육진행자 동의 서약',
                ].map(label => (
                  <tr key={label}>
                    <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label">
                      {label}
                    </td>
                    <td
                      colSpan={3}
                      className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input"
                    >
                      <span className="instructor-basic-info__consent-value-wrap">
                        <span>동의</span>
                        <span className="instructor-basic-info__consent-separator">|</span>
                        <span className="instructor-basic-info__consent-date">{consentDate}</span>
                        <span className="instructor-basic-info__consent-separator">|</span>
                        <AppButton variant="primary" size="large">
                          동의서 보기
                        </AppButton>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <ApplicantInstructorResume instructor={row} />
    </div>
  )
}
