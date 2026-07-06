import type { ReactNode } from 'react'

export type VerticalInfoTableItem = {
  key: string
  label: string
  children: ReactNode
  span?: 2
}

export function toVerticalInfoTableRows(
  items: VerticalInfoTableItem[]
): ReactNode[] {
  const rows: ReactNode[] = []
  let index = 0

  while (index < items.length) {
    const item = items[index]

    if (item.span === 2) {
      rows.push(
        <tr key={item.key}>
          <th>{item.label}</th>
          <td colSpan={3}>{item.children}</td>
        </tr>
      )
      index += 1
      continue
    }

    const next = items[index + 1]
    if (next && next.span !== 2) {
      rows.push(
        <tr key={item.key}>
          <th>{item.label}</th>
          <td>{item.children}</td>
          <th>{next.label}</th>
          <td>{next.children}</td>
        </tr>
      )
      index += 2
      continue
    }

    rows.push(
      <tr key={item.key}>
        <th>{item.label}</th>
        <td colSpan={3}>{item.children}</td>
      </tr>
    )
    index += 1
  }

  return rows
}

export function GeminiApprovedVerticalInfoTable({
  items,
  className,
}: {
  items: VerticalInfoTableItem[]
  className?: string
}) {
  const wrapperClass = [
    'program-detail-info-tab__table-wrapper',
    'gemini-approved-training-detail-info__vertical-table-wrap',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrapperClass}>
      <table
        className="program-detail-info-tab__table program-detail-info-tab__table--basic gemini-approved-training-detail-info__vertical-table"
        role="table"
      >
        <colgroup>
          <col className="gemini-approved-training-detail-info__col-label" />
          <col className="gemini-approved-training-detail-info__col-value" />
          <col className="gemini-approved-training-detail-info__col-label" />
          <col className="gemini-approved-training-detail-info__col-value" />
        </colgroup>
        <tbody>{toVerticalInfoTableRows(items)}</tbody>
      </table>
    </div>
  )
}
