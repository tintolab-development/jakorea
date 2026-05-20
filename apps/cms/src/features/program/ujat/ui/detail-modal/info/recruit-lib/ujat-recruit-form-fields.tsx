import { useMemo, useState, type CSSProperties } from 'react'
import {
  Controller,
  type FieldPath,
  type PathValue,
  type UseFormReturn,
} from 'react-hook-form'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import '@/features/template/ui/form-editor/form-editor.css'
export const UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS = 'detail-info-form-inputs-wrapper-no-gap'
export const UJAT_RECRUIT_PROGRESS_HINT = '일정에 따라 진행 현황이 자동으로 반영됩니다.'
const inquiryColumnStyle: CSSProperties = {
  display: 'flex',
  minWidth: 0,
  alignItems: 'center',
  gap: 8 }
export function UjatRecruitInquiryContactField({
  label,
  placeholder,
  value,
  onChange }: {
  label: string
  placeholder: string
  value?: string
  onChange?: (next: string) => void
}) {
  return (
    <div style={inquiryColumnStyle}>
      <span className="nowrap" style={{ flexShrink: 0 }}>
        {label}
      </span>
      <CmsInput
        inputSize="medium"
        width={240}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={e => onChange?.(e.target.value)}
      />
    </div>
  )
}
const toDayjs = (iso: string | undefined) => {
  if (!iso?.trim()) return null
  const d = dayjs(iso)
  return d.isValid() ? d : null
}
const toIso = (d: Dayjs | null, clearToUndefined: boolean) =>
  clearToUndefined ? (d ? d.toISOString() : undefined) : d ? d.toISOString() : ''
export function UjatRecruitFormPeriodDatePicker({
  form,
  startName,
  endName,
  placeholder,
  clearToUndefined = false }: {
  form: UseFormReturn<ProgramDetailEditFormValues>
  startName: FieldPath<ProgramDetailEditFormValues>
  endName: FieldPath<ProgramDetailEditFormValues>
  placeholder?: string
  clearToUndefined?: boolean
}) {
  const startIso = form.watch(startName) as string | undefined
  const endIso = form.watch(endName) as string | undefined
  const appliedSurfaceRange = useMemo((): [Dayjs, Dayjs] | null => {
    const start = toDayjs(startIso)
    const end = toDayjs(endIso)
    if (start && end) return [start, end]
    return null
  }, [startIso, endIso])
  const [anchor, setAnchor] = useState<Dayjs | null>(() => appliedSurfaceRange?.[0] ?? null)
  const rangeWithTime = useMemo(
    () =>
      appliedSurfaceRange == null
        ? false
        : dateRangeUsesClockTime(appliedSurfaceRange[0], appliedSurfaceRange[1]),
    [appliedSurfaceRange]
  )
  const emit = (d: Dayjs | null) => toIso(d, clearToUndefined)
  return (
    <ParagraphDatePicker
      mode="single"
      presetMode="period"
      value={anchor}
      width="100%"
      placeholder={placeholder}
      preferPeriodModeInPopover
      appliedSurfaceRange={appliedSurfaceRange}
      appliedSurfaceWithTime={rangeWithTime}
      onRangeChange={range => {
        form.setValue(startName, emit(range[0]) as PathValue<ProgramDetailEditFormValues, typeof startName>, {
          shouldDirty: true })
        form.setValue(endName, emit(range[1]) as PathValue<ProgramDetailEditFormValues, typeof endName>, {
          shouldDirty: true })
        setAnchor(range[0])
      }}
      onChange={next => {
        if (next == null) return
        setAnchor(next)
      }}
    />
  )
}
export function UjatRecruitFormSingleDatePicker({
  form,
  name,
  placeholder,
  clearToUndefined = true,
  style }: {
  form: UseFormReturn<ProgramDetailEditFormValues>
  name: FieldPath<ProgramDetailEditFormValues>
  placeholder?: string
  clearToUndefined?: boolean
  style?: CSSProperties
}) {
  const iso = form.watch(name) as string | undefined
  const value = toDayjs(iso)
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => (
        <ParagraphDatePicker
          mode="single"
          presetMode="date"
          style={style}
          value={value}
          placeholder={placeholder}
          suppressAutoTodayWhenEmpty
          onChange={next => {
            field.onChange(
              toIso(next, clearToUndefined) as PathValue<ProgramDetailEditFormValues, typeof name>
            )
          }}
        />
      )}
    />
  )
}
export function UjatRecruitFormDateMethodRow({
  form,
  dateName,
  methodName,
  datePlaceholder = '합격자 발표일',
  methodPlaceholder = '발표 방법 안내' }: {
  form: UseFormReturn<ProgramDetailEditFormValues>
  dateName: FieldPath<ProgramDetailEditFormValues>
  methodName: FieldPath<ProgramDetailEditFormValues>
  datePlaceholder?: string
  methodPlaceholder?: string
}) {
  return (
    <div className={UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS}>
      <UjatRecruitFormSingleDatePicker
        form={form}
        name={dateName}
        placeholder={datePlaceholder}
        clearToUndefined={false}
        style={{ flex: '1 1 0', minWidth: 0 }}
      />
      <DetailInfoForm.InputsSeparator />
      <Controller
        name={methodName}
        control={form.control}
        render={({ field }) => (
          <CmsInput
            {...field}
            value={(field.value as string | undefined) ?? ''}
            inputSize="medium"
            style={{ flex: '1 1 0', minWidth: 0 }}
            placeholder={methodPlaceholder}
          />
        )}
      />
    </div>
  )
}