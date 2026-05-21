/**
 * UJAT — 상반기 교육 일정 (사전 교육 / 행사 일정 01 / 해단식, 각 블록별 DetailInfoForm)
 */

import { useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import {
  updateUjatProgramRegistrationOverlayKey,
  useUjatProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import './ujat-first-half-education-schedule-paragraph.css'

type EducationDelivery = 'online' | 'offline' | 'hybrid'

type MultiScheduleBundle = {
  rowIds: number[]
  regionByRow: Record<string, string[]>
  dateByRow: Record<string, string | null>
}

const DEFAULT_MULTI_SCHEDULE_BUNDLE: MultiScheduleBundle = {
  rowIds: [0, 1],
  regionByRow: { '0': [], '1': [] },
  dateByRow: { '0': null, '1': null },
}

const REGION_OPTIONS = [
  { label: '서울', value: '서울' },
  { label: '경기', value: '경기' },
  { label: '대전', value: '대전' },
  { label: '인천', value: '인천' },
  { label: '대구', value: '대구' },
  { label: '부산', value: '부산' },
  { label: '전주', value: '전주' },
  { label: '광주', value: '광주' },
]

function ScheduleEducationRadioRow({
  initial,
  instanceId,
}: {
  initial: EducationDelivery
  instanceId: string
}) {
  const [value, setValue] = useUjatProgramRegistrationOverlayKv<EducationDelivery>(
    `ujat.firstHalf.radio.${instanceId}`,
    initial
  )
  return (
    <CmsRadioGroup
      size="large"
      value={value}
      onChange={e => setValue(e.target.value as EducationDelivery)}
    >
      <CmsRadio value="online">온라인</CmsRadio>
      <CmsRadio value="offline">오프라인</CmsRadio>
      <CmsRadio value="hybrid">온/오프라인</CmsRadio>
    </CmsRadioGroup>
  )
}

function getRowRegionOptions(rowId: number, regionByRow: Record<number, string[]>) {
  const current = new Set(regionByRow[rowId] ?? [])
  const selectedByOtherRows = new Set(
    Object.entries(regionByRow)
      .filter(([key]) => Number(key) !== rowId)
      .flatMap(([, values]) => values ?? [])
  )
  return REGION_OPTIONS.filter(
    option => current.has(option.value) || !selectedByOtherRows.has(option.value)
  )
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

/** 사전 교육·해단식 공통 — 진행 일정: 1행에 추가, 2행부터 삭제 */
function UjatRegionDateMultiScheduleRows({ instanceId }: { instanceId: string }) {
  const storageKey = `ujat.firstHalf.multi.${instanceId}`
  const [bundle] = useUjatProgramRegistrationOverlayKv<MultiScheduleBundle>(
    storageKey,
    DEFAULT_MULTI_SCHEDULE_BUNDLE
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
    updateUjatProgramRegistrationOverlayKey<MultiScheduleBundle>(storageKey, prev => {
      const p = prev ?? DEFAULT_MULTI_SCHEDULE_BUNDLE
      const nextId = p.rowIds.length === 0 ? 0 : Math.max(...p.rowIds) + 1
      return {
        rowIds: [...p.rowIds, nextId],
        regionByRow: { ...p.regionByRow, [String(nextId)]: [] },
        dateByRow: { ...p.dateByRow, [String(nextId)]: null },
      }
    })
  }

  const removeRow = (id: number) => {
    updateUjatProgramRegistrationOverlayKey<MultiScheduleBundle>(storageKey, prev => {
      const p = prev ?? DEFAULT_MULTI_SCHEDULE_BUNDLE
      const nextRowIds = p.rowIds.filter(rid => rid !== id)
      const nextRegion = { ...p.regionByRow }
      delete nextRegion[String(id)]
      const nextDates = { ...p.dateByRow }
      delete nextDates[String(id)]
      return { rowIds: nextRowIds, regionByRow: nextRegion, dateByRow: nextDates }
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
              updateUjatProgramRegistrationOverlayKey<MultiScheduleBundle>(storageKey, prev => {
                const p = prev ?? DEFAULT_MULTI_SCHEDULE_BUNDLE
                return {
                  ...p,
                  regionByRow: { ...p.regionByRow, [String(id)]: next as string[] },
                }
              })
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
              updateUjatProgramRegistrationOverlayKey<MultiScheduleBundle>(storageKey, prev => {
                const p = prev ?? DEFAULT_MULTI_SCHEDULE_BUNDLE
                return {
                  ...p,
                  dateByRow: {
                    ...p.dateByRow,
                    [String(id)]: next == null ? null : next.toISOString(),
                  },
                }
              })
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

/** 사전 교육 — 지역 셀렉트 + 일정(행 추가) */
function UjatPreEducationScheduleForm() {
  return (
    <div className="ujat-first-half-schedule__block ujat-first-half-schedule__block--first">
      <div className="ujat-first-half-schedule__subheading">■ 사전 교육</div>
      <DetailInfoForm
        title="사전 교육"
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="일정명"
            edit={<CmsInput inputSize="medium" width="100%" defaultValue="사전 교육(발대식)" />}
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="진행 일정"
            fullRow
            edit={<UjatRegionDateMultiScheduleRows instanceId="pre" />}
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 형태"
            edit={<ScheduleEducationRadioRow initial="online" instanceId="pre" />}
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}

type EventRangeSeal = { start: string | null; end: string | null }
const EMPTY_EVENT_RANGE_SEAL: EventRangeSeal = { start: null, end: null }

/** 행사 일정 01 — 기간 한 덩어리 */
function UjatEventSchedule01Form() {
  const [seal, setSeal] = useUjatProgramRegistrationOverlayKv<EventRangeSeal>(
    'ujat.firstHalf.event01.range',
    EMPTY_EVENT_RANGE_SEAL
  )
  const eventRange: [Dayjs | null, Dayjs | null] = useMemo(
    () => [seal.start ? dayjs(seal.start) : null, seal.end ? dayjs(seal.end) : null],
    [seal.end, seal.start]
  )
  const setEventRange = (next: [Dayjs | null, Dayjs | null]) => {
    setSeal({
      start: next[0]?.toISOString() ?? null,
      end: next[1]?.toISOString() ?? null,
    })
  }

  return (
    <div className="ujat-first-half-schedule__block">
      <div className="ujat-first-half-schedule__subheading">■ 행사 일정 01</div>
      <DetailInfoForm
        title="행사 일정 01"
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="일정명"
            edit={<CmsInput inputSize="medium" width="100%" defaultValue="교육 진행" />}
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="진행 일정"
            edit={
              <ParagraphDatePicker
                mode="range"
                value={eventRange}
                onChange={setEventRange}
                placeholder={['시작일', '종료일']}
                className="ujat-first-half-schedule__range-picker"
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 형태"
            edit={<ScheduleEducationRadioRow initial="offline" instanceId="event01" />}
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}

/** 해단식 — 사전 교육과 동일 패턴(별도 DetailInfoForm) */
function UjatClosingCeremonyScheduleForm() {
  return (
    <div className="ujat-first-half-schedule__block">
      <div className="ujat-first-half-schedule__subheading">■ 해단식</div>
      <DetailInfoForm
        title="해단식"
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="일정명"
            edit={<CmsInput inputSize="medium" width="100%" defaultValue="해단식" />}
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="진행 일정"
            fullRow
            edit={<UjatRegionDateMultiScheduleRows instanceId="closing" />}
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 형태"
            edit={<ScheduleEducationRadioRow initial="online" instanceId="closing" />}
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}

export function UjatFirstHalfEducationScheduleParagraph() {
  return (
    <>
      <UjatPreEducationScheduleForm />
      <UjatEventSchedule01Form />
      <UjatClosingCeremonyScheduleForm />
    </>
  )
}
