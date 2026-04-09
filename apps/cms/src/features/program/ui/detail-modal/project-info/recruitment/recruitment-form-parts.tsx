import { Fragment } from 'react'
import {
  Controller,
  type FieldPath,
  type PathValue,
  type UseFormReturn,
} from 'react-hook-form'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { CmsDateRangePicker } from '@/shared/ui/cms-datepicker'
import type { ProgramDetailEditFormValues } from '../../../../model/program-detail-edit-schema'
import {
  formatDateOnly,
  formatDateRange,
  INTERVIEW_METHOD_OPTIONS,
} from '../constants/program-detail-info-constants'
import { DetailInfoForm } from '@/shared/components/detail-info-form'

const toDayjs = (d: string | Date | undefined) => (d ? dayjs(d) : null)
/** 빈 값은 `undefined` 대신 `''` 로 두어 Zod `z.string().min(1)` 과 맞춤 */
const toIso = (d: Dayjs | null) => (d ? d.toISOString() : '')

export function DateRangeEdit({
  form,
  startName,
  endName,
  /** true: 빈 날짜를 `undefined`로 (강사 모집 등). false: `''` (참여자·봉사 운영 기간 등 Zod string) */
  clearToUndefined = false,
}: {
  form: UseFormReturn<ProgramDetailEditFormValues>
  startName: FieldPath<ProgramDetailEditFormValues>
  endName: FieldPath<ProgramDetailEditFormValues>
  clearToUndefined?: boolean
}) {
  const emit = (d: Dayjs | null) =>
    clearToUndefined ? (d ? d.toISOString() : undefined) : toIso(d)

  return (
    <div className="program-detail-info-tab__date-range">
      <Controller
        name={startName}
        control={form.control}
        render={({ field }) => (
          <CmsDateRangePicker
            value={[
              toDayjs(field.value as string | Date | undefined),
              toDayjs(form.watch(endName) as string | Date | undefined),
            ]}
            onChange={dates => {
              const start = dates?.[0] ?? null
              const end = dates?.[1] ?? null
              field.onChange(emit(start))
              form.setValue(
                endName,
                emit(end) as PathValue<ProgramDetailEditFormValues, typeof endName>
              )
            }}
            format="YYYY. MM. DD"
            width="100%"
            className="program-detail-info-tab__date-picker"
          />
        )}
      />
    </div>
  )
}

export function ProgramDetailDateMethodReadRow({
  dateIso,
  method,
}: {
  dateIso?: string | Date | null
  method?: string | null
}) {
  if (!dateIso) return '-'
  const dateLabel = formatDateOnly(dateIso)
  const methodLabel = method?.trim() ? method.trim() : '-'
  return (
    <div className="program-detail-info-tab__contact-inline">
      <span>{dateLabel}</span>
      <DetailInfoForm.InputsSeparator />
      <span>{methodLabel}</span>
    </div>
  )
}

export function ProgramDetailInterviewReadRow({
  start,
  end,
  method,
}: {
  start?: string | Date | null
  end?: string | Date | null
  method?: string | null
}) {
  if (!start || !end) return '-'
  const range = formatDateRange(start, end)
  const raw = method?.trim()
  const methodLabel = raw
    ? (INTERVIEW_METHOD_OPTIONS.find(o => o.value === raw)?.label ?? raw)
    : '-'
  return (
    <div className="program-detail-info-tab__contact-inline">
      <span>{range}</span>
      <DetailInfoForm.InputsSeparator />
      <span>{methodLabel}</span>
    </div>
  )
}

export function ProgramDetailContactReadRow({
  contactName,
  contactPhone,
  contactEmail,
  padEmptySegments,
}: {
  contactName?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
  /** true면 문의처·Tel·E-mail 세 칸을 항상 노출하고 빈 값은 '-' */
  padEmptySegments?: boolean
}) {
  if (padEmptySegments) {
    const segments = [
      `문의처 : ${contactName?.trim() || '-'}`,
      `Tel : ${contactPhone?.trim() || '-'}`,
      `E-mail : ${contactEmail?.trim() || '-'}`,
    ]
    return (
      <div className="program-detail-info-tab__contact-inline">
        {segments.map((text, i) => (
          <Fragment key={i}>
            {i > 0 ? <DetailInfoForm.InputsSeparator /> : null}
            <span>{text}</span>
          </Fragment>
        ))}
      </div>
    )
  }

  const segments: string[] = []
  if (contactName?.trim()) segments.push(`문의처 : ${contactName.trim()}`)
  if (contactPhone?.trim()) segments.push(`Tel : ${contactPhone.trim()}`)
  if (contactEmail?.trim()) segments.push(`E-mail : ${contactEmail.trim()}`)

  if (segments.length === 0) return '-'

  return (
    <div className="program-detail-info-tab__contact-inline">
      {segments.map((text, i) => (
        <Fragment key={`${i}-${text}`}>
          {i > 0 ? <DetailInfoForm.InputsSeparator /> : null}
          <span>{text}</span>
        </Fragment>
      ))}
    </div>
  )
}
