/**
 * 상·하반기 교육 일정 블록 — 등록 양식·프로그램 상세 공통
 */
import { useEffect, useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
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
import {
  updateUjatProgramRegistrationOverlayKey,
  useUjatProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
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
function getRowRegionOptions(
  rowId: number,
  regionByRow: Record<number, string[]>,
  regions: Array<{ key: string; label: string }>
) {
  const current = new Set(regionByRow[rowId] ?? [])
  const selectedByOtherRows = new Set(
    Object.entries(regionByRow)
      .filter(([key]) => Number(key) !== rowId)
      .flatMap(([, values]) => values ?? [])
  )
  return regions
    .map(r => ({ label: r.label, value: r.key }))
    .filter(option => current.has(option.value) || !selectedByOtherRows.has(option.value))
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

function UjatRegionDateMultiScheduleRows({
  half,
  section,
}: {
  half: UjatHalfSemesterKey
  section: 'pre' | 'closing'
}) {
  const { regions } = useUjatEducationRegions()
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
    <div className="half-education-schedule__schedule-rows">
      {rowIds.map((id, index) => (
        <div
          key={id}
          className="detail-info-form-inputs-wrapper half-education-schedule__schedule-row"
        >
          <CmsSelect inputSize="small"
            mode="multiple"
            withAllOption={false}
            style={{ width: 360 }}
            placeholder="교육 지역을 선택해 주세요"
            options={getRowRegionOptions(id, regionByRow, regions)}
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
          <ParagraphDatePicker inputSize="small"
            mode="single"
            presetMode="schedule"
            customizable={false}
            suppressAutoTodayWhenEmpty
            placeholder="일정을 선택해 주세요"
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
      size="medium"
      value={value}
      onChange={e => setValue(e.target.value as UjatEducationDelivery)}
    >
      <CmsRadio size="medium" value="online">온라인</CmsRadio>
      <CmsRadio size="medium" value="offline">오프라인</CmsRadio>
      <CmsRadio size="medium" value="hybrid">온/오프라인</CmsRadio>
    </CmsRadioGroup>
  )
}

function TextbookEducationField({ half }: { half: UjatHalfSemesterKey }) {
  const keys = ujatHalfScheduleOverlayKeys(half)
  const [instructorOptions, setInstructorOptions] = useState<
    Array<{ value: string; label: string }>
  >([])
  const [mode, setMode] = useUjatProgramRegistrationOverlayKv<UjatTextbookEducationMode>(
    keys.preTextbookMode,
    'ja'
  )
  const [instructorId, setInstructorId] = useUjatProgramRegistrationOverlayKv<string | undefined>(
    keys.preTextbookInstructorId,
    undefined
  )

  useEffect(() => {
    if (mode !== 'instructor_outsource') return
    let cancelled = false
    void fetchAllMembersPagesRemote({
      rolesExactAnyOf: instructorListRolesExactAnyOf(),
    })
      .then(users => {
        if (cancelled) return
        setInstructorOptions(
          users
            .map(user => ({ value: String(user.id), label: user.name.trim() }))
            .filter(option => option.value && option.label)
        )
      })
      .catch(() => {
        // 회원 API가 비활성화된 로컬/템플릿 환경에서는 빈 선택지로 유지한다.
        if (!cancelled) setInstructorOptions([])
      })
    return () => {
      cancelled = true
    }
  }, [mode])

  return (
    <div className="detail-info-form-inputs-wrapper half-education-schedule__textbook-row">
      <CmsRadioGroup
        size="medium"
        value={mode}
        onChange={e => {
          const next = e.target.value as UjatTextbookEducationMode
          setMode(next)
          if (next === 'ja') setInstructorId(undefined)
        }}
      >
        <CmsRadio size="medium" value="ja">JA 진행</CmsRadio>
        <CmsRadio size="medium" value="instructor_outsource">강사 섭외</CmsRadio>
      </CmsRadioGroup>
      {mode === 'instructor_outsource' ? (
        <>
          <DetailInfoForm.InputsSeparator />
          <CmsSelect inputSize="small"
            showSearch
            optionFilterProp="label"
            placeholder="교재 교육 강사를 선택해 주세요"
            style={{ minWidth: 200, flex: 1 }}
            options={instructorOptions}
            value={instructorId}
            onChange={v => setInstructorId(v == null || v === '' ? undefined : String(v))}
          />
        </>
      ) : null}
    </div>
  )
}

function UjatScheduleNameField({ overlayKey, fallback }: { overlayKey: string; fallback: string }) {
  const [scheduleName, setScheduleName] = useUjatProgramRegistrationOverlayKv(overlayKey, fallback)
  return (
    <CmsInput
      inputSize="small"
      width="100%"
      value={scheduleName}
      onChange={event => setScheduleName(event.target.value)}
    />
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

  return (
    <div className="half-education-schedule__block half-education-schedule__block--first">
      <HalfEducationScheduleSubheading>■ 사전 교육</HalfEducationScheduleSubheading>
      <DetailInfoForm
        title="사전 교육"
        hideHeader
        mode={mode}
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="일정명"
            validationKey={`${half}.pre.name`}
            view={viewRow.scheduleName}
            edit={
              mode === 'edit' ? (
                <UjatScheduleNameField overlayKey={keys.preName} fallback="사전교육(발대식)" />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="진행 일정"
            validationKey={`${half}.pre.schedule`}
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
  const [seal, setSeal] = useUjatProgramRegistrationOverlayKv<UjatHalfEventRangeSeal>(
    keys.eventRange,
    EMPTY_UJAT_HALF_EVENT_RANGE_SEAL
  )
  const eventRange: [Dayjs | null, Dayjs | null] = useMemo(
    () => [seal.start ? dayjs(seal.start) : null, seal.end ? dayjs(seal.end) : null],
    [seal.end, seal.start]
  )

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
            edit={
              mode === 'edit' ? (
                <UjatScheduleNameField overlayKey={keys.eventName} fallback="교육 진행" />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="진행 일정"
            validationKey={`${half}.event.range`}
            view={<ScheduleTextView text={viewRow.scheduleText} />}
            edit={
              mode === 'edit' ? (
                <ParagraphDatePicker inputSize="small"
                  mode="range"
                  value={eventRange}
                  onChange={next =>
                    setSeal({
                      start: next[0]?.toISOString() ?? null,
                      end: next[1]?.toISOString() ?? null,
                    })
                  }
                  placeholder={['교육 진행 일정을 선택해 주세요', '교육 진행 일정을 선택해 주세요']}
                  className="half-education-schedule__range-picker"
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
            edit={
              mode === 'edit' ? (
                <UjatScheduleNameField overlayKey={keys.closingName} fallback="해단식" />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="진행 일정"
            validationKey={`${half}.closing.multi`}
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

export function HalfEducationScheduleSection({
  half,
  mode,
  display,
}: {
  half: UjatHalfSemesterKey
  mode: 'view' | 'edit'
  display: import('@/features/program/ujat/lib/ujat-half-education-schedule-display').UjatHalfEducationScheduleDisplay
}) {
  return (
    <div className="half-education-schedule-section">
      <UjatPreEducationBlock half={half} mode={mode} viewRow={display.preEducation} />
      <UjatEventScheduleBlock half={half} mode={mode} viewRow={display.eventSchedule} />
      <UjatClosingCeremonyBlock half={half} mode={mode} viewRow={display.closingCeremony} />
    </div>
  )
}
