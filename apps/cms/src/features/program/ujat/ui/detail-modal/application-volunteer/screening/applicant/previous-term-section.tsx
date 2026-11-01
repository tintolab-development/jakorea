import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { VolunteerEvidenceFileList } from '@/features/program/general/ui/detail-modal/applications/volunteer-screening/evidence-files'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import {
  formatUjatPreviousActivityTermLabel,
  formatUjatPreviousActivityYearLabel,
} from './previous-term-display'
import './previous-term-section.css'

const PREVIOUS_TERM_QUESTION_KEY = 'ujat-program-application-volunteer-seed-previous-term'

export interface PreviousTermSectionProps {
  applicant: UjatVolunteerApplicantRow
}

export function PreviousTermSection({
  applicant,
}: PreviousTermSectionProps) {
  const activity = applicant.previousUjatActivity
  const certificates = (applicant.evidenceAttachments ?? []).filter(
    file => file.questionKey === PREVIOUS_TERM_QUESTION_KEY,
  )
  // 수료자(ujat-graduate)는 시안상 항상 노출. 신규는 잔여 데이터·첨부가 있을 때만.
  if (applicant.applicationType !== 'ujat-graduate' && !activity && certificates.length === 0) {
    return null
  }

  const termLabel = formatUjatPreviousActivityTermLabel(activity?.term)
  const yearLabel = formatUjatPreviousActivityYearLabel(activity?.year)
  const termYearDisplay =
    termLabel || yearLabel
      ? withProgramDetailTdDivider([termLabel, yearLabel].filter(Boolean))
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
            view={certificates.length > 0 ? <VolunteerEvidenceFileList files={certificates} /> : '-'}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </section>
  )
}
