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
import type { UjatTypedDetail } from '@/features/program/ujat/api/typed-detail-client'
import {
  hasUjatTypedMainEducationRange,
  resolveUjatEducationScheduleSettingsSemesterDisplay,
  resolveUjatEducationScheduleSettingsSemesterDisplayFromTypedDetail,
} from '@/features/program/ujat/lib/ujat-education-schedule-settings-display'
import { formatKoreanYearMonthDayWithWeekday } from '@/shared/lib/format-date-korean-weekday'

/** 템플릿 편집(authoring) — 교육 진행 희망일 값 영역 */
const AUTHORING_PREFERRED_DATES_HINT = '일정을 먼저 선택해 주세요'

/** 등록 위저드 신청 양식 — 시드 fill 잠금 시 신청자 입력 안내 */
const DISPLAY_ONLY_PREFERRED_DATES_HINT = '신청자가 선택한 진행 희망일이 노출됩니다.'

const AUTHORING_SCHEDULE_PLACEHOLDER_HINT =
  '프로그램 등록 시 관리자가 설정한 일정이 노출됩니다.'

export const PREVIEW_PLACEHOLDER_SCHEDULE_HINT =
  '프로그램에 연결하면 교육 일정이 표시됩니다.'

/**
 * 템플릿 미리보기용 placeholder 일정 (실제 날짜 없음).
 * 등록 위저드 programLinkedPreview 는 overlay 연동 일정을 사용한다.
 */
export const PREVIEW_PLACEHOLDER_SCHEDULE_OPTIONS: readonly { id: string; display: string }[] = [
  { id: 'preview-schedule-1', display: '예시) 1회차 일정' },
  { id: 'preview-schedule-2', display: '예시) 2회차 일정' },
  { id: 'preview-schedule-3', display: '예시) 3회차 일정' },
  { id: 'preview-schedule-4', display: '예시) 4회차 일정' },
]

const INITIAL_SELECTED_IDS = new Set<string>(['preview-schedule-1', 'preview-schedule-3'])

type PreferredScheduleOption = { id: string; display: string }

/**
 * 등록 위저드에서는 템플릿용 고정 금요일 목록을 사용하지 않는다.
 * 기관은 연 1회 신청하므로 상·하반기 금요일을 반기 구분 없이 날짜순 한 목록으로 노출한다.
 */
export function buildProgramLinkedScheduleOptions(
  overlay: Record<string, unknown>,
  typedDetail?: UjatTypedDetail | null
): PreferredScheduleOption[] {
  const useTyped = hasUjatTypedMainEducationRange(typedDetail)
  const options: Array<PreferredScheduleOption & { dateKey: string }> = []
  for (const half of ['h1', 'h2'] as const) {
    const display = useTyped
      ? resolveUjatEducationScheduleSettingsSemesterDisplayFromTypedDetail(half, typedDetail)
      : resolveUjatEducationScheduleSettingsSemesterDisplay(half, overlay)
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
        display: formatKoreanYearMonthDayWithWeekday(cursor),
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
  typedDetail?: UjatTypedDetail | null
}

/**
 * UJAT 프로그램 학교 신청 폼 — 진행 희망 교육 일정
 * - 템플릿 편집(`authoring`): 봉사자 모집 일정 안내 박스 + 희망일 행 안내 문구
 * - 등록 위저드 연동: 공통정보 상·하반기 금요일(불가일 제외)
 * - 미리보기 등(`user`): placeholder 일정 그리드 + 선택 반영
 */
export function UjatProgramApplicationPreferredEducationScheduleParagraph({
  paragraphInteractionMode = 'authoring',
  programLinkedPreview = false,
  choiceDisplayOnly = false,
  typedDetail = null,
}: UjatProgramApplicationPreferredEducationScheduleParagraphProps) {
  const registrationOverlayVersion = useSyncExternalStore(
    subscribeUjatProgramRegistrationOverlay,
    getUjatProgramRegistrationOverlayVersion,
    getUjatProgramRegistrationOverlayVersion
  )
  const linkedScheduleOptions = useMemo(
    () =>
      buildProgramLinkedScheduleOptions(getUjatProgramRegistrationOverlayRecord(), typedDetail),
    [registrationOverlayVersion, typedDetail]
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
    : PREVIEW_PLACEHOLDER_SCHEDULE_OPTIONS
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
      <ProgramApplicationScheduleTemplateHintParagraph hintText={PREVIEW_PLACEHOLDER_SCHEDULE_HINT} />
      <div className="ujat-preferred-education-schedule__grid-wrap">
        <PreferredScheduleChipGrid
          options={PREVIEW_PLACEHOLDER_SCHEDULE_OPTIONS}
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
