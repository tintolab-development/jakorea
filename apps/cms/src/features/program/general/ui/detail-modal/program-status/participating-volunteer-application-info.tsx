/**
 * 참여 봉사자 상세 — 신청 정보 탭 (관리자 코멘트 + 기본 정보 + 자유 작성 항목)
 */

import { ApplicantAdminCommentSection } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-admin-comment-section'
import { GeneralVolunteerApplicantBasicInfo } from '@/features/program/general/ui/detail-modal/applications/volunteer-screening/basic-info'
import {
  mergeParticipatingVolunteerDetailRow,
  participatingVolunteerToApplicantView,
  type ParticipatingVolunteerDetailRow,
} from '@/features/program/general/lib/participating-volunteer-detail'
import type { ParticipatingVolunteerRow } from '@/data/mock/participating-volunteers'
import { ParticipatingVolunteerEssaySections } from './participating-volunteer-essay-sections'
import '@/features/program/general/ui/detail-modal/applications/volunteer-screening/detail.css'

export interface ParticipatingVolunteerApplicationInfoProps {
  volunteer: ParticipatingVolunteerRow
  privacyMasked?: boolean
  adminComment?: string
  isAdminCommentEditing?: boolean
  adminCommentDraft?: string
  onAdminCommentDraftChange?: (value: string) => void
  adminCommentError?: string
}

export function ParticipatingVolunteerApplicationInfo({
  volunteer,
  privacyMasked = true,
  adminComment,
  isAdminCommentEditing = false,
  adminCommentDraft = '',
  onAdminCommentDraftChange,
  adminCommentError,
}: ParticipatingVolunteerApplicationInfoProps) {
  const detailRow: ParticipatingVolunteerDetailRow = mergeParticipatingVolunteerDetailRow(volunteer)
  const applicantView = participatingVolunteerToApplicantView(detailRow, {
    maskSensitive: privacyMasked,
  })

  return (
    <div className="participating-volunteer-application-info general-volunteer-applicant-detail__body applicant-info-section">
      <ApplicantAdminCommentSection
        adminComment={adminComment}
        mode={isAdminCommentEditing ? 'edit' : 'view'}
        draftValue={adminCommentDraft}
        onDraftChange={onAdminCommentDraftChange}
        validationError={adminCommentError}
      />
      <GeneralVolunteerApplicantBasicInfo
        applicant={applicantView}
        maskSensitive={privacyMasked}
        statusRow="none"
      />
      <ParticipatingVolunteerEssaySections volunteer={detailRow} />
    </div>
  )
}
