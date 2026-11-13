import { Fragment, useState, type ReactNode } from 'react'
import './alimtalk-nested-table.css'

export type AlimtalkNestedLine = {
  label: string
  value: string
}

export type AlimtalkNestedTableRow = {
  id?: string
  cells: [string, string]
  nestedLines?: AlimtalkNestedLine[]
}

export type AlimtalkNestedTableProps = {
  columns: [string, string]
  rows: AlimtalkNestedTableRow[]
  className?: string
  hideToggle?: boolean
  footer?: { label: string; cells: [string, string] }
}

/** 시안 `Icon / Etc / Basic` 28 up 원본 */
function ToggleIcon() {
  return (
    <svg
      className="alimtalk-nested-table__toggle-icon"
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
    >
      <path
        d="M13.3877 11.1124L9.15855 15.3416C9.10022 15.3999 9.05647 15.4631 9.0273 15.5312C8.99813 15.5992 8.98355 15.6721 8.98355 15.7499C8.98355 15.9055 9.03702 16.0416 9.14397 16.1583C9.25091 16.2749 9.39188 16.3333 9.56688 16.3333H18.4336C18.6086 16.3333 18.7495 16.2749 18.8565 16.1583C18.9634 16.0416 19.0169 15.9055 19.0169 15.7499C19.0169 15.711 18.9586 15.5749 18.8419 15.3416L14.6127 11.1124C14.5155 11.0152 14.4183 10.9471 14.3211 10.9083C14.2238 10.8694 14.1169 10.8499 14.0002 10.8499C13.8836 10.8499 13.7766 10.8694 13.6794 10.9083C13.5822 10.9471 13.4849 11.0152 13.3877 11.1124Z"
        fill="#3D3D3D"
      />
    </svg>
  )
}

function rowKey(row: AlimtalkNestedTableRow, index: number): string {
  return row.id ?? `${row.cells[0]}-${index}`
}

function ItemListCell({
  variant,
  children,
  className,
  as: Tag = 'td',
  ...rest
}: {
  variant: 'summary' | 'flex'
  children?: ReactNode
  className?: string
  as?: 'td' | 'th'
} & Record<string, unknown>) {
  const cellClass =
    variant === 'summary' ? 'alimtalk-nested-table__summary-col' : 'alimtalk-nested-table__flex-col'
  return (
    <Tag
      className={[cellClass, className].filter(Boolean).join(' ')}
      {...rest}
    >
      <span
        className={[
          'alimtalk-nested-table__cell-inner',
          variant === 'summary'
            ? 'alimtalk-nested-table__cell-inner--summary'
            : 'alimtalk-nested-table__cell-inner--flex',
        ].join(' ')}
      >
        {children}
      </span>
    </Tag>
  )
}

export function AlimtalkNestedTable({
  columns,
  rows,
  className,
  hideToggle = false,
  footer,
}: AlimtalkNestedTableProps) {
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({})
  const showFooter = Boolean(footer)
  const isItemListLayout = hideToggle && showFooter
  const colSpan = hideToggle ? (showFooter ? 3 : 2) : 3

  function isExpanded(key: string, hasNested: boolean): boolean {
    if (!hasNested) return false
    return expandedById[key] ?? true
  }

  function toggle(key: string) {
    setExpandedById(prev => ({ ...prev, [key]: !(prev[key] ?? true) }))
  }

  return (
    <div className={['alimtalk-nested-table-wrap', className].filter(Boolean).join(' ')}>
      <table
        className={[
          'alimtalk-nested-table',
          hideToggle ? 'alimtalk-nested-table--plain' : '',
          showFooter ? 'alimtalk-nested-table--footer' : '',
          isItemListLayout ? 'alimtalk-nested-table--item-list' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <colgroup>
          {hideToggle ? null : <col className="alimtalk-nested-table__col-toggle" />}
          {isItemListLayout ? <col className="alimtalk-nested-table__col-summary" /> : null}
          <col className={isItemListLayout ? 'alimtalk-nested-table__col-flex' : undefined} />
          <col className={isItemListLayout ? 'alimtalk-nested-table__col-flex' : undefined} />
        </colgroup>
        <thead>
          <tr>
            {hideToggle ? null : <th className="alimtalk-nested-table__toggle" aria-hidden />}
            {isItemListLayout ? (
              <ItemListCell variant="summary" as="th">
                순서
              </ItemListCell>
            ) : null}
            {isItemListLayout ? (
              <>
                <ItemListCell variant="flex" as="th">{columns[0]}</ItemListCell>
                <ItemListCell variant="flex" as="th">{columns[1]}</ItemListCell>
              </>
            ) : (
              <>
                <th>{columns[0]}</th>
                <th>{columns[1]}</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const key = rowKey(row, index)
            const nestedLines = row.nestedLines ?? []
            const hasNested = nestedLines.length > 0
            const expanded = isExpanded(key, hasNested)
            return (
              <Fragment key={key}>
                <tr>
                  {hideToggle ? null : (
                    <td className="alimtalk-nested-table__toggle">
                      {hasNested ? (
                        <button
                          type="button"
                          className="alimtalk-nested-table__toggle-btn"
                          aria-expanded={expanded}
                          aria-label={expanded ? '접기' : '펼치기'}
                          onClick={() => toggle(key)}
                        >
                          <ToggleIcon />
                        </button>
                      ) : null}
                    </td>
                  )}
                  {isItemListLayout ? (
                    <>
                      <ItemListCell variant="summary">{index + 1}</ItemListCell>
                      <ItemListCell variant="flex">{row.cells[0]}</ItemListCell>
                      <ItemListCell variant="flex">{row.cells[1]}</ItemListCell>
                    </>
                  ) : (
                    <>
                      <td>{row.cells[0]}</td>
                      <td>{row.cells[1]}</td>
                    </>
                  )}
                </tr>
                {hasNested && expanded ? (
                  <tr className="alimtalk-nested-table__row--detail">
                    <td colSpan={colSpan}>
                      <div className="alimtalk-nested-table__detail">
                        {nestedLines.map(line => (
                          <p key={`${line.label}-${line.value}`} className="alimtalk-nested-table__detail-line">
                            <span className="alimtalk-nested-table__nested-label">{line.label}</span>
                            <span className="alimtalk-nested-table__nested-sep" aria-hidden>
                              :
                            </span>
                            <span className="alimtalk-nested-table__nested-value">{line.value}</span>
                          </p>
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            )
          })}
        </tbody>
        {footer ? (
          <tfoot>
            <tr className="alimtalk-nested-table__row--summary">
              {isItemListLayout ? (
                <>
                  <ItemListCell variant="summary">{footer.label}</ItemListCell>
                  <ItemListCell variant="flex">{footer.cells[0]}</ItemListCell>
                  <ItemListCell variant="flex">{footer.cells[1]}</ItemListCell>
                </>
              ) : (
                <>
                  <td>{footer.label}</td>
                  <td>{footer.cells[0]}</td>
                  <td>{footer.cells[1]}</td>
                </>
              )}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  )
}
