import { useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { PARTICIPANT_INTERVIEW_OVERLAY_PREFIX } from '@/features/program/shared/lib/volunteer-interview-config'
import {
  listVolunteerInterviewExceptionBlockIds,
  readVolunteerInterviewLiveRecord,
} from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-sync'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { CmsButton } from '@/shared/ui'
import { ButtonAddIcon } from '@/shared/ui/icons/ButtonIcons'
import '@/features/template/ui/form-set/application-form/volunteer/paragraphs/volunteer-interview-available-schedule-paragraph.css'
import { VolunteerInterviewAvailableScheduleParagraph } from '@/features/template/ui/form-set/application-form/volunteer/paragraphs/volunteer-interview-available-schedule-paragraph'
import type { VolunteerInterviewScheduleEditSeed } from '@/features/program/shared/lib/volunteer-interview-schedule-edit-seed'
import type { UnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import { useGeneralRecruitOverlayKv } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { normalizeRangeSealToLocalDayBounds } from '@/features/template/ui/form-set/shared/unavailable-dates-calendar-range'

/**
 * 봉사자 모집 폼 — 면접 진행 가능 일정(신청 폼 템플릿 UI 재사용).
 * Overlay KV(selectedSlotKeys/timeUnit/exception) 전용. 모집 행 DTO에는 슬롯 필드가 없다.
 */
export function RecruitFormVolunteerInterviewScheduleParagraph({
  exceptionScheduleCount = 0,
  exceptionBlockKeys,
  onRemoveExceptionBlock,
  commonScheduleSeed,
  onCommonExclusionChange,
  /** 템플릿 관리만 true — 프로그램 등록·상세 편집은 false */
  freezeUnavailableCalendar = false,
  typedTemplateAuthoring = false,
  overlayNamespace,
  interviewRangeSealKey,
  interviewPeriodRange: interviewPeriodRangeProp,
}: {
  exceptionScheduleCount?: number
  exceptionBlockKeys?: number[]
  onRemoveExceptionBlock?: (key: number) => void
  commonScheduleSeed?: VolunteerInterviewScheduleEditSeed
  onCommonExclusionChange?: (state: UnavailableDatesExclusionState) => void
  /** 템플릿 관리 화면 — 진행 불가일 모달 달력 샘플 고정 */
  freezeUnavailableCalendar?: boolean
  typedTemplateAuthoring?: boolean
  overlayNamespace?: string
  interviewRangeSealKey?: string
  interviewPeriodRange?: [Dayjs, Dayjs] | null
}) {
  const [interviewRangeSeal] = useGeneralRecruitOverlayKv<{ start: string; end: string } | null>(
    interviewRangeSealKey ?? 'recruit.volunteer.interviewRangeSeal',
    null,
    { typedTemplateAuthoring }
  )
  const interviewPeriodRangeFromOverlay = useMemo(
    () => normalizeRangeSealToLocalDayBounds(interviewRangeSeal),
    [interviewRangeSeal]
  )
  const interviewPeriodRange = typedTemplateAuthoring
    ? (interviewPeriodRangeProp ?? null)
    : interviewPeriodRangeProp ?? interviewPeriodRangeFromOverlay

  return (
    <VolunteerInterviewAvailableScheduleParagraph
      isTemplateAuthoringMode
      overlayStore="recruit"
      overlayNamespace={overlayNamespace}
      interviewRangeSealKey={interviewRangeSealKey}
      exceptionScheduleCount={exceptionScheduleCount}
      exceptionBlockKeys={exceptionBlockKeys}
      onRemoveExceptionBlock={onRemoveExceptionBlock}
      commonScheduleSeed={commonScheduleSeed}
      onCommonExclusionChange={onCommonExclusionChange}
      freezeUnavailableCalendar={freezeUnavailableCalendar}
      typedTemplateAuthoring={typedTemplateAuthoring}
      interviewPeriodRange={interviewPeriodRange}
    />
  )
}

/** 일반 개인 참여자 모집 면접 일정 overlay 네임스페이스 — 봉사자 `recruit.volunteer.interview` 와 같은 접미사 */
const INDIVIDUAL_RECRUIT_INTERVIEW_NAMESPACE = PARTICIPANT_INTERVIEW_OVERLAY_PREFIX
/** 참여자 모집 「2차 면접 기간」 — 진행 불가일·예외 일정 선택 가능 범위 */
const INDIVIDUAL_RECRUIT_INTERVIEW_RANGE_SEAL_KEY = 'recruit.individual.interviewRangeSeal'

/** 봉사자 모집 「면접 진행 가능 일정」 단락 설명과 같은 문구 */
const INTERVIEW_SCHEDULE_DESCRIPTION =
  '서류 합격 시 면접이 진행됩니다. 면접이 진행 가능한 일정 모두 선택해 주세요.'

function initialExceptionBlockKeys(): number[] {
  return listVolunteerInterviewExceptionBlockIds(
    readVolunteerInterviewLiveRecord('recruit'),
    'recruit',
    INDIVIDUAL_RECRUIT_INTERVIEW_NAMESPACE
  )
}

/**
 * 일반 개인 참여자 모집 — 면접 진행 가능 일정(봉사자 모집 면접 일정 컴포넌트 재사용, 참여자 네임스페이스).
 * 등록 위저드(참여자 모집 정보 단락)와 상세 참여자 모집 수정에서 같은 UI를 쓴다.
 * `exceptionBlockKeys`를 주면 제어 모드(상세 hydrate 후 블록), 없으면 live overlay 에서 블록을 읽는다.
 */
export function RecruitFormIndividualInterviewScheduleSection({
  exceptionBlockKeys: controlledBlockKeys,
  onExceptionBlockKeysChange,
  commonScheduleSeed,
  interviewPeriodRange,
  highlightParagraphId,
}: {
  exceptionBlockKeys?: number[]
  onExceptionBlockKeysChange?: (next: number[]) => void
  commonScheduleSeed?: VolunteerInterviewScheduleEditSeed
  interviewPeriodRange?: [Dayjs, Dayjs] | null
  highlightParagraphId?: string
}) {
  const [internalBlockKeys, setInternalBlockKeys] = useState<number[]>(initialExceptionBlockKeys)
  const [exceptionScheduleAddDisabled, setExceptionScheduleAddDisabled] = useState(
    () => commonScheduleSeed?.excludeNone ?? false
  )
  const blockKeys = controlledBlockKeys ?? internalBlockKeys
  const updateBlockKeys = (next: number[]) => {
    if (onExceptionBlockKeysChange) {
      onExceptionBlockKeysChange(next)
      return
    }
    setInternalBlockKeys(next)
  }

  return (
    <section aria-label="면접 진행 가능 일정">
      <FormParagraphSectionHeader
        title="면접 진행 가능 일정"
        surface="responseEntry"
        titleAligned
        required
        highlightParagraphId={highlightParagraphId}
        description={INTERVIEW_SCHEDULE_DESCRIPTION}
        titleTrailing={
          <div className="volunteer-interview-available-schedule__card-title-actions">
            <CmsButton
              type="button"
              variant="secondary"
              size="medium"
              disabled={exceptionScheduleAddDisabled}
              icon={<ButtonAddIcon aria-hidden />}
              onClick={() => updateBlockKeys([...blockKeys, Date.now()])}
            >
              예외 일정 추가
            </CmsButton>
          </div>
        }
      />
      <RecruitFormVolunteerInterviewScheduleParagraph
        exceptionBlockKeys={blockKeys}
        onRemoveExceptionBlock={key => updateBlockKeys(blockKeys.filter(id => id !== key))}
        commonScheduleSeed={commonScheduleSeed}
        onCommonExclusionChange={state => setExceptionScheduleAddDisabled(state.excludeNone)}
        freezeUnavailableCalendar={false}
        overlayNamespace={INDIVIDUAL_RECRUIT_INTERVIEW_NAMESPACE}
        interviewRangeSealKey={INDIVIDUAL_RECRUIT_INTERVIEW_RANGE_SEAL_KEY}
        interviewPeriodRange={interviewPeriodRange}
      />
    </section>
  )
}
