import { Fragment, type ReactNode } from 'react'
import { CrossTable } from '@/shared/ui/cross-table'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { UjatInstitutionApplicationClassTimeRowDetail } from '../detail/detail-types'

const CLASS_TIME_PERIOD_HEADERS = ['1교시', '2교시', '3교시', '4교시'] as const

export function PipeSeparatedValues({ parts }: { parts: ReactNode[] }) {
  return (
    <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 ? <DetailInfoForm.InputsSeparator /> : null}
          {part}
        </Fragment>
      ))}
    </div>
  )
}

export function renderCriminalRecordCheckRequest(value: string) {
  const parts = value
    .split('|')
    .map(part => part.trim())
    .filter(Boolean)

  if (parts.length <= 1) return value || '-'

  return (
    <PipeSeparatedValues
      parts={parts.map(part => (
        <span key={part}>{part}</span>
      ))}
    />
  )
}

function classTimePeriodsEqual(
  a: UjatInstitutionApplicationClassTimeRowDetail['periods'],
  b: UjatInstitutionApplicationClassTimeRowDetail['periods']
): boolean {
  return a.every((value, index) => value === b[index])
}

/** 연속된 학년 중 교시별 시간 구성이 같으면 한 행(예: 1학년, 2학년, 3학년)으로 묶는다. */
export function groupClassTimeRowsByPeriods(
  rows: UjatInstitutionApplicationClassTimeRowDetail[]
): UjatInstitutionApplicationClassTimeRowDetail[] {
  return rows.reduce<UjatInstitutionApplicationClassTimeRowDetail[]>((grouped, row) => {
    const last = grouped.at(-1)
    if (last && classTimePeriodsEqual(last.periods, row.periods)) {
      grouped[grouped.length - 1] = {
        gradeRangeLabel: `${last.gradeRangeLabel}, ${row.gradeRangeLabel}`,
        periods: row.periods,
      }
    } else {
      grouped.push({ ...row })
    }
    return grouped
  }, [])
}

export function ClassTimeTable({
  rows,
}: {
  rows: UjatInstitutionApplicationClassTimeRowDetail[]
}) {
  const groupedRows = groupClassTimeRowsByPeriods(rows)

  return (
    <CrossTable
      aria-label="학년 별 수업 시간"
      corner="학년 / 교시"
      columnHeaders={[...CLASS_TIME_PERIOD_HEADERS]}
      rows={groupedRows.map(row => ({
        id: row.gradeRangeLabel,
        rowHeader: row.gradeRangeLabel,
        cells: row.periods,
      }))}
    />
  )
}
