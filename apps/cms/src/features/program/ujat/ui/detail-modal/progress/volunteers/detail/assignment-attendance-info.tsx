import { NoticeAttachmentDownloadIcon } from '@/features/posts/ui/notice-attachment-download-icon'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants'
import { useCmsAlert } from '@/shared/ui'
import {
  hasExcusedAbsenceInAssignmentRows,
  type UjatVolunteerAssignmentAbsenceReason,
  type UjatVolunteerAssignmentAttendanceSummary,
  type UjatVolunteerAssignmentProgressRow,
} from './assignment-types'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'

const ABSENCE_REASON_EMPTY_MESSAGE = '사유 기재 후 불참한 이력이 없습니다.'

export function UjatEducationProgressVolunteerAssignmentAttendanceInfo({
  assignmentRows,
  attendanceSummary,
  absenceReasons,
}: {
  assignmentRows: UjatVolunteerAssignmentProgressRow[]
  attendanceSummary: UjatVolunteerAssignmentAttendanceSummary
  absenceReasons: UjatVolunteerAssignmentAbsenceReason[]
}) {
  const { showAlert } = useCmsAlert()
  const showAbsenceReasonBlock = hasExcusedAbsenceInAssignmentRows(assignmentRows)

  const showComingSoon = () => {
    showAlert({ title: '안내', content: FEATURE_COMING_SOON_ALERT_MESSAGE })
  }

  return (
    <div className="ujat-volunteer-assignment-attendance-info">
      <section className="program-detail-fullpage-modal__info-tab-block">
        <h3 className="program-detail-info-tab__section-title">출결 관련 정보</h3>
        <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
          <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
            <colgroup>
              <col style={{ width: '200px' }} />
              <col />
              <col style={{ width: '200px' }} />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th>수료 여부</th>
                <td>{attendanceSummary.completionStatus}</td>
                <th>지각 횟수</th>
                <td>{attendanceSummary.lateCountLabel}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {showAbsenceReasonBlock ? (
        <section className="program-detail-fullpage-modal__info-tab-block ujat-volunteer-assignment-absence-reasons">
          <h3 className="program-detail-info-tab__section-title">불참 사유</h3>
          {absenceReasons.length > 0 ? (
            <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
              <table className="program-detail-info-tab__table program-detail-info-tab__table--basic ujat-volunteer-assignment-absence-reasons__table">
                <colgroup>
                  <col style={{ width: '200px' }} />
                  <col />
                  <col style={{ width: '200px' }} />
                  <col />
                </colgroup>
                <tbody>
                  {absenceReasons.map(item => (
                    <tr key={item.id}>
                      <th scope="row">{item.dateLabel}</th>
                      <td>{item.reason}</td>
                      <th scope="row">증빙 서류</th>
                      <td>
                        {item.fileName ? (
                          <button
                            type="button"
                            className="ujat-volunteer-assignment-absence-reasons__file"
                            onClick={showComingSoon}
                          >
                            <NoticeAttachmentDownloadIcon className="ujat-volunteer-assignment-absence-reasons__file-icon" />
                            <span className="ujat-volunteer-assignment-absence-reasons__file-name">
                              {item.fileName}
                            </span>
                          </button>
                        ) : (
                          <span className="ujat-volunteer-assignment-absence-reasons__dash">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="ujat-volunteer-assignment-absence-reasons__empty" role="status">
              {ABSENCE_REASON_EMPTY_MESSAGE}
            </p>
          )}
        </section>
      ) : null}
    </div>
  )
}
