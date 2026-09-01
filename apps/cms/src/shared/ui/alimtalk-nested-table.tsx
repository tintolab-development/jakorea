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
        d="M13.3885 11.1112L9.15937 15.3404C9.10104 15.3987 9.05729 15.4619 9.02812 15.5299C8.99896 15.598 8.98438 15.6709 8.98438 15.7487C8.98438 15.9043 9.03785 16.0404 9.14479 16.157C9.25174 16.2737 9.39271 16.332 9.56771 16.332H18.4344C18.6094 16.332 18.7503 16.2737 18.8573 16.157C18.9642 16.0404 19.0177 15.9043 19.0177 15.7487C19.0177 15.7098 18.9594 15.5737 18.8427 15.3404L14.6135 11.1112C14.5163 11.014 14.4191 10.9459 14.3219 10.907C14.2247 10.8681 14.1177 10.8487 14.001 10.8487C13.8844 10.8487 13.7774 10.8681 13.6802 10.907C13.583 10.9459 13.4858 11.014 13.3885 11.1112Z"
        fill="#1C1B1F"
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
              <ItemListCell variant="summary" as="th" aria-hidden />
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
                      <ItemListCell variant="summary" aria-hidden />
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
