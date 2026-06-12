import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { NoticeAttachmentDownloadIcon } from '@/features/posts/ui/notice-attachment-download-icon'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { downloadFile } from '@/shared/lib/file-download'
import './ujat-volunteer-applicant-previous-ujat-section.css'

export interface UjatVolunteerApplicantPreviousUjatSectionProps {
  applicant: UjatVolunteerApplicantRow
}

export function UjatVolunteerApplicantPreviousUjatSection({
  applicant,
}: UjatVolunteerApplicantPreviousUjatSectionProps) {
  const activity = applicant.previousUjatActivity
  if (!activity) return null

  const termYearDisplay = withProgramDetailTdDivider([
    `${activity.term}기`,
    `${activity.year}년도`,
  ])

  return (
    <section className="ujat-volunteer-applicant-previous-ujat">
      <DetailInfoForm title="이전 UJAT 활동 기수" mode="view">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="이전 활동 기수 및 년도"
            fullRow
            readOnlyDisplay
            view={<ProgramDetailTdSegmentWrap>{termYearDisplay}</ProgramDetailTdSegmentWrap>}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="수료증 첨부"
            fullRow
            readOnlyDisplay
            view={
              <button
                type="button"
                className="ujat-volunteer-applicant-previous-ujat__file"
                onClick={() =>
                  downloadFile(activity.certificateFileName, activity.certificateFileUrl)
                }
              >
                <NoticeAttachmentDownloadIcon className="ujat-volunteer-applicant-previous-ujat__file-icon" />
                <span className="ujat-volunteer-applicant-previous-ujat__file-name">
                  {activity.certificateFileName}
                </span>
              </button>
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </section>
  )
}
