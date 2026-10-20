import { Fragment, useMemo, useSyncExternalStore } from 'react'
import dayjs from 'dayjs'
import '@/features/template/ui/paragraph/single-item/user-info.css'
import './ujat-program-application-preferred-education-schedule-paragraph.css'
import { ProgramApplicationScheduleTemplateHintParagraph } from '@/features/template/ui/form-set/application-form/shared/paragraphs/program-application-schedule-template-hint-paragraph'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ParagraphChip } from '@/features/template/ui/shared/paragraph-chip'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/renderers/paragraph-body-interaction-mode'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import {
  UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS,
  useUjatApplicationInstitutionOverlayKv,
} from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync'
import {
  getUjatProgramRegistrationOverlayRecord,
  getUjatProgramRegistrationOverlayVersion,
  subscribeUjatProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import { resolveUjatEducationScheduleSettingsSemesterDisplay } from '@/features/program/ujat/lib/ujat-education-schedule-settings-display'
import { formatShortYearMdWithKoreanWeekday } from '@/shared/lib/format-date-korean-weekday'

/** 템플릿 편집(authoring) — 교육 진행 희망일 값 영역 */
const AUTHORING_PREFERRED_DATES_HINT = '관리자가 선택한 진행 가능일이 노출됩니다.'

/** 등록 위저드 신청 양식 — 시드 fill 잠금 시 신청자 입력 안내 */
const DISPLAY_ONLY_PREFERRED_DATES_HINT = '신청자가 선택한 진행 희망일이 노출됩니다.'

const AUTHORING_SCHEDULE_PLACEHOLDER_HINT =
  '프로그램 등록 시 관리자가 설정한 진행 일정이 노출됩니다.'

/**
 * 사용자 미리보기에서 선택할 수 있는 일정 후보.
 * 등록 위저드의 연동 모드에서는 아래 후보를 사용하지 않고 공통정보 overlay를 표시한다.
 */
const MOCK_FRIDAY_SCHEDULE_OPTIONS: readonly { id: string; display: string }[] = (() => {
  const rows: { id: string; display: string }[] = []
  const fridays: Array<[number, number, number]> = [
    [2026, 4, 3],
    [2026, 4, 10],
    [2026, 4, 17],
    [2026, 4, 24],
    [2026, 5, 1],
    [2026, 5, 8],
    [2026, 5, 15],
    [2026, 5, 22],
    [2026, 5, 29],
    [2026, 6, 5],
    [2026, 6, 12],
    [2026, 6, 19],
    [2026, 6, 26],
    [2026, 7, 3],
    [2026, 7, 10],
    [2026, 7, 17],
    [2026, 7, 24],
    [2026, 7, 31],
    [2026, 8, 7],
    [2026, 8, 14],
    [2026, 8, 21],
    [2026, 8, 28],
    [2026, 9, 4],
    [2026, 9, 11],
    [2026, 9, 18],
    [2026, 9, 25],
    [2026, 10, 2],
    [2026, 10, 9],
    [2026, 10, 16],
    [2026, 10, 23],
    [2026, 10, 30],
    [2026, 11, 6],
    [2026, 11, 13],
    [2026, 11, 20],
    [2026, 11, 27],
  ]
  for (const [y, m, d] of fridays) {
    const yy = String(y).slice(-2)
    rows.push({
      id: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      display: `${yy}년 ${m}월 ${d}일(금)`,
    })
  }
  return rows
})()

const INITIAL_SELECTED_IDS = new Set<string>([
  '2026-04-24',
  '2026-05-08',
  '2026-10-30',
  '2026-11-20',
])

type PreferredScheduleOption = { id: string; display: string }

/**
 * 등록 위저드에서는 템플릿용 고정 금요일 목록을 사용하지 않는다.
 * 기관은 연 1회 신청하므로 상·하반기 금요일을 반기 구분 없이 날짜순 한 목록으로 노출한다.
 */
export function buildProgramLinkedScheduleOptions(
  overlay: Record<string, unknown>
): PreferredScheduleOption[] {
  const options: Array<PreferredScheduleOption & { dateKey: string }> = []
  for (const half of ['h1', 'h2'] as const) {
    const display = resolveUjatEducationScheduleSettingsSemesterDisplay(half, overlay)
    const start = display.eventRange.start ? dayjs(display.eventRange.start).startOf('day') : null
    const end = display.eventRange.end ? dayjs(display.eventRange.end).startOf('day') : null
    if (start == null || end == null || !start.isValid() || !end.isValid()) continue

    const first = start.isBefore(end, 'day') ? start : end
    const last = start.isBefore(end, 'day') ? end : start
    const unavailable = new Set(display.unavailableDates)
    for (let cursor = first; !cursor.isAfter(last, 'day'); cursor = cursor.add(1, 'day')) {
      // UJAT 신청 폼의 진행 희망일 후보는 기존 사용자 폼과 동일하게 금요일만
      // 만들고, 관리자가 지정한 반기별 교육 진행 불가일은 제외한다.
      if (cursor.day() !== 5) continue
      const dateKey = cursor.format('YYYY-MM-DD')
      if (unavailable.has(dateKey)) continue
      options.push({
        id: `${half}:${dateKey}`,
        dateKey,
        display: formatShortYearMdWithKoreanWeekday(cursor),
      })
    }
  }
  return options
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    .map(({ id, display }) => ({ id, display }))
}

function PreferredScheduleChipGrid({
  options,
  selectedIds,
  onToggle,
  interactive,
}: {
  options: readonly PreferredScheduleOption[]
  selectedIds: ReadonlySet<string>
  onToggle: (id: string) => void
  interactive: boolean
}) {
  return (
    <div
      className="user-info-grid user-info-grid--edit"
      role="list"
      style={interactive ? undefined : { pointerEvents: 'none' }}
    >
      {options.map(option => (
        <ParagraphChip
          key={option.id}
          role="listitem"
          className="ujat-preferred-education-schedule__chip"
          selected={selectedIds.has(option.id)}
          aria-pressed={selectedIds.has(option.id)}
          onClick={() => {
            if (!interactive) return
            onToggle(option.id)
          }}
        >
          {option.display}
        </ParagraphChip>
      ))}
    </div>
  )
}

function PreferredScheduleSummaryRow({
  paragraphInteractionMode,
  orderedSelected,
  displayOnly = false,
}: {
  paragraphInteractionMode: ParagraphBodyInteractionMode
  orderedSelected: readonly { id: string; display: string }[]
  displayOnly?: boolean
}) {
  const editContent =
    paragraphInteractionMode === 'authoring' ? (
      <span className="form-editor-template-field-hint-text">{AUTHORING_PREFERRED_DATES_HINT}</span>
    ) : displayOnly ? (
      <span className="form-editor-template-field-hint-text">{DISPLAY_ONLY_PREFERRED_DATES_HINT}</span>
    ) : orderedSelected.length === 0 ? (
      <span className="form-editor-template-field-hint-text">선택된 일정이 없습니다.</span>
    ) : (
      <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
        {orderedSelected.map((o, i) => (
          <Fragment key={o.id}>
            {i > 0 ? <DetailInfoForm.InputsSeparator /> : null}
            <span>{o.display}</span>
          </Fragment>
        ))}
      </div>
    )

  return (
    <div className="ujat-preferred-education-schedule__summary-row">
      <DetailInfoForm title="진행 희망 교육 일정" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="교육 진행 희망일" fullRow edit={editContent} view="-" />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}

type UjatProgramApplicationPreferredEducationScheduleParagraphProps = {
  paragraphInteractionMode?: ParagraphBodyInteractionMode
  programLinkedPreview?: boolean
  choiceDisplayOnly?: boolean
}

/**
 * UJAT 프로그램 학교 신청 폼 — 진행 희망 교육 일정
 * - 템플릿 편집(`authoring`): 봉사자 모집 일정 안내 박스 + 희망일 행 안내 문구
 * - 등록 위저드 연동: 공통정보 상·하반기 금요일(불가일 제외)
 * - 미리보기 등(`user`): mock 일정 그리드 + 선택 반영
 */
export function UjatProgramApplicationPreferredEducationScheduleParagraph({
  paragraphInteractionMode = 'authoring',
  programLinkedPreview = false,
  choiceDisplayOnly = false,
}: UjatProgramApplicationPreferredEducationScheduleParagraphProps) {
  const registrationOverlayVersion = useSyncExternalStore(
    subscribeUjatProgramRegistrationOverlay,
    getUjatProgramRegistrationOverlayVersion,
    getUjatProgramRegistrationOverlayVersion
  )
  const linkedScheduleOptions = useMemo(
    () => buildProgramLinkedScheduleOptions(getUjatProgramRegistrationOverlayRecord()),
    [registrationOverlayVersion]
  )

  const [selectedIdList, setSelectedIdList] = useUjatApplicationInstitutionOverlayKv<string[]>(
    UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS.preferredScheduleSelectedIds,
    programLinkedPreview ? [] : [...INITIAL_SELECTED_IDS]
  )
  const selectedIds = useMemo(
    () => (choiceDisplayOnly ? new Set<string>() : new Set(selectedIdList)),
    [choiceDisplayOnly, selectedIdList]
  )
  const chipInteractive = !choiceDisplayOnly && paragraphInteractionMode !== 'authoring'

  const scheduleOptions = programLinkedPreview
    ? linkedScheduleOptions
    : MOCK_FRIDAY_SCHEDULE_OPTIONS
  const orderedSelected = useMemo(
    () => scheduleOptions.filter(o => selectedIds.has(o.id)),
    [scheduleOptions, selectedIds]
  )

  const toggle = (id: string) => {
    if (!chipInteractive) return
    const set = new Set(selectedIdList)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    setSelectedIdList([...set])
  }

  if (programLinkedPreview) {
    return (
      <div className="program-registration-paragraph">
        <div className="ujat-preferred-education-schedule__grid-wrap">
          {linkedScheduleOptions.length > 0 ? (
            <PreferredScheduleChipGrid
              options={linkedScheduleOptions}
              selectedIds={selectedIds}
              onToggle={toggle}
              interactive={chipInteractive}
            />
          ) : (
            <span className="form-editor-template-field-hint-text">
              공통정보에서 교육 진행 일정을 먼저 선택해 주세요.
            </span>
          )}
        </div>
        <PreferredScheduleSummaryRow
          paragraphInteractionMode="user"
          orderedSelected={orderedSelected}
          displayOnly={choiceDisplayOnly}
        />
      </div>
    )
  }

  if (paragraphInteractionMode === 'authoring') {
    return (
      <>
        <ProgramApplicationScheduleTemplateHintParagraph
          hintText={AUTHORING_SCHEDULE_PLACEHOLDER_HINT}
        />
        <PreferredScheduleSummaryRow
          paragraphInteractionMode={paragraphInteractionMode}
          orderedSelected={orderedSelected}
        />
      </>
    )
  }

  return (
    <div className="program-registration-paragraph">
      <div className="ujat-preferred-education-schedule__grid-wrap">
        <PreferredScheduleChipGrid
          options={MOCK_FRIDAY_SCHEDULE_OPTIONS}
          selectedIds={selectedIds}
          onToggle={toggle}
          interactive={chipInteractive}
        />
      </div>
      <PreferredScheduleSummaryRow
        paragraphInteractionMode={paragraphInteractionMode}
        orderedSelected={orderedSelected}
        displayOnly={choiceDisplayOnly}
      />
    </div>
  )
}
