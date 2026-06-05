/**
 * 기관 신청·참여 기관 상세 — 4열(라벨 200px) 테이블 행 (신청 양식 시안 정렬 SSOT)
 */

import type { ReactNode } from 'react'

/** 라벨 문자열을 본문 + `(…)` 보조 문구 두 줄로 표시 (th 중앙 정렬 유지) */
export function institutionApplicationTableLabelWithParenthesisHint(label: string): ReactNode {
  const open = label.indexOf('(')
  if (open <= 0) return label
  const main = label.slice(0, open).trim()
  const hint = label.slice(open).trim()
  if (!hint.startsWith('(') || !hint.endsWith(')')) return label
  return (
    <>
      {main}
      <br />
      {hint}
    </>
  )
}

export const INSTITUTION_OTHER_NOTES_TABLE_LABEL = '기타 특이사항 (주차, 전달사항 등)'

export const INSTITUTION_APPLICATION_INFO_COLGROUP = (
  <colgroup>
    <col style={{ width: '200px' }} />
    <col />
    <col style={{ width: '200px' }} />
    <col />
  </colgroup>
)

export const INSTITUTION_APPLICATION_SCHEDULE_COLGROUP = (
  <colgroup>
    <col style={{ width: '200px' }} />
    <col />
  </colgroup>
)

export function InstitutionApplicationTableRowTwoCols({
  label1,
  value1,
  label2,
  value2,
}: {
  label1: string
  value1: ReactNode
  label2: string
  value2: ReactNode
}) {
  return (
    <tr>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {label1}
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value">
        {value1}
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {label2}
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value">
        {value2}
      </td>
    </tr>
  )
}

export function InstitutionApplicationTableRowFullWidth({
  label,
  value,
  multiline,
}: {
  label: string
  value: ReactNode
  multiline?: boolean
}) {
  return (
    <tr>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {label}
      </td>
      <td
        colSpan={3}
        className={`applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value${
          multiline ? ' applicant-institution-basic-info__cell--value--multiline' : ''
        }`}
      >
        {value}
      </td>
    </tr>
  )
}

export function InstitutionApplicationTableRowSingleCol({
  label,
  value,
}: {
  label: ReactNode
  value: ReactNode
}) {
  return (
    <tr>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {label}
      </td>
      <td
        colSpan={3}
        className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value"
      >
        {value}
      </td>
    </tr>
  )
}
