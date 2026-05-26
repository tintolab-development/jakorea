import '@/shared/ui/cross-table.css'
import {
  getUjatEducationProgressSchoolSummary,
} from '@/data/mock/ujat-education-progress-summary-mock'
import {
  UJAT_EDU_PROGRESS_SCHOOL_METRIC_ORDER,
  UJAT_EDU_PROGRESS_SCHOOL_METRIC_LABEL,
} from './types'
import {
  summaryToneClassName,
} from './summary-display'
import {
  SUMMARY_CATEGORY_TD,
  SUMMARY_PLAIN_ROW_CLASSNAME,
  SUMMARY_ROW_HEADER,
  UjatEducationProgressSummaryCategoryCellInner,
  UjatEducationProgressSummaryMatrixShell,
  UjatEducationProgressSummaryRegionDataCells,
  UjatEducationProgressSummaryRegionHeader,
} from './region-matrix-table'

export function UjatEducationProgressSchoolSummaryTable() {
  const summary = getUjatEducationProgressSchoolSummary()

  return (
    <UjatEducationProgressSummaryMatrixShell
      ariaLabel="학교 교육 진행 요약"
      labelColCount={2}
    >
      <UjatEducationProgressSummaryRegionHeader categoryColSpan={2} />
      <tbody>
        <tr className={SUMMARY_PLAIN_ROW_CLASSNAME}>
          <td className={SUMMARY_CATEGORY_TD} colSpan={2}>
            <UjatEducationProgressSummaryCategoryCellInner>
              신청 학교
            </UjatEducationProgressSummaryCategoryCellInner>
          </td>
          <UjatEducationProgressSummaryRegionDataCells row={summary.appliedSchools} />
        </tr>
        {summary.semesters.map(semester =>
          UJAT_EDU_PROGRESS_SCHOOL_METRIC_ORDER.map((metricKey, metricIndex) => (
            <tr key={`${semester.label}-${metricKey}`}>
              {metricIndex === 0 ? (
                <th
                  rowSpan={UJAT_EDU_PROGRESS_SCHOOL_METRIC_ORDER.length}
                  className={[
                    SUMMARY_ROW_HEADER,
                    summaryToneClassName(semester.tone),
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  scope="rowgroup"
                >
                  <UjatEducationProgressSummaryCategoryCellInner className="ujat-edu-progress-summary__category-cell-inner--semester">
                    {semester.label}
                  </UjatEducationProgressSummaryCategoryCellInner>
                </th>
              ) : null}
              <th
                className={[
                  SUMMARY_ROW_HEADER,
                  summaryToneClassName(semester.tone),
                ]
                  .filter(Boolean)
                  .join(' ')}
                scope="row"
              >
                <UjatEducationProgressSummaryCategoryCellInner className="ujat-edu-progress-summary__category-cell-inner--metric">
                  {UJAT_EDU_PROGRESS_SCHOOL_METRIC_LABEL[metricKey]}
                </UjatEducationProgressSummaryCategoryCellInner>
              </th>
              <UjatEducationProgressSummaryRegionDataCells
                row={semester.metrics[metricKey]}
              />
            </tr>
          ))
        )}
      </tbody>
    </UjatEducationProgressSummaryMatrixShell>
  )
}
