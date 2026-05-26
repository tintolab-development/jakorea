import type { ReactNode } from 'react'
import { UJAT_INSTITUTION_APPLICATION_REGIONS } from '../../application-institution/list/regions'
import {
  formatSummaryCellValue,
  regionValuesInOrder,
  UJAT_EDU_PROGRESS_SUMMARY_TOTAL_CELL_CLASSNAME,
} from './summary-display'
import type { UjatEducationProgressRegionRow } from './types'

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
  categoryColSpan = 1,
}: {
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
        {UJAT_INSTITUTION_APPLICATION_REGIONS.map(region => (
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
  row,
  emphasizeTotal = true,
  regionDataClassName,
}: {
  row: UjatEducationProgressRegionRow
  emphasizeTotal?: boolean
  regionDataClassName?: string
}) {
  const regionValues = regionValuesInOrder(row)
  const regionCellClassName = [DATA, regionDataClassName].filter(Boolean).join(' ')
  return (
    <>
      {regionValues.map((value, index) => (
        <td key={UJAT_INSTITUTION_APPLICATION_REGIONS[index]!.key} className={regionCellClassName}>
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
  ariaLabel,
  labelColCount = 1,
  children,
}: {
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
          {UJAT_INSTITUTION_APPLICATION_REGIONS.map(region => (
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
