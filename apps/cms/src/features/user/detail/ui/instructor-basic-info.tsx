/**
 * @deprecated 회원 상세는 `UserDetailFullPageModal`에서 통합 레이아웃을 사용한다.
 */
import { useMemo } from 'react'
import type { User } from '@/types/user'
import { UserBasicInfoSection } from './user-basic-info-section'
import { UserConsentAgreementSection, resolveUserConsentAgreementPreset } from './user-consent-agreement-section'
import { InstructorResumeDetailForms } from './instructor-resume-detail-forms'
import {
  maskedUserForInstructorDetail,
  userToApplicantInstructorRow,
} from '@/features/user/shared/lib/user-to-applicant-instructor-row'
import './instructor-basic-info.css'

interface InstructorBasicInfoProps {
  user: Omit<User, 'password'>
  personalInfoRevealed?: boolean
}

export function InstructorBasicInfo({
  user,
  personalInfoRevealed = false,
}: InstructorBasicInfoProps) {
  const sourceUser = personalInfoRevealed ? user : maskedUserForInstructorDetail(user)
  const row = useMemo(() => userToApplicantInstructorRow(sourceUser), [sourceUser])
  const preset = resolveUserConsentAgreementPreset(sourceUser)

  return (
    <div className="instructor-basic-info">
      <UserBasicInfoSection user={sourceUser} personalInfoRevealed={personalInfoRevealed} />
      <UserConsentAgreementSection preset={preset} />
      <InstructorResumeDetailForms instructor={row} />
    </div>
  )
}
