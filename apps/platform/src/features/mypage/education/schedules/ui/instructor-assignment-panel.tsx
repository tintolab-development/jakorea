import type { LectureReportAssignment } from '../api/lecture-report-client'
import { formatDisplayDateTime } from '@/shared/lib/format-display-date'
import {
  asAssignmentDisplayText,
  displayAssignmentValueOrDash,
  formatAssignmentDistanceKm,
  formatAssignmentSessionLabel,
  formatInstructorRole,
  groupAssignmentsByInstitution,
} from '../lib/instructor-assignment-support'
import { PFCategoryBadge, PFText } from '@/shared/ui'
import styles from './instructor-assignment-panel.module.css'

type InstructorAssignmentPanelProps = {
  items: readonly LectureReportAssignment[]
  hideWaitingList?: boolean
  /** 개인 프로그램 — 배정된 교육 일정 / 배정 대기 교육 일정 (기관명·학년 대신 출강지) */
  individual?: boolean
  /** 일정형 + 복수 회차 — 차시/회차 대신 일정명 표시 */
  useScheduleName?: boolean
}

type AssignmentTableLine = {
  id: string
  schedule: string
}

/** 같은 기관 + 같은 역할 + 같은 담당학년은 한 행. 일정만 배정마다 한 줄씩 둔다. */
type AssignmentTableRow = {
  id: string
  role: string
  grade: string
  institutionName: string
  location: string
  distance: string
  lines: AssignmentTableLine[]
}

function parseDisplayDateTime(value: string | null): { date: string; time: string } | null {
  if (!value) return null
  const formatted = formatDisplayDateTime(value)
  if (!formatted) return null
  const match = /^(.*) (\d{2}:\d{2})$/.exec(formatted)
  if (!match) return { date: formatted, time: '' }
  return { date: match[1], time: match[2] }
}

function formatScheduleLine(item: LectureReportAssignment, useScheduleName: boolean): string {
  const start = parseDisplayDateTime(item.startAt)
  const end = parseDisplayDateTime(item.endAt)
  const date = start?.date || end?.date || '-'
  const time = start?.time && end?.time ? `${start.time}~${end.time}` : start?.time || end?.time || '-'
  const session = formatAssignmentSessionLabel(item, useScheduleName)

  if (!start && !end && session === '-') return '-'
  return `${date} ${time} | ${session}`
}

function buildRows(
  items: readonly LectureReportAssignment[],
  useScheduleName: boolean,
): AssignmentTableRow[] {
  return groupAssignmentsByInstitution(items).map(({ key, items: groupItems }) => {
    const first = groupItems[0]
    return {
      id: key,
      role: formatInstructorRole(first?.instructorRole),
      grade: displayAssignmentValueOrDash(first?.grade),
      institutionName: asAssignmentDisplayText(first?.institutionName) || '-',
      location: displayAssignmentValueOrDash(first?.institutionAddress),
      distance: formatAssignmentDistanceKm(first?.distanceFromHome),
      lines: groupItems.map(item => ({
        id: String(item.assignmentId),
        schedule: formatScheduleLine(item, useScheduleName),
      })),
    }
  })
}

/** Figma 11001-286932 Badge Category: 대표 강사 primary, 일반 강사 secondary (읽기 전용 표시) */
function renderRole(role: string) {
  if (role === '대표 강사' || role === '일반 강사') {
    return (
      <PFCategoryBadge
        size="small"
        variant={role === '대표 강사' ? 'primary' : 'secondary'}
        className={styles.roleBadge}
      >
        {role}
      </PFCategoryBadge>
    )
  }
  return role
}

function renderLines(row: AssignmentTableRow, pick: (line: AssignmentTableLine) => string) {
  return (
    <div className={styles.scheduleLines}>
      {row.lines.map(line => (
        <span key={`${row.id}-${line.id}`}>{pick(line)}</span>
      ))}
    </div>
  )
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
              <td>{renderRole(row.role)}</td>
              <td>{row.institutionName}</td>
              <td>{row.grade}</td>
              <td>{row.location}</td>
              <td>{row.distance}</td>
              <td>{renderLines(row, line => line.schedule)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** 개인 프로그램 — 배정된 교육 일정. 출강지는 응답에 일정 장소 필드가 없어 '-'로 둔다. */
function AssignedScheduleTable({ rows }: { rows: readonly AssignmentTableRow[] }) {
  return (
    <div className={styles.tableWrap}>
      <table
        className={`${styles.table} ${styles.assignedTable}`}
        aria-label="배정된 교육 일정"
      >
        <colgroup>
          <col className={styles.numberColumn} />
          <col className={styles.roleColumn} />
          <col className={styles.locationColumn} />
          <col className={styles.distanceColumn} />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">No.</th>
            <th scope="col">역할</th>
            <th scope="col">출강지</th>
            <th scope="col">자택과의 거리</th>
            <th scope="col">담당 교육 진행 일정</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id}>
              <td>{rows.length - index}</td>
              <td>{renderRole(row.role)}</td>
              <td>-</td>
              <td>{row.distance}</td>
              <td>{renderLines(row, line => line.schedule)}</td>
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

/** 개인 프로그램 — 배정 대기 교육 일정. 대기 목록 API 전까지 빈 상태만 둔다. */
function WaitingScheduleTable() {
  return (
    <div className={styles.tableWrap}>
      <table
        className={`${styles.table} ${styles.waitingTable}`}
        aria-label="배정 대기 교육 일정"
      >
        <colgroup>
          <col className={styles.numberColumn} />
          <col className={styles.locationColumn} />
          <col className={styles.distanceColumn} />
          <col />
          <col className={styles.statusColumn} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">No.</th>
            <th scope="col">출강지</th>
            <th scope="col">자택과의 거리</th>
            <th scope="col">교육 진행 희망 일정</th>
            <th scope="col">배정 현황</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={5} className={styles.emptyCell}>
              대기 교육 일정이 없습니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export function InstructorAssignmentPanel({
  items,
  hideWaitingList = false,
  individual = false,
  useScheduleName = false,
}: InstructorAssignmentPanelProps) {
  const rows = buildRows(items, useScheduleName)
  const assignedTitle = individual ? '배정된 교육 일정' : '배정된 기관 목록'
  const assignedEmptyText = individual ? '배정된 교육 일정이 없습니다.' : '배정된 기관이 없습니다.'
  const waitingTitle = individual ? '배정 대기 교육 일정' : '배정된 대기 기관 목록'

  return (
    <section className={styles.root} aria-labelledby="instructor-assignment-title">
      <div className={styles.section}>
        <h2 id="instructor-assignment-title" className={styles.sectionTitle}>
          {assignedTitle} <span>{rows.length}건</span>
        </h2>
        {rows.length > 0 ? (
          individual ? (
            <AssignedScheduleTable rows={rows} />
          ) : (
            <AssignedInstitutionTable rows={rows} />
          )
        ) : (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
            {assignedEmptyText}
          </PFText>
        )}
      </div>
      {hideWaitingList ? null : (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {waitingTitle} <span>0건</span>
          </h2>
          {individual ? <WaitingScheduleTable /> : <WaitingInstitutionTable />}
        </div>
      )}
    </section>
  )
}
