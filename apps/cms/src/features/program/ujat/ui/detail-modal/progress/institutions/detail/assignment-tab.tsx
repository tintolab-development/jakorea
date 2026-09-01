import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { CmsButton, ExcelButton } from '@/shared/ui'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import type { UjatEducationProgressInstitutionDetail } from './types'
import type { AssignmentClassRow, AssignmentScheduleSection } from './assignment-data'
import { buildAssignmentScheduleSections } from './assignment-data'
import './assignment-tab.css'

type AssignmentExcelRow = {
  gradeLabel: string
  classLabel: string
  volunteerA: string
  volunteerB: string
  textbookName: string
  textbookQuantityLabel: string
}

const ASSIGNMENT_EXCEL_COLUMNS: ColumnsType<AssignmentExcelRow> = [
  { title: '교육 학년', dataIndex: 'gradeLabel', key: 'gradeLabel' },
  { title: '교육 학급', dataIndex: 'classLabel', key: 'classLabel' },
  { title: '봉사자 A', dataIndex: 'volunteerA', key: 'volunteerA' },
  { title: '봉사자 B', dataIndex: 'volunteerB', key: 'volunteerB' },
  { title: '사용 교재명', dataIndex: 'textbookName', key: 'textbookName' },
  { title: '교재 준비수량', dataIndex: 'textbookQuantityLabel', key: 'textbookQuantityLabel' },
]

function buildAssignmentExcelRows(rows: AssignmentClassRow[]): AssignmentExcelRow[] {
  return rows.map(row => ({
    gradeLabel: row.gradeLabel,
    classLabel: row.classLabel,
    volunteerA: row.volunteerA,
    volunteerB: row.volunteerB,
    textbookName: row.textbookName,
    textbookQuantityLabel: row.textbookQuantityLabel,
  }))
}

function AssignmentSchedulePanel({ section }: { section: AssignmentScheduleSection }) {
  const excelRows = useMemo(() => buildAssignmentExcelRows(section.rows), [section.rows])
  const { exportExcel, isExporting } = useTableExcelExport({
    columns: ASSIGNMENT_EXCEL_COLUMNS,
    data: excelRows,
    filename: `${section.dateDisplay}_교육_배정_및_진행_현황`,
  })

  return (
    <section
      className="assignment-tab__section"
      aria-labelledby={`assignment-schedule-${section.scheduleId}`}
    >
      <div className="assignment-tab__schedule-toolbar">
        <h3
          id={`assignment-schedule-${section.scheduleId}`}
          className="assignment-tab__schedule-header"
        >
          <span className="table-title">{section.dateDisplay}</span>
          <span className="assignment-tab__schedule-meta">
            출결 담당자 : <span style={{ fontWeight: '700' }}>{section.attendanceManagerLabel}</span>
          </span>
          <span className="table-description">총 {section.totalClassCount}학급</span>
        </h3>
        <ExcelButton onClick={exportExcel} loading={isExporting} />
      </div>

      <div className="assignment-tab__table-wrap">
        <table
          className="assignment-tab__table"
          aria-label={`${section.dateDisplay} 교육 배정 정보`}
        >
          <thead>
            <tr>
              <th scope="col">교육 학년</th>
              <th scope="col">교육 학급</th>
              <th scope="col">봉사자 A</th>
              <th scope="col">봉사자 B</th>
              <th scope="col">사용 교재명</th>
              <th scope="col">교재 준비수량</th>
            </tr>
          </thead>
          <tbody>
            {section.rows.map(row => (
              <tr key={`${section.scheduleId}-${row.gradeLabel}-${row.classNo}`}>
                {row.gradeRowSpan > 0 ? (
                  <td rowSpan={row.gradeRowSpan} className="assignment-tab__grade-cell">
                    {row.gradeLabel}
                  </td>
                ) : null}
                <td>{row.classLabel}</td>
                <td>{row.volunteerA}</td>
                <td>{row.volunteerB}</td>
                <td>{row.textbookName}</td>
                <td>{row.textbookQuantityLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function UjatEducationProgressInstitutionAssignmentTab({
  detail,
  dataRevision = 0,
}: {
  detail: UjatEducationProgressInstitutionDetail
  dataRevision?: number
}) {
  const sections = useMemo(() => buildAssignmentScheduleSections(detail), [detail, dataRevision])

  return (
    <div className="ujat-education-progress-institution-detail__content assignment-tab">
      {sections.length === 0 ? (
        <p className="assignment-tab__empty">등록된 교육 일정이 없습니다.</p>
      ) : (
        sections.map(section => <AssignmentSchedulePanel key={section.scheduleId} section={section} />)
      )}
    </div>
  )
}

export function UjatEducationProgressInstitutionAssignmentChangeButton({
  onClick,
}: {
  onClick: () => void
}) {
  return (
    <CmsButton
      type="button"
      variant="primary"
      size="large"
      width={200}
      className="assignment-tab__change-btn"
      onClick={onClick}
    >
      교육 학년 및 학급 변경
    </CmsButton>
  )
}
