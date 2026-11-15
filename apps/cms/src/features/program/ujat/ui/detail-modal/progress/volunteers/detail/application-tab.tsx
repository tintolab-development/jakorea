import type { Program } from '@/types/domain'
import type { UjatVolunteerPreferredRegion } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { ApplicantAdminCommentSection } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-admin-comment-section'
import { EssaySections } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/applicant/essay-sections'
import { PreviousTermSection } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/applicant/previous-term-section'
import type { UjatEducationProgressVolunteerDetail } from './volunteer-detail-data'
import { UjatEducationProgressVolunteerDetailBasicInfo } from './detail-basic-info'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './detail.css'

export function UjatEducationProgressVolunteerApplicationTab({
  program,
  detail,
  adminComment,
  maskSensitive,
  isEditing = false,
  preferredRegionDraft,
  onPreferredRegionDraftChange,
  isAdminCommentEditing = false,
  adminCommentDraft = '',
  onAdminCommentDraftChange,
}: {
  program: Program
  detail: UjatEducationProgressVolunteerDetail
  adminComment: string
  maskSensitive: boolean
  isEditing?: boolean
  preferredRegionDraft?: UjatVolunteerPreferredRegion
  onPreferredRegionDraftChange?: (next: UjatVolunteerPreferredRegion) => void
  isAdminCommentEditing?: boolean
  adminCommentDraft?: string
  onAdminCommentDraftChange?: (next: string) => void
}) {
  return (
    <div className="ujat-education-progress-volunteer-detail__application">
      <ApplicantAdminCommentSection
        adminComment={adminComment}
        mode={isAdminCommentEditing ? 'edit' : 'view'}
        draftValue={adminCommentDraft}
        onDraftChange={isAdminCommentEditing ? onAdminCommentDraftChange : undefined}
      />

      <UjatEducationProgressVolunteerDetailBasicInfo
        program={program}
        applicant={detail.applicant}
        maskSensitive={maskSensitive}
        isEditing={isEditing}
        preferredRegionDraft={preferredRegionDraft}
        onPreferredRegionDraftChange={onPreferredRegionDraftChange}
      />

      {/* Figma 4082:109120 — 기본 정보 아래 「이전 UJAT 활동 기수」(수료자 항상, 신규는 서버 값 있을 때만) */}
      <PreviousTermSection applicant={detail.applicant} />

      <EssaySections applicant={detail.applicant} />
    </div>
  )
}
