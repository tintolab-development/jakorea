import { useMemo } from 'react'
import { CmsButton } from '@/shared/ui'
import type { UjatEducationProgressInstitutionDetail } from './types'
import { buildAssignmentScheduleSections } from './assignment-data'
import './assignment-tab.css'

export function UjatEducationProgressInstitutionAssignmentTab({
  detail,
  dataRevision = 0,
}: {
  detail: UjatEducationProgressInstitutionDetail
  dataRevision?: number
}) {
  const sections = useMemo(
    () => buildAssignmentScheduleSections(detail),
    [detail, dataRevision]
  )

  return (
    <div className="ujat-education-progress-institution-detail__content ujat-education-progress-institution-assignment-tab">
      {sections.length === 0 ? (
        <p className="ujat-education-progress-institution-assignment-tab__empty">
          등록된 교육 일정이 없습니다.
        </p>
      ) : (
        sections.map(section => (
          <section
            key={section.scheduleId}
            className="ujat-education-progress-institution-assignment-tab__section"
            aria-labelledby={`assignment-schedule-${section.scheduleId}`}
          >
            <h3
              id={`assignment-schedule-${section.scheduleId}`}
              className="ujat-education-progress-institution-assignment-tab__schedule-header"
            >
              <span className="ujat-education-progress-institution-assignment-tab__schedule-date">
                {section.dateDisplay}
              </span>
              <span className="ujat-education-progress-institution-assignment-tab__schedule-meta">
                출결 담당자 : {section.attendanceManagerLabel} 총 {section.totalClassCount}학급
              </span>
            </h3>

            <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
              <table
                className="program-detail-info-tab__table program-detail-info-tab__table--basic ujat-education-progress-institution-assignment-tab__table"
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
                        <td
                          rowSpan={row.gradeRowSpan}
                          className="ujat-education-progress-institution-assignment-tab__grade-cell"
                        >
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
        ))
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
      className="ujat-education-progress-institution-assignment-tab__change-btn"
      onClick={onClick}
    >
      교육 학년 및 학급 변경
    </CmsButton>
  )
}

