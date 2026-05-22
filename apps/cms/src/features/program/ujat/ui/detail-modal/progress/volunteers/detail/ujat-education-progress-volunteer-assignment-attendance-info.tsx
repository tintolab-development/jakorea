import { DownloadOutlined } from '@ant-design/icons'
import { CmsButton } from '@/shared/ui'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants'
import { useCmsAlert } from '@/shared/ui'
import type {
  UjatVolunteerAssignmentAbsenceReason,
  UjatVolunteerAssignmentAttendanceSummary,
} from './ujat-education-progress-volunteer-assignment-types'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'


export function UjatEducationProgressVolunteerAssignmentAttendanceInfo({
  attendanceSummary,
  absenceReasons,
}: {
  attendanceSummary: UjatVolunteerAssignmentAttendanceSummary
  absenceReasons: UjatVolunteerAssignmentAbsenceReason[]
}) {
  const { showAlert } = useCmsAlert()

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

      {absenceReasons.length > 0 ? (
        <section className="program-detail-fullpage-modal__info-tab-block">
          <h3 className="program-detail-info-tab__section-title">불참 사유</h3>
          <ul className="ujat-volunteer-assignment-attendance-info__absence-list">
            {absenceReasons.map(item => (
              <li key={item.id} className="ujat-volunteer-assignment-attendance-info__absence-item">
                <div className="ujat-volunteer-assignment-attendance-info__absence-text">
                  <span className="ujat-volunteer-assignment-attendance-info__absence-date">
                    {item.dateLabel}
                  </span>
                  <span>{item.reason}</span>
                </div>
                <CmsButton
                  type="button"
                  variant="secondary"
                  size="medium"
                  icon={<DownloadOutlined />}
                  onClick={showComingSoon}
                >
                  {item.fileName}
                </CmsButton>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
