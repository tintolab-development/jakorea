import type { TrainedTeachersPreferredScheduleBlock } from '@/features/program/trained-teachers/model/institution-detail'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  INSTITUTION_APPLICATION_SCHEDULE_COLGROUP,
  InstitutionApplicationTableRowSingleCol,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-info-table'
import { ProgramDetailTdSegmentWrap } from '@/features/program/shared/ui/program-detail-td-divider'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import '@/features/program/general/ui/detail-modal/applications/volunteer-screening/detail.css'

function preferredDateSegments(block: TrainedTeachersPreferredScheduleBlock): string[] {
  const datePart = block.date.replace(/\./g, '. ').replace(/\s+/g, ' ').trim()
  const weekday = block.dayOfWeek.trim()
  const dateLabel = weekday ? `${datePart} (${weekday})` : datePart
  const sessionCount =
    typeof block.sessionCount === 'number' && block.sessionCount > 0
      ? `${block.sessionCount}차시`
      : ''
  return [dateLabel, sessionCount].filter(Boolean)
}

function preferredSessionTimeSegments(classPeriod: string, timeRange: string): string[] {
  return [classPeriod, timeRange].map(s => s.trim()).filter(Boolean)
}

export function TrainedTeachersPreferredScheduleDetailSection({
  blocks,
  sectionTitle = '진행 희망 교육 일정',
  emptyMessage = '등록된 교육 일정이 없습니다.',
  emptyClassName = 'general-volunteer-applicant-detail__empty-schedule',
}: {
  blocks: TrainedTeachersPreferredScheduleBlock[]
  sectionTitle?: string
  emptyMessage?: string
  emptyClassName?: string
}) {
  return (
    <section className="applicant-institution-basic-info__section">
      <h3 className="applicant-institution-basic-info__title">{sectionTitle}</h3>
      {blocks.length === 0 ? (
        <DetailInfoForm title={sectionTitle} hideHeader mode="view">
          <DetailInfoForm.Row type="custom">
            <p className={`detail-info-form__field-content ${emptyClassName}`}>{emptyMessage}</p>
          </DetailInfoForm.Row>
        </DetailInfoForm>
      ) : (
        <div className="applicant-institution-basic-info__schedule-preference-list">
          {blocks.map(block => {
            const blockKey = [
              block.preferenceRank,
              block.date,
              block.scheduleId ?? 'none',
            ].join('-')
            const dateRow = (
              <InstitutionApplicationTableRowSingleCol
                key={`${blockKey}-date`}
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
                key={`${blockKey}-time-${session.sessionIndex}`}
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
                key={`preference-${blockKey}`}
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
