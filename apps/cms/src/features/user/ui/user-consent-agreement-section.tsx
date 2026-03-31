/**
 * 회원 상세 — 정보 제공 동의 (목 데이터·추후 API 연동)
 */

import { useId, type ReactNode } from 'react'
import './user-detail-section-head.css'
import './user-consent-agreement-section.css'

export interface ConsentRow {
  label: string
  value: ReactNode
  /** 우측 액션 (예: 동의서 보기) */
  action?: ReactNode
}

export interface UserConsentAgreementSectionProps {
  /** 상단 회색 안내 */
  caption?: ReactNode
  /** 동의 항목 행 — 미지정 시 목 데이터 2행(개인정보·마케팅) */
  rows?: ConsentRow[]
}

const DEFAULT_ROWS: ConsentRow[] = [
  {
    label: '개인정보 수집 동의',
    value: '동의 | 2026.01.15 09:15:42',
  },
  {
    label: '마케팅 제공 동의',
    value: '동의 | 2026.01.15 09:15:42',
  },
]

/** `동의 | 2026.01.15 09:15:42` 형태면 상태·구분자·날짜시간으로 나누어 날짜에 전용 스타일 적용 */
function ConsentValueDisplay({ value }: { value: ReactNode }) {
  if (typeof value !== 'string') return value
  const idx = value.indexOf('|')
  if (idx === -1) return value
  const status = value.slice(0, idx).trim()
  const datetime = value.slice(idx + 1).trim()
  if (!datetime) return value
  return (
    <span className="user-consent-agreement-section__value-inner">
      <span className="user-consent-agreement-section__value-status">{status}</span>
      <span className="user-consent-agreement-section__value-sep" aria-hidden>
        |
      </span>
      <span className="user-consent-agreement-section__value-datetime">{datetime}</span>
    </span>
  )
}

export function UserConsentAgreementSection({
  caption = '*미동의 시 프로그램 신청 및 활동에 제한이 있을 수 있습니다.',
  rows = DEFAULT_ROWS,
}: UserConsentAgreementSectionProps) {
  const titleId = useId()

  const twoColumnSingleRow = rows.length === 2 && rows.every(r => r.action == null)

  return (
    <section className="user-consent-agreement-section" aria-labelledby={titleId}>
      <div className="user-detail-section__head">
        <div id={titleId} className="user-detail-section__title">
          정보 제공 동의
        </div>
        {caption ? <p className="user-detail-section__caption">{caption}</p> : null}
      </div>
      <div className="user-detail-modal__basic-inner">
        <div className="user-detail-modal__basic-table-wrap">
          <table className="user-detail-modal__basic-table user-consent-agreement-section__table">
            <colgroup>
              <col className="user-detail-modal__basic-table-col-label-left" />
              <col className="user-detail-modal__basic-table-col-name-sub" />
              <col className="user-detail-modal__basic-table-col-input-left" />
              <col className="user-detail-modal__basic-table-col-label-right" />
              <col className="user-detail-modal__basic-table-col-input-right" />
            </colgroup>
            <tbody>
              {twoColumnSingleRow ? (
                <tr>
                  <td
                    colSpan={2}
                    className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--row-label"
                  >
                    <span className="user-detail-modal__basic-table-label">{rows[0].label}</span>
                  </td>
                  <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider">
                    <ConsentValueDisplay value={rows[0].value} />
                  </td>
                  <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
                    <span className="user-detail-modal__basic-table-label">{rows[1].label}</span>
                  </td>
                  <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
                    <ConsentValueDisplay value={rows[1].value} />
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={`${row.label}-${i}`}>
                    <td
                      colSpan={2}
                      className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--row-label"
                    >
                      <span className="user-detail-modal__basic-table-label">{row.label}</span>
                    </td>
                    <td
                      colSpan={row.action ? 2 : 3}
                      className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider"
                    >
                      <ConsentValueDisplay value={row.value} />
                    </td>
                    {row.action ? (
                      <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-consent-agreement-section__action-cell">
                        {row.action}
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
