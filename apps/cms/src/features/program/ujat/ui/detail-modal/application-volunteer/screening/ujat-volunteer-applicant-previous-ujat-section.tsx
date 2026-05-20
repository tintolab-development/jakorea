import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { NoticeAttachmentDownloadIcon } from '@/features/posts/ui/notice-attachment-download-icon'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { downloadFile } from '@/shared/lib/file-download'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
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
    <section className="ujat-volunteer-applicant-detail__subsection ujat-volunteer-applicant-previous-ujat">
      <h3 className="ujat-volunteer-applicant-detail__subsection-title">이전 UJAT 활동 기수</h3>
      <div className="program-detail-info-tab__table-wrapper ujat-volunteer-applicant-detail__table-wrapper--vertical">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic ujat-volunteer-applicant-detail__table--vertical">
          <tbody>
            <tr>
              <th scope="row">이전 활동 기수 및 년도</th>
              <td>
                <ProgramDetailTdSegmentWrap>{termYearDisplay}</ProgramDetailTdSegmentWrap>
              </td>
            </tr>
            <tr>
              <th scope="row">수료증 첨부</th>
              <td>
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
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
