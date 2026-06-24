import { NoticeAttachmentDownloadIcon } from '@/features/posts/ui/notice-attachment-download-icon'

export type ProgramAttendanceAbsenceReasonItem = {
  id: string
  dateLabel: string
  reason: string
  fileName?: string | null
}

const DEFAULT_EMPTY_MESSAGE = '사유 기재 후 불참한 이력이 없습니다.'

export interface ProgramAttendanceAbsenceReasonsProps {
  reasons: ProgramAttendanceAbsenceReasonItem[]
  emptyMessage?: string
  onFileDownload?: (item: ProgramAttendanceAbsenceReasonItem) => void
}

export function ProgramAttendanceAbsenceReasons({
  reasons,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  onFileDownload,
}: ProgramAttendanceAbsenceReasonsProps) {
  return (
    <section className="program-detail-fullpage-modal__info-tab-block program-attendance-absence-reasons">
      <div className="table-header-title--wrapper">
        <span className="table-title" style={{ marginBottom: 10 }}>
          불참 사유
        </span>
      </div>
      {reasons.length > 0 ? (
        <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
          <table className="program-detail-info-tab__table program-detail-info-tab__table--basic program-attendance-absence-reasons__table">
            <colgroup>
              <col style={{ width: '200px' }} />
              <col />
              <col style={{ width: '200px' }} />
              <col />
            </colgroup>
            <tbody>
              {reasons.map(item => (
                <tr key={item.id}>
                  <th scope="row">{item.dateLabel}</th>
                  <td>{item.reason}</td>
                  <th scope="row">증빙 서류</th>
                  <td>
                    {item.fileName ? (
                      <button
                        type="button"
                        className="program-attendance-absence-reasons__file"
                        onClick={() => onFileDownload?.(item)}
                      >
                        <NoticeAttachmentDownloadIcon className="program-attendance-absence-reasons__file-icon" />
                        <span className="program-attendance-absence-reasons__file-name">
                          {item.fileName}
                        </span>
                      </button>
                    ) : (
                      <span className="program-attendance-absence-reasons__dash">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="program-attendance-absence-reasons__empty" role="status">
          {emptyMessage}
        </p>
      )}
    </section>
  )
}
