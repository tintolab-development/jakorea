import { useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { mockInstructors } from '@/data/mock/instructors'
import {
  EMPTY_UJAT_HALF_EVENT_RANGE_SEAL,
  EMPTY_UJAT_HALF_MULTI_SCHEDULE_BUNDLE,
  type UjatEducationDelivery,
  type UjatHalfEventRangeSeal,
  type UjatHalfMultiScheduleBundle,
  type UjatHalfSemesterKey,
  type UjatTextbookEducationMode,
  ujatHalfScheduleOverlayKeys,
} from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import type { UjatHalfScheduleTableRow } from '@/features/program/ujat/lib/ujat-half-education-schedule-display'
import { listUjatInstitutionApplicationRegions } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import {
  updateUjatProgramRegistrationOverlayKey,
  useUjatProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-first-half-education-schedule-paragraph.css'
import './ujat-half-education-schedule.css'

function ScheduleTextView({ text }: { text: string }) {
  if (!text || text === '-') return <>-</>
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 ? <br /> : null}
          {line}
        </span>
      ))}
    </>
  )
}

function UjatHalfEducationScheduleSubheading({ children }: { children: string }) {
  return <div className="ujat-half-education-schedule__subheading">{children}</div>
}
function getUjatTextbookInstructorOptions() {
  return mockInstructors.slice(0, 40).map(instructor => ({
    value: instructor.id,
    label: instructor.name,
  }))
}

function getRowRegionOptions(rowId: number, regionByRow: Record<number, string[]>) {
  const current = new Set(regionByRow[rowId] ?? [])
  const selectedByOtherRows = new Set(
    Object.entries(regionByRow)
      .filter(([key]) => Number(key) !== rowId)
      .flatMap(([, values]) => values ?? [])
  )
  return listUjatInstitutionApplicationRegions()
    .map(r => ({ label: r.label, value: r.key }))
    .filter(option => current.has(option.value) || !selectedByOtherRows.has(option.value))
}

function AddScheduleRowButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="ujat-first-half-schedule__add-row-button"
      aria-label="진행 일정 행 추가"
      onClick={e => {
        e.stopPropagation()
        onClick()
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden
      >
        <rect width="28" height="28" rx="14" fill="white" />
        <rect width="28" height="28" rx="14" fill="#01A1AF" fillOpacity="0.1" />
        <rect
          x="0.5"
          y="0.5"
          width="27"
          height="27"
          rx="13.5"
          stroke="#01A1AF"
          strokeOpacity="0.1"
        />
        <path
          d="M13.5007 19.6654V14.4987H8.33398V13.4987H13.5007V8.33203H14.5007V13.4987H19.6673V14.4987H14.5007V19.6654H13.5007Z"
          fill="#01A1AF"
        />
      </svg>
    </button>
  )
}

function UjatRegionDateMultiScheduleRows({
  half,
  section,
}: {
  half: UjatHalfSemesterKey
  section: 'pre' | 'closing'
}) {
  const keys = ujatHalfScheduleOverlayKeys(half)
  const storageKey = section === 'pre' ? keys.preMulti : keys.closingMulti
  const [bundle] = useUjatProgramRegistrationOverlayKv<UjatHalfMultiScheduleBundle>(
    storageKey,
    EMPTY_UJAT_HALF_MULTI_SCHEDULE_BUNDLE
  )

  const regionByRow = useMemo((): Record<number, string[]> => {
    const o: Record<number, string[]> = {}
    for (const [k, v] of Object.entries(bundle.regionByRow)) {
      o[Number(k)] = v
    }
    return o
  }, [bundle.regionByRow])

  const dateByRow = useMemo((): Record<number, Dayjs | null> => {
    const o: Record<number, Dayjs | null> = {}
    for (const [k, v] of Object.entries(bundle.dateByRow)) {
      o[Number(k)] = v == null ? null : dayjs(v)
    }
    return o
  }, [bundle.dateByRow])

  const rowIds = bundle.rowIds

  const appendRow = () => {
    updateUjatProgramRegistrationOverlayKey<UjatHalfMultiScheduleBundle>(storageKey, prev => {
      const p = prev ?? EMPTY_UJAT_HALF_MULTI_SCHEDULE_BUNDLE
      const nextId = p.rowIds.length === 0 ? 0 : Math.max(...p.rowIds) + 1
      return {
        rowIds: [...p.rowIds, nextId],
        regionByRow: { ...p.regionByRow, [String(nextId)]: [] },
        dateByRow: { ...p.dateByRow, [String(nextId)]: null },
      }
    })
  }

  const removeRow = (id: number) => {
    updateUjatProgramRegistrationOverlayKey<UjatHalfMultiScheduleBundle>(storageKey, prev => {
      const p = prev ?? EMPTY_UJAT_HALF_MULTI_SCHEDULE_BUNDLE
      const nextRegion = { ...p.regionByRow }
      delete nextRegion[String(id)]
      const nextDates = { ...p.dateByRow }
      delete nextDates[String(id)]
      return {
        rowIds: p.rowIds.filter(rid => rid !== id),
        regionByRow: nextRegion,
        dateByRow: nextDates,
      }
    })
  }

  return (
    <div className="ujat-first-half-schedule__schedule-rows">
      {rowIds.map((id, index) => (
        <div
          key={id}
          className="detail-info-form-inputs-wrapper ujat-first-half-schedule__schedule-row"
        >
          <CmsSelect
            mode="multiple"
            withAllOption={false}
            style={{ width: 360 }}
            placeholder="지역을 선택하세요"
            options={getRowRegionOptions(id, regionByRow)}
            value={regionByRow[id] ?? []}
            onChange={next =>
              updateUjatProgramRegistrationOverlayKey<UjatHalfMultiScheduleBundle>(
                storageKey,
                prev => {
                  const p = prev ?? EMPTY_UJAT_HALF_MULTI_SCHEDULE_BUNDLE
                  return {
                    ...p,
                    regionByRow: { ...p.regionByRow, [String(id)]: next as string[] },
                  }
                }
              )
            }
          />
          <DetailInfoForm.InputsSeparator />
          <ParagraphDatePicker
            mode="single"
            presetMode="schedule"
            customizable={false}
            suppressAutoTodayWhenEmpty
            value={dateByRow[id] ?? null}
            onChange={next =>
              updateUjatProgramRegistrationOverlayKey<UjatHalfMultiScheduleBundle>(
                storageKey,
                prev => {
                  const p = prev ?? EMPTY_UJAT_HALF_MULTI_SCHEDULE_BUNDLE
                  return {
                    ...p,
                    dateByRow: {
                      ...p.dateByRow,
                      [String(id)]: next == null ? null : next.toISOString(),
                    },
                  }
                }
              )
            }
            width={360}
          />
          {index === 0 ? (
            <AddScheduleRowButton onClick={appendRow} />
          ) : (
            <ItemDeleteButton
              className="item-delete-button"
              aria-label="진행 일정 행 삭제"
              onClick={event => {
                event.stopPropagation()
                removeRow(id)
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function ScheduleEducationRadioRow({
  half,
  section,
  initial,
}: {
  half: UjatHalfSemesterKey
  section: 'pre' | 'event' | 'closing'
  initial: UjatEducationDelivery
}) {
  const keys = ujatHalfScheduleOverlayKeys(half)
  const storageKey =
    section === 'pre'
      ? keys.preDelivery
      : section === 'event'
        ? keys.eventDelivery
        : keys.closingDelivery
  const [value, setValue] = useUjatProgramRegistrationOverlayKv<UjatEducationDelivery>(
    storageKey,
    initial
  )
  return (
    <CmsRadioGroup
      size="large"
      value={value}
      onChange={e => setValue(e.target.value as UjatEducationDelivery)}
    >
      <CmsRadio value="online">온라인</CmsRadio>
      <CmsRadio value="offline">오프라인</CmsRadio>
      <CmsRadio value="hybrid">온/오프라인</CmsRadio>
    </CmsRadioGroup>
  )
}

function TextbookEducationField({ half }: { half: UjatHalfSemesterKey }) {
  const keys = ujatHalfScheduleOverlayKeys(half)
  const instructorOptions = useMemo(() => getUjatTextbookInstructorOptions(), [])
  const [mode, setMode] = useUjatProgramRegistrationOverlayKv<UjatTextbookEducationMode>(
    keys.preTextbookMode,
    'ja'
  )
  const [instructorId, setInstructorId] = useUjatProgramRegistrationOverlayKv<string | undefined>(
    keys.preTextbookInstructorId,
    undefined
  )

  return (
    <div className="detail-info-form-inputs-wrapper ujat-half-education-schedule__textbook-row">
      <CmsRadioGroup
        size="large"
        value={mode}
        onChange={e => setMode(e.target.value as UjatTextbookEducationMode)}
      >
        <CmsRadio value="ja">JA 진행</CmsRadio>
        <CmsRadio value="instructor_outsource">강사 섭외</CmsRadio>
      </CmsRadioGroup>
      {mode === 'instructor_outsource' ? (
        <CmsSelect
          showSearch
          optionFilterProp="label"
          placeholder="교재 교육 강사 선택"
          style={{ minWidth: 200, flex: 1 }}
          options={instructorOptions}
          value={instructorId}
          onChange={v => setInstructorId(v == null || v === '' ? undefined : String(v))}
        />
      ) : null}
    </div>
  )
}

function UjatPreEducationBlock({
  half,
  mode,
  viewRow,
}: {
  half: UjatHalfSemesterKey
  mode: 'view' | 'edit'
  viewRow: UjatHalfScheduleTableRow
}) {
  const keys = ujatHalfScheduleOverlayKeys(half)
  const [scheduleName, setScheduleName] = useUjatProgramRegistrationOverlayKv(
    keys.preName,
    '사전교육(발대식)'
  )

  return (
    <div className="ujat-half-education-schedule__block ujat-half-education-schedule__block--first">
      <UjatHalfEducationScheduleSubheading>■ 사전 교육</UjatHalfEducationScheduleSubheading>
      <DetailInfoForm
        title="사전 교육"
        hideHeader
        mode={mode}
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="일정명"
            view={viewRow.scheduleName}
            edit={
              mode === 'edit' ? (
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  value={scheduleName}
                  onChange={e => setScheduleName(e.target.value)}
                />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="진행 일정"
            fullRow
            view={<ScheduleTextView text={viewRow.scheduleText} />}
            edit={
              mode === 'edit' ? (
                <UjatRegionDateMultiScheduleRows half={half} section="pre" />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 형태"
            view={viewRow.deliveryLabel}
            edit={
              mode === 'edit' ? (
                <ScheduleEducationRadioRow half={half} section="pre" initial="online" />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교재 교육"
            view={viewRow.textbookEducationLabel ?? '-'}
            edit={mode === 'edit' ? <TextbookEducationField half={half} /> : undefined}
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
}: {
  half: UjatHalfSemesterKey
  mode: 'view' | 'edit'
  viewRow: UjatHalfScheduleTableRow
}) {
  const keys = ujatHalfScheduleOverlayKeys(half)
  const [scheduleName, setScheduleName] = useUjatProgramRegistrationOverlayKv(
    keys.eventName,
    '교육 진행'
  )
  const [seal, setSeal] = useUjatProgramRegistrationOverlayKv<UjatHalfEventRangeSeal>(
    keys.eventRange,
    EMPTY_UJAT_HALF_EVENT_RANGE_SEAL
  )
  const eventRange: [Dayjs | null, Dayjs | null] = useMemo(
    () => [seal.start ? dayjs(seal.start) : null, seal.end ? dayjs(seal.end) : null],
    [seal.end, seal.start]
  )

  return (
    <div className="ujat-half-education-schedule__block">
      <UjatHalfEducationScheduleSubheading>■ 행사 일정</UjatHalfEducationScheduleSubheading>
      <DetailInfoForm
        title="행사 일정"
        hideHeader
        mode={mode}
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="일정명"
            view={viewRow.scheduleName}
            edit={
              mode === 'edit' ? (
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  value={scheduleName}
                  onChange={e => setScheduleName(e.target.value)}
                />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="진행 일정"
            view={<ScheduleTextView text={viewRow.scheduleText} />}
            edit={
              mode === 'edit' ? (
                <ParagraphDatePicker
                  mode="range"
                  value={eventRange}
                  onChange={next =>
                    setSeal({
                      start: next[0]?.toISOString() ?? null,
                      end: next[1]?.toISOString() ?? null,
                    })
                  }
                  placeholder={['시작일', '종료일']}
                  className="ujat-first-half-schedule__range-picker"
                />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 형태"
            view={viewRow.deliveryLabel}
            edit={
              mode === 'edit' ? (
                <ScheduleEducationRadioRow half={half} section="event" initial="offline" />
              ) : undefined
            }
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
}: {
  half: UjatHalfSemesterKey
  mode: 'view' | 'edit'
  viewRow: UjatHalfScheduleTableRow
}) {
  const keys = ujatHalfScheduleOverlayKeys(half)
  const [scheduleName, setScheduleName] = useUjatProgramRegistrationOverlayKv(
    keys.closingName,
    '해단식'
  )

  return (
    <div className="ujat-half-education-schedule__block">
      <UjatHalfEducationScheduleSubheading>■ 해단식</UjatHalfEducationScheduleSubheading>
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
            edit={
              mode === 'edit' ? (
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  value={scheduleName}
                  onChange={e => setScheduleName(e.target.value)}
                />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="진행 일정"
            fullRow
            view={<ScheduleTextView text={viewRow.scheduleText} />}
            edit={
              mode === 'edit' ? (
                <UjatRegionDateMultiScheduleRows half={half} section="closing" />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 형태"
            view={viewRow.deliveryLabel}
            edit={
              mode === 'edit' ? (
                <ScheduleEducationRadioRow half={half} section="closing" initial="online" />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}

export function UjatHalfEducationScheduleSection({
  half,
  mode,
  display,
}: {
  half: UjatHalfSemesterKey
  mode: 'view' | 'edit'
  display: import('@/features/program/ujat/lib/ujat-half-education-schedule-display').UjatHalfEducationScheduleDisplay
}) {
  return (
    <div className="ujat-half-education-schedule-section">
      <UjatPreEducationBlock half={half} mode={mode} viewRow={display.preEducation} />
      <UjatEventScheduleBlock half={half} mode={mode} viewRow={display.eventSchedule} />
      <UjatClosingCeremonyBlock half={half} mode={mode} viewRow={display.closingCeremony} />
    </div>
  )
}
