import type { TrainedTeachersPreferredScheduleBlock } from '@/features/program/trained-teachers/model/institution-detail'
import {
  INSTITUTION_APPLICATION_SCHEDULE_COLGROUP,
  InstitutionApplicationTableRowSingleCol,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-info-table'
import { ProgramDetailTdSegmentWrap } from '@/features/program/shared/ui/program-detail-td-divider'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'

function preferredDateSegments(block: TrainedTeachersPreferredScheduleBlock): string[] {
  const datePart = block.date.replace(/\./g, '. ').replace(/\s+/g, ' ').trim()
  return [`${datePart}(${block.dayOfWeek})`, `${block.sessionCount}차시`]
}

function preferredSessionTimeSegments(classPeriod: string, timeRange: string): string[] {
  return [classPeriod, timeRange].map(s => s.trim()).filter(Boolean)
}

export function TrainedTeachersPreferredScheduleDetailSection({
  blocks,
  sectionTitle = '진행 희망 교육 일정',
}: {
  blocks: TrainedTeachersPreferredScheduleBlock[]
  sectionTitle?: string
}) {
  return (
    <section className="applicant-institution-basic-info__section">
      <h3 className="applicant-institution-basic-info__title">{sectionTitle}</h3>
      {blocks.length === 0 ? (
        <div className="applicant-institution-basic-info__table-wrap">
          <table className="applicant-institution-basic-info__table">
            {INSTITUTION_APPLICATION_SCHEDULE_COLGROUP}
            <tbody>
              <tr>
                <td
                  colSpan={2}
                  className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value"
                >
                  등록된 교육 일정이 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="applicant-institution-basic-info__schedule-preference-list">
          {blocks.map(block => {
            const dateRow = (
              <InstitutionApplicationTableRowSingleCol
                key={`${block.preferenceRank}-date`}
                label="희망 교육일 및 차시"
                value={
                  <ProgramDetailTdSegmentWrap>
                    {withProgramDetailTdDivider(preferredDateSegments(block))}
                  </ProgramDetailTdSegmentWrap>
                }
              />
            )
            const timeRows = block.sessionTimes.map(session => (
              <InstitutionApplicationTableRowSingleCol
                key={`${block.preferenceRank}-time-${session.sessionIndex}`}
                label={`${session.sessionIndex}차시 희망 교육 시간`}
                value={
                  <ProgramDetailTdSegmentWrap>
                    {withProgramDetailTdDivider(
                      preferredSessionTimeSegments(session.classPeriod, session.timeRange)
                    )}
                  </ProgramDetailTdSegmentWrap>
                }
              />
            ))

            return (
              <div
                className="applicant-institution-basic-info__schedule-preference"
                key={`preference-${block.preferenceRank}`}
              >
                <h4 className="applicant-institution-basic-info__schedule-preference-title">
                  <span aria-hidden="true" />
                  {block.preferenceRank}지망
                </h4>
                <div className="applicant-institution-basic-info__table-wrap">
                  <table className="applicant-institution-basic-info__table">
                    {INSTITUTION_APPLICATION_SCHEDULE_COLGROUP}
                    <tbody>
                      {dateRow}
                      {timeRows}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
