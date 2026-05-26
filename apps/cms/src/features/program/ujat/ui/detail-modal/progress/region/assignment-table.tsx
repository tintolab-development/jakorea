import '@/shared/ui/cross-table.css'
import { getRegionAssignmentInstitutionHeaderLabel } from './mock'
import { RegionAssignmentCellContent } from './assignment-cell'
import type { RegionAssignmentTableData } from './types'
import './assignment-table.css'

export function RegionAssignmentTable({ data }: { data: RegionAssignmentTableData }) {
  const { regionKey, columns, rows } = data

  return (
    <div className="ujat-region-assignment-table__scroll">
      <div className="cross-table ujat-region-assignment-table">
        <table
          className="cross-table__table"
          aria-label={`${data.regionLabel} 지역 교육 배정`}
        >
          <colgroup>
            <col className="cross-table__label-col" />
            <col className="ujat-region-assignment-table__volunteer-col" />
            {columns.map(column => (
              <col key={column.id} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th
                className="cross-table__cell cross-table__cell--corner ujat-region-assignment-table__corner-days"
                rowSpan={2}
                scope="col"
              >
                총 교육일
              </th>
              <th
                className="cross-table__cell cross-table__cell--corner ujat-region-assignment-table__corner-axis-top"
                scope="col"
              >
                교육 진행일
              </th>
              {columns.map(column => (
                <th
                  key={`${column.id}-date`}
                  className="cross-table__cell cross-table__cell--column-header"
                  scope="col"
                >
                  {column.dateLabel}
                </th>
              ))}
            </tr>
            <tr>
              <th
                className="cross-table__cell cross-table__cell--corner ujat-region-assignment-table__corner-axis-bottom"
                scope="col"
              >
                기관명 및 소재지
              </th>
              {columns.map(column => (
                <th
                  key={`${column.id}-inst`}
                  className="cross-table__cell cross-table__cell--column-header ujat-region-assignment-table__institution-header"
                  scope="col"
                >
                  {getRegionAssignmentInstitutionHeaderLabel(column, regionKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.id}
                className={
                  row.isWithdrawnVolunteer ? 'ujat-region-assignment-table__row--withdrawn' : ''
                }
              >
                <th
                  className="cross-table__cell cross-table__cell--row-header ujat-region-assignment-table__days-cell"
                  scope="row"
                >
                  {row.totalAssignedDays}일
                </th>
                <th
                  className="cross-table__cell cross-table__cell--row-header ujat-region-assignment-table__name-cell"
                  scope="row"
                >
                  {row.name}
                </th>
                {row.cells.slice(0, columns.length).map((cell, cellIndex) => {
                  const column = columns[cellIndex]
                  const isBlockedEmpty =
                    cell.kind === 'empty' && (cell.blockedEmpty || column?.isBlockedDate)

                  return (
                    <td
                      key={`${row.id}-${column?.id ?? cellIndex}`}
                      className={[
                        'cross-table__cell',
                        'cross-table__cell--data',
                        'ujat-region-assignment-table__data-cell',
                        isBlockedEmpty ? 'ujat-region-assignment-table__data-cell--blocked' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <RegionAssignmentCellContent cell={cell} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
