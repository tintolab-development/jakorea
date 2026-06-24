import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { NoticeAttachmentDownloadIcon } from '@/features/posts/ui/notice-attachment-download-icon'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { downloadFile } from '@/shared/lib/file-download'
import './previous-term-section.css'

export interface PreviousTermSectionProps {
  applicant: UjatVolunteerApplicantRow
}

export function PreviousTermSection({
  applicant,
}: PreviousTermSectionProps) {
  const activity = applicant.previousUjatActivity
  if (!applicant.hasEducationExperience) return null

  const termYearDisplay = activity
    ? withProgramDetailTdDivider([`${activity.term}기`, `${activity.year}년도`])
    : '-'

  return (
    <section className="previous-term-section">
      <DetailInfoForm title="이전 UJAT 활동 기수" mode="view">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="이전 활동 기수 및 년도"
            readOnlyDisplay
            view={<ProgramDetailTdSegmentWrap>{termYearDisplay}</ProgramDetailTdSegmentWrap>}
          />
          <DetailInfoForm.Field
            label="수료증 첨부"
            readOnlyDisplay
            view={
              activity ? (
                <button
                  type="button"
                  className="previous-term-section__file"
                  onClick={() =>
                    downloadFile(activity.certificateFileName, activity.certificateFileUrl)
                  }
                >
                  <NoticeAttachmentDownloadIcon className="previous-term-section__file-icon" />
                  <span className="previous-term-section__file-name">
                    {activity.certificateFileName}
                  </span>
                </button>
              ) : (
                '-'
              )
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </section>
  )
}
