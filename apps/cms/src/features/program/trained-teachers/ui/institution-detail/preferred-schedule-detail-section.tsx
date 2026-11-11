import type { TrainedTeachersPreferredScheduleBlock } from '@/features/program/trained-teachers/model/institution-detail'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  INSTITUTION_APPLICATION_SCHEDULE_COLGROUP,
  InstitutionApplicationTableRowSingleCol,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-info-table'
import { Fragment } from 'react'
import { ProgramDetailTdSegmentWrap } from '@/features/program/shared/ui/program-detail-td-divider'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import {
  formatTrainedTeacherPreferredDateSegments,
  formatTrainedTeacherSessionTimeSegments,
  TRAINED_TEACHER_SESSION_JOINER,
} from '@/features/program/trained-teachers/lib/preferred-schedule-display'
import '@/features/program/general/ui/detail-modal/applications/volunteer-screening/detail.css'

/**
 * 시안: 「희망 교육일 및 차시」 `2026.04.27(월) ㅣ 2차시`,
 * 「차시별 희망 교육 시간」 `1차시: 1교시 ㅣ 09:00 ~ 09:40 / 2차시: 2교시 ㅣ 09:50 ~ 10:30` (한 줄, CMS-FUNC-0072)
 */
function PreferredSessionTimesValue({ block }: { block: TrainedTeachersPreferredScheduleBlock }) {
  const sessions = formatTrainedTeacherSessionTimeSegments(block.sessionTimes)
  if (sessions.length === 0) return <>-</>
  return (
    <ProgramDetailTdSegmentWrap>
      {sessions.map((segments, index) => (
        <Fragment key={`${block.preferenceRank}-${index}`}>
          {index > 0 ? TRAINED_TEACHER_SESSION_JOINER : null}
          {withProgramDetailTdDivider(segments)}
        </Fragment>
      ))}
    </ProgramDetailTdSegmentWrap>
  )
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
                    {withProgramDetailTdDivider(formatTrainedTeacherPreferredDateSegments(block))}
                  </ProgramDetailTdSegmentWrap>
                }
              />
            )
            const timeRow = (
              <InstitutionApplicationTableRowSingleCol
                key={`${blockKey}-times`}
                label="차시별 희망 교육 시간"
                value={<PreferredSessionTimesValue block={block} />}
              />
            )

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
                      {timeRow}
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
