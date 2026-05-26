import '@/shared/ui/cross-table.css'
import { getUjatEducationProgressVolunteerSummary } from '@/data/mock/ujat-education-progress-summary-mock'
import {
  formatSummaryCellValue,
  summaryToneClassName,
  UJAT_EDU_PROGRESS_SUMMARY_TOTAL_CELL_CLASSNAME,
} from './summary-display'
import {
  SUMMARY_PLAIN_ROW_CLASSNAME,
  SUMMARY_ROW_HEADER,
  UjatEducationProgressSummaryCategoryCellInner,
  UjatEducationProgressSummaryMatrixShell,
  UjatEducationProgressSummaryRegionDataCells,
  UjatEducationProgressSummaryRegionHeader,
} from './region-matrix-table'

const DATA = 'cross-table__cell cross-table__cell--data'

export function UjatEducationProgressVolunteerSummaryTable() {
  const summary = getUjatEducationProgressVolunteerSummary()
  const regionColCount = 8
  const totalColCount = 1

  return (
    <UjatEducationProgressSummaryMatrixShell ariaLabel="봉사단 교육 진행 요약">
      <UjatEducationProgressSummaryRegionHeader />
      <tbody>
        {summary.rows.map(row => {
          if (row.mergedTotalOnly) {
            return (
              <tr key={row.key}>
                <th
                  className={[SUMMARY_ROW_HEADER, summaryToneClassName(row.tone)]
                    .filter(Boolean)
                    .join(' ')}
                  scope="row"
                >
                  <UjatEducationProgressSummaryCategoryCellInner>
                    {row.label}
                  </UjatEducationProgressSummaryCategoryCellInner>
                </th>
                <td
                  colSpan={regionColCount + totalColCount}
                  className={`${DATA} ${UJAT_EDU_PROGRESS_SUMMARY_TOTAL_CELL_CLASSNAME} ujat-edu-progress-summary__cell--merged-total`}
                >
                  {formatSummaryCellValue(row.row.total)}
                </td>
              </tr>
            )
          }

          return (
            <tr
              key={row.key}
              className={row.key === 'planned_selection' ? SUMMARY_PLAIN_ROW_CLASSNAME : undefined}
            >
              <th
                className={[SUMMARY_ROW_HEADER, summaryToneClassName(row.tone)]
                  .filter(Boolean)
                  .join(' ')}
                scope="row"
              >
                <UjatEducationProgressSummaryCategoryCellInner>
                  {row.label}
                </UjatEducationProgressSummaryCategoryCellInner>
              </th>
              <UjatEducationProgressSummaryRegionDataCells row={row.row} />
            </tr>
          )
        })}
      </tbody>
    </UjatEducationProgressSummaryMatrixShell>
  )
}
