import type { UjatVolunteerPreferredRegion } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { UjatVolunteerApplicantEssaySections } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/ujat-volunteer-applicant-essay-sections'
import type { UjatEducationProgressVolunteerDetail } from './ujat-education-progress-volunteer-detail-mock'
import { UjatEducationProgressVolunteerDetailBasicInfo } from './ujat-education-progress-volunteer-detail-basic-info'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './ujat-education-progress-volunteer-detail.css'

export function UjatEducationProgressVolunteerApplicationTab({
  detail,
  maskSensitive,
  isEditing = false,
  preferredRegionDraft,
  onPreferredRegionDraftChange,
}: {
  detail: UjatEducationProgressVolunteerDetail
  maskSensitive: boolean
  isEditing?: boolean
  preferredRegionDraft?: UjatVolunteerPreferredRegion
  onPreferredRegionDraftChange?: (next: UjatVolunteerPreferredRegion) => void
}) {
  const adminCommentTrimmed = detail.adminComment.trim()

  return (
    <div className="ujat-education-progress-volunteer-detail__application">
      <div className="program-detail-fullpage-modal__info-tab-block">
        <h3 className="program-detail-info-tab__section-title">관리자 코멘트</h3>
        <div
          className={`ujat-education-progress-volunteer-detail__admin-comment-box ${
            !adminCommentTrimmed
              ? 'ujat-education-progress-volunteer-detail__admin-comment-box--empty'
              : ''
          }`}
          role="region"
          aria-label="관리자 코멘트"
        >
          {adminCommentTrimmed ? detail.adminComment : '작성된 코멘트가 없습니다.'}
        </div>
      </div>

      <UjatEducationProgressVolunteerDetailBasicInfo
        applicant={detail.applicant}
        maskSensitive={maskSensitive}
        isEditing={isEditing}
        preferredRegionDraft={preferredRegionDraft}
        onPreferredRegionDraftChange={onPreferredRegionDraftChange}
      />

      <UjatVolunteerApplicantEssaySections applicant={detail.applicant} />
    </div>
  )
}
