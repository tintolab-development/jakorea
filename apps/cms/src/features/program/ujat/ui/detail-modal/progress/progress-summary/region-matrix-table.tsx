import type { ReactNode } from 'react'
import {
  formatSummaryCellValue,
  regionValuesInOrder,
  UJAT_EDU_PROGRESS_SUMMARY_TOTAL_CELL_CLASSNAME,
} from './summary-display'
import type {
  UjatEducationProgressColumnRegion,
  UjatEducationProgressRegionRow,
} from './types'

const CELL = 'cross-table__cell'
const COLUMN_HEADER = `${CELL} cross-table__cell--column-header`
const CATEGORY_HEADER = `${COLUMN_HEADER} ujat-edu-progress-summary__category-header`
const DATA = `${CELL} cross-table__cell--data`

export function UjatEducationProgressSummaryCategoryCellInner({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const innerClassName = [
    'ujat-edu-progress-summary__category-cell-inner',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <span className={innerClassName}>{children}</span>
}

export function UjatEducationProgressSummaryRegionHeader({
  regions,
  categoryColSpan = 1,
}: {
  regions: readonly UjatEducationProgressColumnRegion[]
  categoryColSpan?: number
}) {
  return (
    <thead>
      <tr>
        <th className={CATEGORY_HEADER} colSpan={categoryColSpan} scope="colgroup">
          <UjatEducationProgressSummaryCategoryCellInner>
            구분
          </UjatEducationProgressSummaryCategoryCellInner>
        </th>
        {regions.map(region => (
          <th key={region.key} className={COLUMN_HEADER} scope="col">
            {region.label}
          </th>
        ))}
        <th className={COLUMN_HEADER} scope="col">
          합계
        </th>
      </tr>
    </thead>
  )
}

export function UjatEducationProgressSummaryRegionDataCells({
  regions,
  row,
  emphasizeTotal = true,
  regionDataClassName,
}: {
  regions: readonly UjatEducationProgressColumnRegion[]
  row: UjatEducationProgressRegionRow
  emphasizeTotal?: boolean
  regionDataClassName?: string
}) {
  const regionValues = regionValuesInOrder(
    row,
    regions.map(region => region.key)
  )
  const regionCellClassName = [DATA, regionDataClassName].filter(Boolean).join(' ')
  return (
    <>
      {regionValues.map((value, index) => (
        <td key={regions[index]?.key ?? index} className={regionCellClassName}>
          {formatSummaryCellValue(value)}
        </td>
      ))}
      <td
        className={
          emphasizeTotal
            ? `${DATA} ${UJAT_EDU_PROGRESS_SUMMARY_TOTAL_CELL_CLASSNAME}`
            : DATA
        }
      >
        {formatSummaryCellValue(row.total)}
      </td>
    </>
  )
}

export function UjatEducationProgressSummaryMatrixShell({
  regions,
  ariaLabel,
  labelColCount = 1,
  children,
}: {
  regions: readonly UjatEducationProgressColumnRegion[]
  ariaLabel: string
  labelColCount?: 1 | 2
  children: ReactNode
}) {
  const shellClassName = [
    'cross-table',
    'ujat-edu-progress-summary__matrix',
    `ujat-edu-progress-summary__matrix--label-${labelColCount}`,
  ].join(' ')

  return (
    <div className={shellClassName}>
      <table className="cross-table__table" aria-label={ariaLabel}>
        <colgroup>
          {labelColCount === 2 ? (
            <>
              <col className="ujat-edu-progress-summary__group-col" />
              <col className="ujat-edu-progress-summary__metric-col" />
            </>
          ) : (
            <col className="cross-table__label-col" />
          )}
          {regions.map(region => (
            <col key={region.key} className="ujat-edu-progress-summary__region-col" />
          ))}
          <col className="ujat-edu-progress-summary__total-col" />
        </colgroup>
        {children}
      </table>
    </div>
  )
}

export const SUMMARY_ROW_HEADER = `${CELL} cross-table__cell--row-header ujat-edu-progress-summary__category-cell`

export const SUMMARY_CATEGORY_TD = `${CELL} cross-table__cell--row-header ujat-edu-progress-summary__category-cell ujat-edu-progress-summary__category-td`

export const SUMMARY_PLAIN_ROW_CLASSNAME = 'ujat-edu-progress-summary__row--plain'
