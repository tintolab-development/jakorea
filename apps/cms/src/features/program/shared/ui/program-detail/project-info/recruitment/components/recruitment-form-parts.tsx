import { Fragment } from 'react'
import {
  Controller,
  type FieldPath,
  type PathValue,
  type UseFormReturn,
} from 'react-hook-form'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  formatDateWithOptionalTime,
  formatDateRange,
  INTERVIEW_METHOD_OPTIONS,
} from '@/features/program/shared/lib/program-detail-info-constants'
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
  /** true: 모집 기간 등 — 시간 토글/표시 없이 날짜만 */
  dateOnly = false,
}: {
  form: UseFormReturn<ProgramDetailEditFormValues>
  startName: FieldPath<ProgramDetailEditFormValues>
  endName: FieldPath<ProgramDetailEditFormValues>
  clearToUndefined?: boolean
  dateOnly?: boolean
}) {
  const emit = (d: Dayjs | null) =>
    clearToUndefined ? (d ? d.toISOString() : undefined) : toIso(d)

  return (
    <div className="program-detail-info-tab__date-range">
      <Controller
        name={startName}
        control={form.control}
        render={({ field }) => {
          const start = toDayjs(field.value as string | Date | undefined)
          const end = toDayjs(form.watch(endName) as string | Date | undefined)
          const appliedRange = start && end ? ([start, end] as [Dayjs, Dayjs]) : null
          const appliedWithTime =
            dateOnly
              ? false
              : appliedRange != null
                ? dateRangeUsesClockTime(appliedRange[0], appliedRange[1])
                : false

          return (
            <ParagraphDatePicker inputSize="small"
              mode="single"
              presetMode="period"
              value={start ?? null}
              width="100%"
              className="program-detail-info-tab__date-picker"
              placeholder="기간을 선택하세요"
              preferPeriodModeInPopover
              showTimeToggle={!dateOnly}
              appliedSurfaceRange={appliedRange}
              appliedSurfaceWithTime={appliedWithTime}
              onRangeChange={range => {
                field.onChange(emit(range[0]))
                form.setValue(
                  endName,
                  emit(range[1]) as PathValue<ProgramDetailEditFormValues, typeof endName>,
                  { shouldValidate: true, shouldDirty: true }
                )
              }}
              onChange={next => {
                if (next == null) return
                field.onChange(emit(next))
              }}
            />
          )
        }}
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
  const methodText = method?.trim()
  if (!dateIso) return methodText || '-'
  const dateLabel = formatDateWithOptionalTime(dateIso)
  const methodLabel = methodText || '-'
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
  allowMissingEnd = false,
}: {
  start?: string | Date | null
  end?: string | Date | null
  method?: string | null
  /** 참여자 2차 면접: 종료가 null인 옛 행은 시작일 하루로 표시한다. 봉사자·강사는 기본값(둘 다 있어야 표시). */
  allowMissingEnd?: boolean
}) {
  if (!start) return '-'
  if (!end && !allowMissingEnd) return '-'
  const range = formatDateRange(start, end ?? start)
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
