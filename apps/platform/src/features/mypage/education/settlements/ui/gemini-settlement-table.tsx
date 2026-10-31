import {
  formatGeminiWon,
  type GeminiLectureScheduleItem,
} from '../lib/gemini-settlement-status'
import { formatDisplayDate } from '@/shared/lib/format-display-date'
import { PFText } from '@/shared/ui'
import styles from './gemini-settlement-table.module.css'

type GeminiSettlementTableProps = {
  /** GET .../gemini-lecture-schedules items (서버 순서 그대로) */
  rows: readonly GeminiLectureScheduleItem[]
}

const MISSING = '-'

function textOrDash(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ''
  return trimmed || MISSING
}

function hhmm(value: string | null | undefined): string {
  return value?.trim().slice(0, 5) ?? ''
}

/** Figma 11001-287012: `2026년 01월 09일(금) 10:00~11:20 | 3차시` */
function formatScheduleLine(row: GeminiLectureScheduleItem): string {
  const date = formatDisplayDate(row.trainingDate ?? row.startAt ?? null)
  const start = hhmm(row.trainingStartTime)
  const end = hhmm(row.trainingEndTime)
  const time = row.trainingTimeText?.trim() || (start && end ? `${start}~${end}` : start || end)
  const count =
    typeof row.recognizedClassCount === 'number' && row.recognizedClassCount > 0
      ? `${row.recognizedClassCount}차시`
      : ''
  const head = [date, time].filter(Boolean).join(' ')
  return [head, count].filter(Boolean).join(' | ') || MISSING
}

/**
 * 제미나이 강의현황 상세 > 정산 현황 표 (Figma 11001-286941).
 * 정산 처리 현황 = 행 settlementStatusLabel, 정산 예정 금액 = 행 expectedAmount (없으면 '-').
 * 프로그램 단위 summary.accountPaymentStatus로 행을 채우지 않는다.
 */
export function GeminiSettlementTable({ rows }: GeminiSettlementTableProps) {
  return (
    <section className={styles.section} aria-label="정산 현황">
      <div className={styles.header}>
        <PFText as="h2" typo="hl-sm" color="black" className={styles.count}>
          정산 현황
        </PFText>
        <PFText as="p" typo="bd-md-rg" color="black" className={styles.count}>
          {rows.length}건
        </PFText>
      </div>
      {rows.length === 0 ? (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
          정산 현황이 없어요
        </PFText>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table} aria-label="정산 현황 목록">
            <colgroup>
              <col className={styles.institutionColumn} />
              <col className={styles.gradeColumn} />
              <col />
              <col className={styles.statusColumn} />
              <col className={styles.amountColumn} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">기관명</th>
                <th scope="col">교육 학년</th>
                <th scope="col">교육 진행 일정</th>
                <th scope="col">정산 처리 현황</th>
                <th scope="col">정산 예정 금액</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.scheduleId != null ? String(row.scheduleId) : `gemini-${index}`}>
                  <td>{textOrDash(row.institutionName)}</td>
                  <td>{textOrDash(row.grade)}</td>
                  <td>{formatScheduleLine(row)}</td>
                  <td>
                    <span
                      className={
                        row.accountPaymentStatus?.trim().toUpperCase() === 'PAID'
                          ? styles.statusPaid
                          : undefined
                      }
                    >
                      {textOrDash(row.settlementStatusLabel)}
                    </span>
                  </td>
                  <td>{formatGeminiWon(row.expectedAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
