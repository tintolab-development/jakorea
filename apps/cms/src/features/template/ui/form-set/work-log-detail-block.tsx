/**
 * 지급조서(발급용) — 근무일지 단락 전용 정적 테이블(입력 없음).
 */

import './work-log-detail-block.css'

const MAIN_HEADERS = ['날짜', '근무자(인)', '확인자(인)', '날짜', '근무자(인)', '확인자(인)'] as const
const BODY_ROW_COUNT = 16
const TOTAL_HEADERS = ['총 근무일수', '총 지급액'] as const

export function WorkLogDetailBlock() {
  return (
    <div className="work-log-detail-block">
      <div className="work-log-detail-block__table-radius">
        <table className="work-log-detail-block__main-table">
          <colgroup>
            <col className="work-log-detail-block__col--date" />
            <col className="work-log-detail-block__col--wide" />
            <col className="work-log-detail-block__col--wide" />
            <col className="work-log-detail-block__col--date" />
            <col className="work-log-detail-block__col--wide" />
            <col className="work-log-detail-block__col--wide" />
          </colgroup>
          <thead>
            <tr>
              {MAIN_HEADERS.map((label, idx) => (
                <th key={idx} className="work-log-detail-block__th-main">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: BODY_ROW_COUNT }, (_, i) => (
              <tr key={i}>
                {MAIN_HEADERS.map((_, j) => (
                  <td key={j} className="work-log-detail-block__td-main" />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="work-log-detail-block__table-radius">
        <table className="work-log-detail-block__totals-table">
          <colgroup>
            <col className="work-log-detail-block__col--total" />
            <col className="work-log-detail-block__col--total" />
          </colgroup>
          <thead>
            <tr>
              {TOTAL_HEADERS.map(label => (
                <th key={label} className="work-log-detail-block__th-total">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="work-log-detail-block__td-total" />
              <td className="work-log-detail-block__td-total" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
