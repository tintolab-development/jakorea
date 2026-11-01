import { useMemo } from 'react'
import { Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CmsButton, ExcelButton } from '@/shared/ui'
import { useUjatCanWrite } from '@/features/program/ujat/lib/use-can-write'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import type { UjatEducationProgressInstitutionDetail } from './types'
import type { AssignmentScheduleSection } from './assignment-data'
import { buildAssignmentScheduleSections } from './assignment-data'
import { useInstitutionAssignmentSources } from './use-institution-assignment'
import type { EducationProgressHalfKey } from '../../tabs'
import './assignment-tab.css'

type AssignmentExcelRow = {
  dateDisplay: string
  gradeLabel: string
  classLabel: string
  volunteerA: string
  volunteerB: string
  textbookName: string
  textbookQuantityLabel: string
}

const ASSIGNMENT_EXCEL_COLUMNS: ColumnsType<AssignmentExcelRow> = [
  { title: '교육일', dataIndex: 'dateDisplay', key: 'dateDisplay' },
  { title: '교육 학년', dataIndex: 'gradeLabel', key: 'gradeLabel' },
  { title: '교육 학급', dataIndex: 'classLabel', key: 'classLabel' },
  { title: '봉사자 A', dataIndex: 'volunteerA', key: 'volunteerA' },
  { title: '봉사자 B', dataIndex: 'volunteerB', key: 'volunteerB' },
  { title: '사용 교재명', dataIndex: 'textbookName', key: 'textbookName' },
  { title: '교재 준비수량', dataIndex: 'textbookQuantityLabel', key: 'textbookQuantityLabel' },
]

function buildAssignmentExcelRows(sections: AssignmentScheduleSection[]): AssignmentExcelRow[] {
  return sections.flatMap(section =>
    section.rows.map(row => ({
      dateDisplay: section.dateDisplay,
      gradeLabel: row.gradeLabel,
      classLabel: row.classLabel,
      volunteerA: row.volunteerA,
      volunteerB: row.volunteerB,
      textbookName: row.textbookName,
      textbookQuantityLabel: row.textbookQuantityLabel,
    }))
  )
}

function AssignmentSchedulePanel({ section }: { section: AssignmentScheduleSection }) {
  return (
    <section
      className="assignment-tab__section"
      aria-labelledby={`assignment-schedule-${section.scheduleId}`}
    >
      <div className="assignment-tab__schedule-header">
        <h3
          id={`assignment-schedule-${section.scheduleId}`}
          className="assignment-tab__schedule-date"
        >
          {section.dateDisplay}
        </h3>
        <div className="assignment-tab__schedule-meta" aria-label="일정 요약">
          <span className="assignment-tab__schedule-meta-item">
            출결 담당자 : {section.attendanceManagerLabel}
          </span>
          <span className="assignment-tab__schedule-meta-divider" aria-hidden />
          <span className="assignment-tab__schedule-meta-item">총 {section.totalClassCount}학급</span>
        </div>
      </div>

      {section.assignmentEmptyMessage ? (
        <p className="assignment-tab__schedule-empty">{section.assignmentEmptyMessage}</p>
      ) : (
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
      )}
    </section>
  )
}

export function useInstitutionAssignmentTabModel({
  detail,
  programId,
  dataRevision = 0,
}: {
  detail: UjatEducationProgressInstitutionDetail
  programId: string
  dataRevision?: number
}) {
  const assignment = useInstitutionAssignmentSources({
    programId,
    institutionId: detail.institutionId,
    half: detail.half as EducationProgressHalfKey,
  })
  const sections = useMemo(
    () => buildAssignmentScheduleSections(detail, assignment.sources),
    [assignment.sources, detail, dataRevision]
  )
  const excelRows = useMemo(() => buildAssignmentExcelRows(sections), [sections])
  const { exportExcel, isExporting } = useTableExcelExport({
    columns: ASSIGNMENT_EXCEL_COLUMNS,
    data: excelRows,
    filename: `${detail.institutionName}_교육_배정_및_진행_현황`,
  })

  return {
    sections,
    isLoading: assignment.isLoading,
    isRemote: assignment.isRemote,
    exportExcel,
    isExporting,
  }
}

export function UjatEducationProgressInstitutionAssignmentTab({
  model,
}: {
  model: ReturnType<typeof useInstitutionAssignmentTabModel>
}) {
  const { sections, isLoading } = model

  return (
    <div className="ujat-education-progress-institution-detail__content assignment-tab">
      {isLoading ? (
        <div className="page-content-loading" role="status">
          <Spin />
        </div>
      ) : sections.length === 0 ? (
        <p className="assignment-tab__empty">등록된 교육 일정이 없습니다.</p>
      ) : (
        sections.map(section => <AssignmentSchedulePanel key={section.scheduleId} section={section} />)
      )}
    </div>
  )
}

export function UjatEducationProgressInstitutionAssignmentHeaderActions({
  onChangeClass,
  onExcelDownload,
  isExcelExporting = false,
}: {
  onChangeClass: () => void
  onExcelDownload: () => void
  isExcelExporting?: boolean
}) {
  const canWrite = useUjatCanWrite()

  return (
    <>
      <ExcelButton
        size="large"
        className="assignment-tab__excel-btn"
        loading={isExcelExporting}
        onClick={onExcelDownload}
      />
      {canWrite ? (
        <CmsButton
          type="button"
          variant="primary"
          size="large"
          className="assignment-tab__change-btn"
          onClick={onChangeClass}
        >
          교육 학년 및 학급 변경
        </CmsButton>
      ) : null}
    </>
  )
}
