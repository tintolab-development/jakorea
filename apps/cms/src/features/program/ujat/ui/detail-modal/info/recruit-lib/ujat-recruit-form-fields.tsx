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
import { DividerVertical } from '@/shared/components/divider-vertical'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import { INTERVIEW_METHOD_OPTIONS } from '@/features/program/shared/lib/program-detail-info-constants'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
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
  style,
  className,
  width }: {
  form: UseFormReturn<ProgramDetailEditFormValues>
  name: FieldPath<ProgramDetailEditFormValues>
  placeholder?: string
  clearToUndefined?: boolean
  style?: CSSProperties
  className?: string
  width?: number | string
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
          className={className}
          width={width}
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
    <div className="program-detail-info-tab__result-row">
      <UjatRecruitFormSingleDatePicker
        form={form}
        name={dateName}
        placeholder={datePlaceholder}
        clearToUndefined={false}
        width={240}
      />
      <DividerVertical height={13} className="program-detail-info-tab__result-row-divider" />
      <Controller
        name={methodName}
        control={form.control}
        render={({ field }) => (
          <CmsInput
            {...field}
            value={(field.value as string | undefined) ?? ''}
            inputSize="medium"
            className="program-detail-info-tab__result-method-input"
            placeholder={methodPlaceholder}
          />
        )}
      />
    </div>
  )
}

const UJAT_VOLUNTEER_INTERVIEW_METHOD_OPTIONS = INTERVIEW_METHOD_OPTIONS.filter(
  o => o.value === '온라인' || o.value === '오프라인'
)

export function UjatRecruitFormInterviewPeriodRow({
  form,
  startName,
  endName,
  methodName,
  periodPlaceholder = '면접 기간을 선택하세요',
  methodPlaceholder = '면접 유형',
  clearToUndefined = true,
}: {
  form: UseFormReturn<ProgramDetailEditFormValues>
  startName: FieldPath<ProgramDetailEditFormValues>
  endName: FieldPath<ProgramDetailEditFormValues>
  methodName: FieldPath<ProgramDetailEditFormValues>
  periodPlaceholder?: string
  methodPlaceholder?: string
  clearToUndefined?: boolean
}) {
  return (
    <div className="program-detail-info-tab__result-row">
      <div style={{ flex: '1 1 190px', minWidth: 0, width: '100%' }}>
        <UjatRecruitFormPeriodDatePicker
          form={form}
          startName={startName}
          endName={endName}
          placeholder={periodPlaceholder}
          clearToUndefined={clearToUndefined}
        />
      </div>
      <DividerVertical height={13} className="program-detail-info-tab__result-row-divider" />
      <Controller
        name={methodName}
        control={form.control}
        render={({ field }) => (
          <CmsSelect
            inputSize="medium"
            className="program-detail-info-tab__select--interview-method"
            placeholder={methodPlaceholder}
            value={(field.value as string | undefined) ?? undefined}
            options={[...UJAT_VOLUNTEER_INTERVIEW_METHOD_OPTIONS]}
            onChange={v => field.onChange(v ?? undefined)}
          />
        )}
      />
    </div>
  )
}

export function UjatRecruitVolunteerNotesField({
  form,
}: {
  form: UseFormReturn<ProgramDetailEditFormValues>
}) {
  const notApplicable = form.watch('volunteerRecruitmentNotesNotApplicable') === 'not_applicable'

  return (
    <div className={UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS}>
      <Controller
        name="volunteerRecruitmentNotesNotApplicable"
        control={form.control}
        render={({ field }) => (
          <CmsCheckbox
            checkboxSize="medium"
            checked={field.value === 'not_applicable'}
            onChange={e => {
              const checked = e.target.checked
              field.onChange(checked ? 'not_applicable' : 'applicable')
              if (checked) {
                form.setValue('otherNotes', undefined, { shouldDirty: true })
              }
            }}
          >
            해당 없음
          </CmsCheckbox>
        )}
      />
      <DetailInfoForm.InputsSeparator />
      <Controller
        name="otherNotes"
        control={form.control}
        render={({ field }) => (
          <CmsInput
            {...field}
            value={field.value ?? ''}
            disabled={notApplicable}
            inputSize="medium"
            style={{ flex: '1 1 0', minWidth: 0 }}
            placeholder="비고란을 작성하세요"
          />
        )}
      />
    </div>
  )
}

export function UjatRecruitParticipantNotesField({
  form,
}: {
  form: UseFormReturn<ProgramDetailEditFormValues>
}) {
  const notApplicable = form.watch('participantRecruitmentNotesNotApplicable') === 'not_applicable'

  return (
    <div className={UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS}>
      <Controller
        name="participantRecruitmentNotesNotApplicable"
        control={form.control}
        render={({ field }) => (
          <CmsCheckbox
            checkboxSize="medium"
            checked={field.value === 'not_applicable'}
            onChange={e => {
              const checked = e.target.checked
              field.onChange(checked ? 'not_applicable' : 'applicable')
              if (checked) {
                form.setValue('oneLineIntroduction', '', { shouldDirty: true })
              }
            }}
          >
            해당 없음
          </CmsCheckbox>
        )}
      />
      <DetailInfoForm.InputsSeparator />
      <Controller
        name="oneLineIntroduction"
        control={form.control}
        render={({ field }) => (
          <CmsInput
            {...field}
            value={field.value ?? ''}
            disabled={notApplicable}
            inputSize="medium"
            style={{ flex: '1 1 0', minWidth: 0 }}
            placeholder="비고란을 작성하세요"
          />
        )}
      />
    </div>
  )
}