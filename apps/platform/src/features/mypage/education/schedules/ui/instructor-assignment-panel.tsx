import type { InstructorAssignmentSource } from '../lib/instructor-assignment-display'
import {
  displayAssignmentText,
  displayOrDash,
  formatAssignmentDistanceKm,
  formatAssignmentRole,
  formatAssignmentScheduleLine,
} from '../lib/instructor-assignment-display'
import { PFText } from '@/shared/ui'
import styles from './instructor-assignment-panel.module.css'

type InstructorAssignmentPanelProps = {
  items: readonly InstructorAssignmentSource[]
  hideWaitingList?: boolean
}

type AssignmentTableRow = {
  id: string
  role: string
  institutionName: string
  grade: string
  location: string
  distance: string
  scheduleLines: string[]
}

function buildRows(items: readonly InstructorAssignmentSource[]): AssignmentTableRow[] {
  const groups = new Map<string, InstructorAssignmentSource[]>()
  items.forEach(item => {
    const key = displayAssignmentText(item.institutionName) || `assignment:${item.assignmentId}`
    const current = groups.get(key)
    if (current) current.push(item)
    else groups.set(key, [item])
  })

  return Array.from(groups.entries())
    .sort(([, left], [, right]) => {
      const leftAt = left[0]?.startAt ?? ''
      const rightAt = right[0]?.startAt ?? ''
      return leftAt.localeCompare(rightAt) || (left[0]?.assignmentId ?? 0) - (right[0]?.assignmentId ?? 0)
    })
    .map(([key, originalItems]) => ({
      id: key,
      role: formatAssignmentRole(originalItems[0]?.instructorRole),
      institutionName: displayOrDash(originalItems[0]?.institutionName),
      grade:
        Array.from(
          new Set(originalItems.map(item => displayAssignmentText(item.grade)).filter(Boolean)),
        ).join(', ') || '-',
      location: displayOrDash(originalItems[0]?.institutionAddress),
      distance: formatAssignmentDistanceKm(originalItems[0]?.distanceFromHome),
      scheduleLines: originalItems.map(formatAssignmentScheduleLine),
    }))
}

function AssignedInstitutionTable({ rows }: { rows: readonly AssignmentTableRow[] }) {
  return (
    <div className={styles.tableWrap}>
      <table
        className={`${styles.table} ${styles.assignedTable}`}
        aria-label="배정된 기관 목록"
      >
        <colgroup>
          <col className={styles.numberColumn} />
          <col className={styles.roleColumn} />
          <col className={styles.institutionColumn} />
          <col className={styles.gradeColumn} />
          <col className={styles.locationColumn} />
          <col className={styles.distanceColumn} />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">No.</th>
            <th scope="col">역할</th>
            <th scope="col">기관명</th>
            <th scope="col">담당학년</th>
            <th scope="col">기관 소재지</th>
            <th scope="col">자택과의 거리</th>
            <th scope="col">담당 교육 진행 일정</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id}>
              <td>{rows.length - index}</td>
              <td>{row.role}</td>
              <td>{row.institutionName}</td>
              <td>{row.grade}</td>
              <td>{row.location}</td>
              <td>{row.distance}</td>
              <td>
                <div className={styles.scheduleLines}>
                  {row.scheduleLines.map((line, lineIndex) => (
                    <span key={`${row.id}-${lineIndex}`}>{line}</span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function WaitingInstitutionTable() {
  return (
    <div className={styles.tableWrap}>
      <table
        className={`${styles.table} ${styles.waitingTable}`}
        aria-label="배정된 대기 기관 목록"
      >
        <colgroup>
          <col className={styles.numberColumn} />
          <col className={styles.institutionColumn} />
          <col className={styles.gradeColumn} />
          <col className={styles.locationColumn} />
          <col className={styles.distanceColumn} />
          <col />
          <col className={styles.statusColumn} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">No.</th>
            <th scope="col">기관명</th>
            <th scope="col">희망 학년</th>
            <th scope="col">기관 소재지</th>
            <th scope="col">자택과의 거리</th>
            <th scope="col">담당 교육 진행 일정</th>
            <th scope="col">배정 상태</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={7} className={styles.emptyCell}>
              대기 기관이 없습니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export function InstructorAssignmentPanel({ items, hideWaitingList = false }: InstructorAssignmentPanelProps) {
  const rows = buildRows(items)

  return (
    <section className={styles.root} aria-labelledby="instructor-assignment-title">
      <div className={styles.section}>
        <h2 id="instructor-assignment-title" className={styles.sectionTitle}>
          배정된 기관 목록 <span>{rows.length}건</span>
        </h2>
        {rows.length > 0 ? (
          <AssignedInstitutionTable rows={rows} />
        ) : (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
            배정된 기관이 없습니다.
          </PFText>
        )}
      </div>
      {hideWaitingList ? null : (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            배정된 대기 기관 목록 <span>0건</span>
          </h2>
          <WaitingInstitutionTable />
        </div>
      )}
    </section>
  )
}
