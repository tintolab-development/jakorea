import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type {
  IndividualPerScheduleTableField,
  IndividualPerScheduleTableRow,
} from '@/features/program/general/lib/individual-per-schedule-table'

export function IndividualPerScheduleExtraRows({
  rows,
  renderField,
}: {
  rows: IndividualPerScheduleTableRow[]
  renderField: (
    field: IndividualPerScheduleTableField,
    options: { fullRow: boolean; layout?: 'default' | 'inline' }
  ) => ReactNode
}) {
  return (
    <>
      {rows.map((row, index) => {
        if (row.type === 'single') {
          return (
            <DetailInfoForm.Row key={`${row.field}-${index}`} type="single">
              {renderField(row.field, { fullRow: true })}
            </DetailInfoForm.Row>
          )
        }
        return (
          <DetailInfoForm.Row key={`${row.left}-${row.right}-${index}`} type="double">
            {renderField(row.left, {
              fullRow: false,
              layout: row.left === 'ips' ? 'inline' : 'default',
            })}
            {renderField(row.right, {
              fullRow: false,
              layout: row.right === 'ips' ? 'inline' : 'default',
            })}
          </DetailInfoForm.Row>
        )
      })}
    </>
  )
}
