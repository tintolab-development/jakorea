import type { ReactNode } from 'react'
import type {
  UjatVolunteerInterviewScheduleCommon,
  UjatVolunteerInterviewScheduleData,
  UjatVolunteerInterviewScheduleException,
} from '@/features/program/ujat/model/ujat-volunteer-interview-schedule'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './ujat-volunteer-interview-schedule-readonly.css'
function displayDatePart(value: string): string {
  const trimmed = value.trim()
  return trimmed === '' || trimmed === '-' ? '' : trimmed
}

function UnavailableDatesCell({
  recurring,
  specific }: {
  recurring: string
  specific: string
}) {
  const recurringLabel = displayDatePart(recurring)
  const specificLabel = displayDatePart(specific)
  if (!recurringLabel && !specificLabel) return <>-</>
  if (!specificLabel) return <>{recurringLabel}</>
  if (!recurringLabel) return <>{specificLabel}</>
  return (
    <span className="ujat-volunteer-interview-schedule-readonly__inline">
      <span>{recurringLabel}</span>
      <DetailInfoForm.InputsSeparator />
      <span>{specificLabel}</span>
    </span>
  )
}
function ScheduleTable({
  rows }: {
  rows: ReadonlyArray<{ label: string; value: ReactNode }>
}) {
  return (
    <div className="program-detail-info-tab__table-wrapper">
      <table className="program-detail-info-tab__table program-detail-info-tab__table--basic ujat-volunteer-interview-schedule-readonly__table">
        <tbody>
          {rows.map(row => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
function CommonScheduleBlock({ common }: { common: UjatVolunteerInterviewScheduleCommon }) {
  return (
    <section className="ujat-volunteer-interview-schedule-readonly__block">
      <h3 className="ujat-volunteer-interview-schedule-readonly__block-title">■ 공통 진행 일정</h3>
      <ScheduleTable
        rows={[
          {
            label: '면접 진행 불가일',
            value: (
              <UnavailableDatesCell
                recurring={common.recurringUnavailable}
                specific={common.specificUnavailableDates}
              />
            ) },
          {
            label: '면접 진행 가능 시간',
            value: common.availableTimeSlots || '-' },
        ]}
      />
    </section>
  )
}
function ExceptionScheduleBlock({
  title,
  exception }: {
  title: string
  exception: UjatVolunteerInterviewScheduleException
}) {
  return (
    <section className="ujat-volunteer-interview-schedule-readonly__block">
      <h3 className="ujat-volunteer-interview-schedule-readonly__block-title">{title}</h3>
      <ScheduleTable
        rows={[
          { label: '예외 진행 일정', value: exception.exceptionDate || '-' },
          {
            label: '면접 진행 가능 시간',
            value: exception.availableTimeSlots || '-' },
        ]}
      />
    </section>
  )
}
export function UjatVolunteerInterviewScheduleReadonly({
  data }: {
  data: UjatVolunteerInterviewScheduleData
}) {
  return (
    <div className="ujat-volunteer-interview-schedule-readonly">
      <CommonScheduleBlock common={data.common} />
      {data.exceptions.map((ex, index) => (
        <ExceptionScheduleBlock
          key={`${ex.exceptionDate}-${index}`}
          title={`■ 예외 일정 ${String(index + 1).padStart(2, '0')}`}
          exception={ex}
        />
      ))}
    </div>
  )
}