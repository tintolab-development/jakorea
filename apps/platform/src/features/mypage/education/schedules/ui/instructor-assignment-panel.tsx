import type {
  InstructorAssignmentItem,
  InstructorAssignmentWaitingItem,
} from '../api/instructor-assignment-client'
import {
  asAssignmentDisplayText,
  displayAssignmentValueOrDash,
  formatAssignmentDistanceKm,
  formatAssignmentWaitingStatus,
  formatInstructorRole,
  groupAssignmentsByInstitution,
  sortAssignmentWaitingItems,
  type AssignmentWaitingStatusView,
} from '../lib/instructor-assignment-support'
import {
  formatInstructorEducationScheduleLine,
  formatInstructorEducationScheduleLineParts,
  type InstructorEducationScheduleDisplayInput,
} from '../lib/instructor-education-schedule-display'
import { PFCategoryBadge, PFText } from '@/shared/ui'
import styles from './instructor-assignment-panel.module.css'

type InstructorAssignmentPanelProps = {
  /** GET /api/portal/me/programs/{programId}/lecture-report-assignments 매핑 행 (서버 순서) */
  assignedItems: readonly InstructorAssignmentItem[]
  /**
   * 배정 대기 API는 없다. 항상 [] — assignment 부재로 대기를 추론하지 않는다.
   * 신청 대기 상태(결과 대기 등)는 program-applications.displayStatus.
   */
  waitingItems?: readonly InstructorAssignmentWaitingItem[]
  /** 개인 프로그램 — 배정된 교육 일정 / 배정 대기 교육 일정 (기관명·학년 대신 출강지) */
  individual?: boolean
  /** 일정형 + 복수 회차 — 회차/차시 대신 일정명 표시 */
  useScheduleName?: boolean
  /**
   * 제미나이 — Figma 11001-286882 배정된 기관 목록.
   * No. / 기관명 / 기관 소재지 / 자택과의 거리 / 담당 교육 진행 일정(일시 | 차시). 역할·담당학년 열 없음.
   */
  variant?: 'default' | 'gemini'
}

type AssignmentTableLine = {
  id: string
  schedule: string
  /** 일정 일시 (`schedule`을 일시·단위로 나눈 앞부분) */
  scheduleDateTime: string
  /** 교육 단위(차시 등). 없으면 빈 문자열 */
  scheduleUnit: string
}

/**
 * 기관형·제미나이: 같은 기관 신청(organizationApplicationId) + 같은 역할 + 같은 배정 학년은 한 행.
 * 개인형: 일정마다 한 행. 일정만 배정마다 한 줄씩 둔다.
 */
type AssignmentTableRow = {
  id: string
  role: string
  grade: string
  institutionName: string
  location: string
  distance: string
  lines: AssignmentTableLine[]
}

/** 배정 대기 목록 행 — 서버 행(rowKey) 하나가 한 행. */
type WaitingTableRow = {
  id: string
  institutionName: string
  requestedGrade: string
  location: string
  distance: string
  schedule: string
  status: AssignmentWaitingStatusView
}

function formatScheduleLine(
  item: InstructorEducationScheduleDisplayInput,
  useScheduleName: boolean,
): string {
  return formatInstructorEducationScheduleLine(item, useScheduleName)
}

function buildRows(
  items: readonly InstructorAssignmentItem[],
  individual: boolean,
  useScheduleName: boolean,
): AssignmentTableRow[] {
  return groupAssignmentsByInstitution(items).map(({ key, items: groupItems }) => {
    const first = groupItems[0]
    return {
      id: key,
      role: formatInstructorRole(first?.instructorRole),
      grade: displayAssignmentValueOrDash(first?.grade),
      institutionName: asAssignmentDisplayText(first?.institutionName) || '-',
      location: displayAssignmentValueOrDash(
        individual ? first?.scheduleLocation : first?.institutionAddress,
      ),
      distance: formatAssignmentDistanceKm(first?.distanceKm),
      lines: groupItems.map(item => {
        const parts = formatInstructorEducationScheduleLineParts(item, useScheduleName)
        return {
          id: String(item.assignmentId),
          schedule: formatScheduleLine(item, useScheduleName),
          scheduleDateTime: parts.dateTime,
          scheduleUnit: parts.unit,
        }
      }),
    }
  })
}

function buildWaitingRows(
  items: readonly InstructorAssignmentWaitingItem[],
  individual: boolean,
  useScheduleName: boolean,
): WaitingTableRow[] {
  return sortAssignmentWaitingItems(items).map(item => {
    const schedule = formatScheduleLine(item, useScheduleName)
    return {
      id: item.rowKey,
      institutionName: asAssignmentDisplayText(item.institutionName) || '-',
      requestedGrade: displayAssignmentValueOrDash(item.requestedGrade),
      location: displayAssignmentValueOrDash(
        individual ? item.scheduleLocation : item.institutionAddress,
      ),
      distance: formatAssignmentDistanceKm(item.distanceKm),
      schedule: schedule === '-' ? displayAssignmentValueOrDash(item.dateRangeLabel) : schedule,
      status: formatAssignmentWaitingStatus(item.status),
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

/** 제미나이 일정 한 줄 — Figma: `일시 │ N차시` (구분선 14px, 간격 12px) */
function renderGeminiScheduleLines(row: AssignmentTableRow) {
  return (
    <div className={styles.scheduleLines}>
      {row.lines.map(line => (
        <span key={`${row.id}-${line.id}`} className={styles.scheduleLine}>
          <span>{line.scheduleDateTime}</span>
          {line.scheduleUnit ? (
            <>
              <span className={styles.scheduleDivider} aria-hidden="true" />
              <span>{line.scheduleUnit}</span>
            </>
          ) : null}
        </span>
      ))}
    </div>
  )
}

/** 제미나이 — Figma 11001-286882. 역할·담당학년 열 없이 5열. */
function GeminiAssignedInstitutionTable({ rows }: { rows: readonly AssignmentTableRow[] }) {
  return (
    <div className={styles.tableWrap}>
      <table
        className={`${styles.table} ${styles.geminiAssignedTable}`}
        aria-label="배정된 기관 목록"
      >
        <colgroup>
          <col className={styles.numberColumn} />
          <col className={styles.institutionColumn} />
          <col className={styles.locationColumn} />
          <col className={styles.distanceColumn} />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">No.</th>
            <th scope="col">기관명</th>
            <th scope="col">기관 소재지</th>
            <th scope="col">자택과의 거리</th>
            <th scope="col">담당 교육 진행 일정</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id}>
              <td>{rows.length - index}</td>
              <td>{row.institutionName}</td>
              <td>{row.location}</td>
              <td>{row.distance}</td>
              <td>{renderGeminiScheduleLines(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** 개인 프로그램 — 배정된 교육 일정. 일정(scheduleId)마다 한 행, 출강지는 scheduleLocation. */
function AssignedScheduleTable({ rows }: { rows: readonly AssignmentTableRow[] }) {
  return (
    <div className={styles.tableWrap}>
      <table
        className={`${styles.table} ${styles.assignedTable}`}
        aria-label="배정된 일정 목록"
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

/** 배정 상태 — 기존 봉사 배정 현황과 같은 텍스트 라벨 스타일. 상태 라벨만 표시한다. */
function renderWaitingStatus(status: AssignmentWaitingStatusView) {
  const toneClass =
    status.tone === 'waiting' ? styles.statusWaiting : styles.statusInactive
  return (
    <div className={styles.scheduleLines}>
      <PFText as="span" typo="bd-md-md" className={toneClass}>
        {status.label}
      </PFText>
    </div>
  )
}

function waitingRowProps(row: WaitingTableRow) {
  return {
    className: row.status.disabled ? styles.disabledRow : undefined,
    'aria-disabled': row.status.disabled ? true : undefined,
  }
}

function WaitingInstitutionTable({ rows }: { rows: readonly WaitingTableRow[] }) {
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
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <tr key={row.id} {...waitingRowProps(row)}>
                <td>{rows.length - index}</td>
                <td>{row.institutionName}</td>
                <td>{row.requestedGrade}</td>
                <td>{row.location}</td>
                <td>{row.distance}</td>
                <td>{row.schedule}</td>
                <td>{renderWaitingStatus(row.status)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className={styles.emptyCell}>
                대기 기관이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/** 개인 프로그램 — 배정 대기 교육 일정. 출강지는 scheduleLocation. */
function WaitingScheduleTable({ rows }: { rows: readonly WaitingTableRow[] }) {
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
            <th scope="col">기관 소재지</th>
            <th scope="col">자택과의 거리</th>
            <th scope="col">교육 진행 희망 일정</th>
            <th scope="col">배정 현황</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <tr key={row.id} {...waitingRowProps(row)}>
                <td>{rows.length - index}</td>
                <td>{row.location}</td>
                <td>{row.distance}</td>
                <td>{row.schedule}</td>
                <td>{renderWaitingStatus(row.status)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className={styles.emptyCell}>
                대기 교육 일정이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export function InstructorAssignmentPanel({
  assignedItems,
  waitingItems = [],
  individual = false,
  useScheduleName = false,
  variant = 'default',
}: InstructorAssignmentPanelProps) {
  const rows = buildRows(assignedItems, individual, useScheduleName)
  const waitingRows = buildWaitingRows(waitingItems, individual, useScheduleName)
  const assignedTitle = individual ? '배정된 일정 목록' : '배정된 기관 목록'
  const assignedEmptyText = individual ? '배정된 일정이 없습니다.' : '배정된 기관이 없습니다.'
  const waitingTitle = individual ? '배정된 대기 일정 목록' : '배정된 대기 기관 목록'

  return (
    <section className={styles.root} aria-labelledby="instructor-assignment-title">
      <div className={styles.section}>
        <h2 id="instructor-assignment-title" className={styles.sectionTitle}>
          {assignedTitle} <span>{rows.length}건</span>
        </h2>
        {rows.length > 0 ? (
          individual ? (
            <AssignedScheduleTable rows={rows} />
          ) : variant === 'gemini' ? (
            <GeminiAssignedInstitutionTable rows={rows} />
          ) : (
            <AssignedInstitutionTable rows={rows} />
          )
        ) : (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
            {assignedEmptyText}
          </PFText>
        )}
      </div>
      {/* 배정 대기 API 없음 — 서버 waiting items가 있을 때만 노출. 빈 목록으로 대기를 추론하지 않는다. */}
      {waitingRows.length > 0 ? (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {waitingTitle} <span>{waitingRows.length}건</span>
          </h2>
          {individual ? (
            <WaitingScheduleTable rows={waitingRows} />
          ) : (
            <WaitingInstitutionTable rows={waitingRows} />
          )}
        </div>
      ) : null}
    </section>
  )
}
