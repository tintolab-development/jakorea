import type { UjatVolunteerPreferredRegion } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { ApplicantAdminCommentSection } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-admin-comment-section'
import { EssaySections } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/applicant/essay-sections'
import type { UjatEducationProgressVolunteerDetail } from './detail-mock'
import { UjatEducationProgressVolunteerDetailBasicInfo } from './detail-basic-info'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './detail.css'

export function UjatEducationProgressVolunteerApplicationTab({
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
        applicant={detail.applicant}
        maskSensitive={maskSensitive}
        isEditing={isEditing}
        preferredRegionDraft={preferredRegionDraft}
        onPreferredRegionDraftChange={onPreferredRegionDraftChange}
      />

      <EssaySections applicant={detail.applicant} />
    </div>
  )
}
