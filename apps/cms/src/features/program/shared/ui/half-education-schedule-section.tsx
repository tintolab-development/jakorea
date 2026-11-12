/**
 * 상·하반기 교육 일정 블록 — 등록 양식·프로그램 상세 공통
 */
import { useEffect, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import {
  PRE_EDUCATION_DISPLAY_LABEL,
  PRE_EDUCATION_HEADING_LABEL,
} from '@/features/program/general/lib/schedule-detail-form'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import {
  type UjatEducationDelivery,
  type UjatHalfSemesterKey,
} from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import type { UjatHalfScheduleTableRow } from '@/features/program/ujat/lib/ujat-half-education-schedule-display'
import {
  resolveUjatHalfEducationScheduleDisplayFromTypedDetail,
} from '@/features/program/ujat/lib/ujat-half-education-schedule-display'
import type {
  UjatTypedDetail,
  UjatTypedEducationStagePlan,
  UjatTypedHalfPlan,
  UjatTypedScheduleRow,
} from '@/features/program/ujat/api/typed-detail-client'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsCircleAddButton } from '@/shared/ui/cms-circle-add-button'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import { fetchAllMembersPagesRemote } from '@/features/user/api/fetch-all-members-pages-remote'
import { instructorListRolesExactAnyOf } from '@/features/user/api/map-roles-exact-any-of'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import './half-education-schedule-section.css'

/**
 * 진행 일정 조회 텍스트.
 * `\n` 다중 행을 fragment+span으로 나누면 `.detail-info-form__field-content`(display:flex)
 * 직계 자식이 가로로 나열되어 일정이 옆으로 붙는다 → 단일 래퍼 + pre-line 로 세로 유지.
 */
function ScheduleTextView({ text }: { text: string }) {
  if (!text || text === '-') return <>-</>
  return <span className="half-education-schedule__schedule-text">{text}</span>
}

function HalfEducationScheduleSubheading({ children }: { children: string }) {
  return <div className="half-education-schedule__subheading">{children}</div>
}
type UjatScheduleForm = Pick<UseFormReturn<UjatTypedDetail>, 'control' | 'getValues' | 'setValue'>

function semesterForHalf(half: UjatHalfSemesterKey): 'FIRST_HALF' | 'SECOND_HALF' {
  return half === 'h1' ? 'FIRST_HALF' : 'SECOND_HALF'
}

function stageForSection(
  section: 'pre' | 'event' | 'closing'
): 'PRE_EDUCATION' | 'MAIN_EDUCATION' | 'POST_EDUCATION' {
  return section === 'pre'
    ? 'PRE_EDUCATION'
    : section === 'event'
      ? 'MAIN_EDUCATION'
      : 'POST_EDUCATION'
}

function typedRowsFor(
  detail: UjatTypedDetail | undefined,
  half: UjatHalfSemesterKey,
  section: 'pre' | 'event' | 'closing'
): UjatTypedScheduleRow[] {
  return (
    detail?.halfPlans
      ?.find(item => item.semesterType === semesterForHalf(half))
      ?.stages?.find(item => item.stage === stageForSection(section))?.rows ?? []
  )
}

function updateTypedRows(
  form: UjatScheduleForm,
  half: UjatHalfSemesterKey,
  section: 'pre' | 'event' | 'closing',
  updater: (rows: UjatTypedScheduleRow[]) => UjatTypedScheduleRow[]
) {
  const current = form.getValues()
  const halfPlans = [...(current.halfPlans ?? [])]
  const semesterType = semesterForHalf(half)
  const halfIndex = halfPlans.findIndex(item => item.semesterType === semesterType)
  const halfPlan: UjatTypedHalfPlan =
    halfIndex >= 0
      ? { ...(halfPlans[halfIndex] ?? {}), semesterType }
      : { semesterType, stages: [] }
  const stages = [...(halfPlan.stages ?? [])]
  const stage = stageForSection(section)
  const stageIndex = stages.findIndex(item => item.stage === stage)
  const nextStage: UjatTypedEducationStagePlan = {
    ...(stageIndex >= 0 ? stages[stageIndex] : {}),
    stage,
    rows: updater(stageIndex >= 0 ? stages[stageIndex]?.rows ?? [] : []),
  }
  if (stageIndex >= 0) stages[stageIndex] = nextStage
  else stages.push(nextStage)
  halfPlan.stages = stages
  if (halfIndex >= 0) halfPlans[halfIndex] = halfPlan
  else halfPlans.push(halfPlan)
  form.setValue('halfPlans', halfPlans, { shouldDirty: true, shouldTouch: true })
}

function newTypedScheduleRow(half: UjatHalfSemesterKey, section: 'pre' | 'event' | 'closing', order: number): UjatTypedScheduleRow {
  const randomId = globalThis.crypto?.randomUUID?.()
  return {
    rowId: randomId ?? `${half}-${section}-${order}`,
    displayOrder: order,
    educationName: section === 'pre' ? '사전교육(발대식)' : section === 'event' ? '교육 진행' : '해단식',
    educationMethod: section === 'event' ? 'offline' : 'online',
    regionCode: null,
    startDate: null,
    endDate: null,
    dates: [],
    scheduleIds: [],
    textbook: null,
    excludedDates: [],
    exclusion: null,
  }
}

function TypedRegionDateMultiScheduleRows({
  half,
  section,
  form,
  detail,
}: {
  half: UjatHalfSemesterKey
  section: 'pre' | 'closing'
  form: UjatScheduleForm
  detail: UjatTypedDetail | undefined
}) {
  const { regions } = useUjatEducationRegions()
  const rows = typedRowsFor(detail, half, section)
  const visibleRows = rows.length > 0 ? rows : [newTypedScheduleRow(half, section, 1)]

  const updateRow = (rowId: string, patch: Partial<UjatTypedScheduleRow>) => {
    updateTypedRows(form, half, section, current => {
      const source = current.length > 0 ? current : visibleRows
      return source.map(row => (row.rowId === rowId ? { ...row, ...patch } : row))
    })
  }

  return (
    <div className="half-education-schedule__schedule-rows">
      {visibleRows.map((row, index) => (
        <div key={row.rowId ?? index} className="detail-info-form-inputs-wrapper half-education-schedule__schedule-row">
          <CmsSelect
            inputSize="small"
            placeholder="교육 지역을 선택해 주세요"
            options={regions.map(region => ({ label: region.label, value: region.key }))}
            value={row.regionCode ?? undefined}
            onChange={value => updateRow(String(row.rowId), { regionCode: value == null ? null : String(value) })}
            style={{ width: 360 }}
          />
          <DetailInfoForm.InputsSeparator />
          <ParagraphDatePicker
            inputSize="small"
            mode="single"
            presetMode="schedule"
            customizable={false}
            suppressAutoTodayWhenEmpty
            placeholder="일정을 선택해 주세요"
            value={row.startDate ? dayjs(row.startDate) : null}
            onChange={next => {
              const iso = next?.format('YYYY-MM-DD') ?? null
              updateRow(String(row.rowId), { startDate: iso, endDate: iso, dates: iso ? [iso] : [] })
            }}
            width={360}
          />
          {index === 0 ? (
            <AddScheduleRowButton
              onClick={() =>
                updateTypedRows(form, half, section, current => [
                  ...(current.length > 0 ? current : visibleRows),
                  newTypedScheduleRow(half, section, (current.length || visibleRows.length) + 1),
                ])
              }
            />
          ) : (
            <ItemDeleteButton
              className="item-delete-button"
              aria-label="진행 일정 행 삭제"
              onClick={event => {
                event.stopPropagation()
                updateTypedRows(form, half, section, current =>
                  current.filter(item => item.rowId !== row.rowId).map((item, itemIndex) => ({
                    ...item,
                    displayOrder: itemIndex + 1,
                  }))
                )
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function TypedScheduleEducationRadioRow({
  half,
  section,
  form,
  detail,
  initial,
}: {
  half: UjatHalfSemesterKey
  section: 'pre' | 'event' | 'closing'
  form: UjatScheduleForm
  detail: UjatTypedDetail | undefined
  initial: UjatEducationDelivery
}) {
  const rows = typedRowsFor(detail, half, section)
  const value = rows[0]?.educationMethod === 'online' || rows[0]?.educationMethod === 'hybrid' || rows[0]?.educationMethod === 'offline'
    ? rows[0].educationMethod
    : initial
  return (
    <CmsRadioGroup
      size="medium"
      value={value}
      onChange={event => updateTypedRows(form, half, section, current => {
        const source = current.length > 0 ? current : [newTypedScheduleRow(half, section, 1)]
        return source.map(row => ({ ...row, educationMethod: event.target.value }))
      })}
    >
      <CmsRadio size="medium" value="online">온라인</CmsRadio>
      <CmsRadio size="medium" value="offline">오프라인</CmsRadio>
      <CmsRadio size="medium" value="hybrid">온/오프라인</CmsRadio>
    </CmsRadioGroup>
  )
}

function TypedScheduleNameField({
  half,
  section,
  form,
  detail,
  fallback,
}: {
  half: UjatHalfSemesterKey
  section: 'pre' | 'event' | 'closing'
  form: UjatScheduleForm
  detail: UjatTypedDetail | undefined
  fallback: string
}) {
  const rows = typedRowsFor(detail, half, section)
  const value = rows[0]?.educationName ?? fallback
  return (
    <CmsInput
      inputSize="small"
      width="100%"
      value={value}
      onChange={event => updateTypedRows(form, half, section, current => {
        const source = current.length > 0 ? current : [newTypedScheduleRow(half, section, 1)]
        return source.map(row => ({ ...row, educationName: event.target.value }))
      })}
    />
  )
}

function TypedTextbookEducationField({
  half,
  form,
  detail,
}: {
  half: UjatHalfSemesterKey
  form: UjatScheduleForm
  detail: UjatTypedDetail | undefined
}) {
  const [instructorOptions, setInstructorOptions] = useState<Array<{ value: string; label: string }>>([])
  const rows = typedRowsFor(detail, half, 'pre')
  const mode = rows[0]?.textbook?.provisionMethod === 'instructor_outsource' ? 'instructor_outsource' : 'ja'
  const instructorId = rows[0]?.textbook?.responsiblePerson ?? undefined

  useEffect(() => {
    if (mode !== 'instructor_outsource') return
    let cancelled = false
    void fetchAllMembersPagesRemote({ rolesExactAnyOf: instructorListRolesExactAnyOf() })
      .then(users => {
        if (cancelled) return
        setInstructorOptions(users.map(user => ({ value: String(user.id), label: user.name.trim() })).filter(option => option.value && option.label))
      })
      .catch(() => {
        if (!cancelled) setInstructorOptions([])
      })
    return () => { cancelled = true }
  }, [mode])

  const setTextbook = (patch: { provisionMethod?: string | null; responsiblePerson?: string | null }) =>
    updateTypedRows(form, half, 'pre', current => {
      const source = current.length > 0 ? current : [newTypedScheduleRow(half, 'pre', 1)]
      return source.map(row => ({ ...row, textbook: { ...(row.textbook ?? {}), ...patch } }))
    })

  return (
    <div className="detail-info-form-inputs-wrapper half-education-schedule__textbook-row">
      <CmsRadioGroup size="medium" value={mode} onChange={event => {
        const next = event.target.value
        setTextbook({ provisionMethod: next, ...(next === 'ja' ? { responsiblePerson: null } : {}) })
      }}>
        <CmsRadio size="medium" value="ja">JA 진행</CmsRadio>
        <CmsRadio size="medium" value="instructor_outsource">강사 섭외</CmsRadio>
      </CmsRadioGroup>
      {mode === 'instructor_outsource' ? (
        <>
          <DetailInfoForm.InputsSeparator />
          <CmsSelect inputSize="small" showSearch optionFilterProp="label" placeholder="교재 교육 강사를 선택해 주세요" style={{ minWidth: 200, flex: 1 }} options={instructorOptions} value={instructorId} onChange={value => setTextbook({ responsiblePerson: value == null || value === '' ? null : String(value) })} />
        </>
      ) : null}
    </div>
  )
}

function TypedEventRangeField({
  half,
  form,
  detail,
}: {
  half: UjatHalfSemesterKey
  form: UjatScheduleForm
  detail: UjatTypedDetail | undefined
}) {
  const row = typedRowsFor(detail, half, 'event')[0]
  const range: [Dayjs | null, Dayjs | null] = [
    row?.startDate ? dayjs(row.startDate) : null,
    row?.endDate ? dayjs(row.endDate) : null,
  ]
  return (
    <ParagraphDatePicker
      inputSize="small"
      mode="range"
      value={range}
      onChange={next => updateTypedRows(form, half, 'event', current => {
        const source = current.length > 0 ? current : [newTypedScheduleRow(half, 'event', 1)]
        return source.map((item, index) => index === 0 ? {
          ...item,
          startDate: next[0]?.format('YYYY-MM-DD') ?? null,
          endDate: next[1]?.format('YYYY-MM-DD') ?? null,
          dates: next[0] ? [next[0].format('YYYY-MM-DD')] : [],
        } : item)
      })}
      placeholder={['교육 진행 일정을 선택해 주세요', '교육 진행 일정을 선택해 주세요']}
      className="half-education-schedule__range-picker"
    />
  )
}

function AddScheduleRowButton({ onClick }: { onClick: () => void }) {
  return (
    <CmsCircleAddButton
      className="half-education-schedule__add-row-button"
      aria-label="진행 일정 행 추가"
      onClick={e => {
        e.stopPropagation()
        onClick()
      }}
    />
  )
}

function UjatPreEducationBlock({
  half,
  mode,
  viewRow,
  scheduleForm,
  typedDetail,
}: {
  half: UjatHalfSemesterKey
  mode: 'view' | 'edit'
  viewRow: UjatHalfScheduleTableRow
  scheduleForm?: UjatScheduleForm
  typedDetail?: UjatTypedDetail
}) {
  return (
    <div className="half-education-schedule__block half-education-schedule__block--first">
      <HalfEducationScheduleSubheading>{`■ ${PRE_EDUCATION_HEADING_LABEL}`}</HalfEducationScheduleSubheading>
      <DetailInfoForm
        title={PRE_EDUCATION_DISPLAY_LABEL}
        hideHeader
        mode={mode}
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="일정명"
            validationKey={`${half}.pre.name`}
            view={viewRow.scheduleName}
            edit={mode === 'edit' && scheduleForm ? (
              <TypedScheduleNameField
                half={half}
                section="pre"
                form={scheduleForm}
                detail={typedDetail}
                fallback="사전교육(발대식)"
              />
            ) : undefined}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="진행 일정"
            validationKey={`${half}.pre.schedule`}
            fullRow
            view={<ScheduleTextView text={viewRow.scheduleText} />}
            edit={mode === 'edit' && scheduleForm ? (
              <TypedRegionDateMultiScheduleRows
                half={half}
                section="pre"
                form={scheduleForm}
                detail={typedDetail}
              />
            ) : undefined}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 형태"
            view={viewRow.deliveryLabel}
            edit={mode === 'edit' && scheduleForm ? (
              <TypedScheduleEducationRadioRow
                half={half}
                section="pre"
                form={scheduleForm}
                detail={typedDetail}
                initial="online"
              />
            ) : undefined}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교재 교육"
            view={viewRow.textbookEducationLabel ?? '-'}
            edit={mode === 'edit' && scheduleForm ? (
              <TypedTextbookEducationField half={half} form={scheduleForm} detail={typedDetail} />
            ) : undefined}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}

function UjatEventScheduleBlock({
  half,
  mode,
  viewRow,
  scheduleForm,
  typedDetail,
}: {
  half: UjatHalfSemesterKey
  mode: 'view' | 'edit'
  viewRow: UjatHalfScheduleTableRow
  scheduleForm?: UjatScheduleForm
  typedDetail?: UjatTypedDetail
}) {
  return (
    <div className="half-education-schedule__block">
      <HalfEducationScheduleSubheading>■ 행사 일정</HalfEducationScheduleSubheading>
      <DetailInfoForm
        title="행사 일정"
        hideHeader
        mode={mode}
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="일정명"
            validationKey={`${half}.event.name`}
            view={viewRow.scheduleName}
            edit={mode === 'edit' && scheduleForm ? (
              <TypedScheduleNameField
                half={half}
                section="event"
                form={scheduleForm}
                detail={typedDetail}
                fallback="교육 진행"
              />
            ) : undefined}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="진행 일정"
            validationKey={`${half}.event.range`}
            view={<ScheduleTextView text={viewRow.scheduleText} />}
            edit={mode === 'edit' && scheduleForm ? (
              <TypedEventRangeField half={half} form={scheduleForm} detail={typedDetail} />
            ) : undefined}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 형태"
            view={viewRow.deliveryLabel}
            edit={mode === 'edit' && scheduleForm ? (
              <TypedScheduleEducationRadioRow
                half={half}
                section="event"
                form={scheduleForm}
                detail={typedDetail}
                initial="offline"
              />
            ) : undefined}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}

function UjatClosingCeremonyBlock({
  half,
  mode,
  viewRow,
  scheduleForm,
  typedDetail,
}: {
  half: UjatHalfSemesterKey
  mode: 'view' | 'edit'
  viewRow: UjatHalfScheduleTableRow
  scheduleForm?: UjatScheduleForm
  typedDetail?: UjatTypedDetail
}) {
  return (
    <div className="half-education-schedule__block">
      <HalfEducationScheduleSubheading>■ 해단식</HalfEducationScheduleSubheading>
      <DetailInfoForm
        title="해단식"
        hideHeader
        mode={mode}
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="일정명"
            view={viewRow.scheduleName}
            edit={mode === 'edit' && scheduleForm ? (
              <TypedScheduleNameField
                half={half}
                section="closing"
                form={scheduleForm}
                detail={typedDetail}
                fallback="해단식"
              />
            ) : undefined}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="진행 일정"
            validationKey={`${half}.closing.multi`}
            fullRow
            view={<ScheduleTextView text={viewRow.scheduleText} />}
            edit={mode === 'edit' && scheduleForm ? (
              <TypedRegionDateMultiScheduleRows
                half={half}
                section="closing"
                form={scheduleForm}
                detail={typedDetail}
              />
            ) : undefined}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 형태"
            view={viewRow.deliveryLabel}
            edit={mode === 'edit' && scheduleForm ? (
              <TypedScheduleEducationRadioRow
                half={half}
                section="closing"
                form={scheduleForm}
                detail={typedDetail}
                initial="online"
              />
            ) : undefined}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}

type HalfEducationScheduleSectionProps = {
  half: UjatHalfSemesterKey
  mode: 'view' | 'edit'
  display: import('@/features/program/ujat/lib/ujat-half-education-schedule-display').UjatHalfEducationScheduleDisplay
  scheduleForm?: UseFormReturn<UjatTypedDetail>
}

function HalfEducationScheduleTypedSection({
  half,
  mode,
  scheduleForm,
}: Required<Pick<HalfEducationScheduleSectionProps, 'half' | 'mode' | 'scheduleForm'>>) {
  const typedDetail = useWatch({ control: scheduleForm.control }) as UjatTypedDetail | undefined
  const typedDisplay = resolveUjatHalfEducationScheduleDisplayFromTypedDetail(typedDetail, half)
  return (
    <div className="half-education-schedule-section">
      <UjatPreEducationBlock half={half} mode={mode} viewRow={typedDisplay.preEducation} scheduleForm={scheduleForm} typedDetail={typedDetail} />
      <UjatEventScheduleBlock half={half} mode={mode} viewRow={typedDisplay.eventSchedule} scheduleForm={scheduleForm} typedDetail={typedDetail} />
      <UjatClosingCeremonyBlock half={half} mode={mode} viewRow={typedDisplay.closingCeremony} scheduleForm={scheduleForm} typedDetail={typedDetail} />
    </div>
  )
}

function HalfEducationScheduleLegacySection({ half, mode, display }: Omit<HalfEducationScheduleSectionProps, 'scheduleForm'>) {
  return (
    <div className="half-education-schedule-section">
      <UjatPreEducationBlock half={half} mode={mode} viewRow={display.preEducation} />
      <UjatEventScheduleBlock half={half} mode={mode} viewRow={display.eventSchedule} />
      <UjatClosingCeremonyBlock half={half} mode={mode} viewRow={display.closingCeremony} />
    </div>
  )
}

export function HalfEducationScheduleSection({
  half,
  mode,
  display,
  scheduleForm,
}: HalfEducationScheduleSectionProps) {
  if (scheduleForm) {
    return <HalfEducationScheduleTypedSection half={half} mode={mode} scheduleForm={scheduleForm} />
  }
  return <HalfEducationScheduleLegacySection half={half} mode={mode} display={display} />
}
