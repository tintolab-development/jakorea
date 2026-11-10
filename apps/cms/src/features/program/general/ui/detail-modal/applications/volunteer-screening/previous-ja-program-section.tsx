import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import {
  filterGeneralVolunteerPreviousJaProgramAttachments,
  shouldShowGeneralVolunteerPreviousJaProgramSection,
  splitGeneralVolunteerPreviousJaProgram,
} from '@/features/program/general/lib/volunteer-previous-ja-program-display'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { VolunteerEvidenceFileList } from './evidence-files'
import './previous-ja-program-section.css'

export interface GeneralVolunteerPreviousJaProgramSectionProps {
  applicant: GeneralVolunteerApplicantRow
}

/** 봉사자 신청 상세 「이전 참여 JA 봉사 프로그램」 — 시안 9896:147375 / 3491:112371 */
export function GeneralVolunteerPreviousJaProgramSection({
  applicant,
}: GeneralVolunteerPreviousJaProgramSectionProps) {
  if (!shouldShowGeneralVolunteerPreviousJaProgramSection(applicant)) return null

  const programParts = splitGeneralVolunteerPreviousJaProgram(applicant.previousJaProgram)
  const files = filterGeneralVolunteerPreviousJaProgramAttachments(applicant.evidenceAttachments)

  return (
    <section className="general-volunteer-previous-ja-program-section">
      <DetailInfoForm title="이전 참여 JA 봉사 프로그램" mode="view">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="참여 JA 봉사 프로그램"
            readOnlyDisplay
            view={
              programParts.length > 0 ? (
                <ProgramDetailTdSegmentWrap>
                  {withProgramDetailTdDivider(programParts)}
                </ProgramDetailTdSegmentWrap>
              ) : (
                '-'
              )
            }
          />
          <DetailInfoForm.Field
            label="증빙서류 첨부"
            readOnlyDisplay
            view={files.length > 0 ? <VolunteerEvidenceFileList files={files} /> : '-'}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </section>
  )
}
