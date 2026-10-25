import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { Program } from '@/types/domain'
import { formatDate } from '@/features/program/shared/lib/program-detail-info-constants'
import { getProgramBusinessPeriodHistories } from '@/features/program/shared/lib/business-period-extend'

function formatDateTime(value: string | null | undefined): string {
  if (!value?.trim()) return '-'
  const date = formatDate(value)
  const timeMatch = value.match(/T(\d{2}:\d{2})/)
  if (date && timeMatch) return `${date} ${timeMatch[1]}`
  return date || '-'
}

export function BusinessPeriodExtendHistoryRows({ program }: { program: Program }) {
  const rows = getProgramBusinessPeriodHistories(program)
  if (rows.length === 0) return null

  return (
    <>
      {rows.map((row, index) => {
        const previous = formatDate(row.previousBusinessEndDate ?? undefined)
        const next = formatDate(row.businessEndDate ?? undefined)
        return (
          <DetailInfoForm.Row key={`${row.changedAt ?? 'history'}-${index}`} type="double">
            <DetailInfoForm.Field
              label="사업 종료일 연장"
              view={`${previous} → ${next}`}
            />
            <DetailInfoForm.Field
              label="연장 사유"
              view={
                <>
                  {row.reason?.trim() || '-'}
                  {row.changedByName ? (
                    <>
                      <DetailInfoForm.InputsSeparator />
                      {row.changedByName}
                    </>
                  ) : null}
                  {row.changedAt ? (
                    <>
                      <DetailInfoForm.InputsSeparator />
                      {formatDateTime(row.changedAt)}
                    </>
                  ) : null}
                </>
              }
            />
          </DetailInfoForm.Row>
        )
      })}
    </>
  )
}
