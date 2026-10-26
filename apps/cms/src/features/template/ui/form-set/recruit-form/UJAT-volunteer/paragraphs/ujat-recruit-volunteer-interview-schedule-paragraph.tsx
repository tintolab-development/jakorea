import type { VolunteerInterviewScheduleEditSeed } from '@/features/program/shared/lib/volunteer-interview-schedule-edit-seed'
import type { UjatRecruitParagraphProps } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import {
  isUjatRecruitProgramContext,
  resolveUjatRecruitParagraphMode,
} from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import { UjatRecruitInterviewScheduleProgramView } from '@/features/program/ujat/ui/detail-modal/info/recruit-paragraph-views/interview-schedule-program'
import type { UnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import {
  ujatVolunteerRecruitInterviewNamespace,
  ujatVolunteerRecruitInterviewRangeSealKey,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'
import { useUjatRecruitTemplateInterviewBridge } from '@/features/program/ujat/lib/ujat-recruit-template-typed-state'
import { RecruitFormVolunteerInterviewScheduleParagraph } from '@/features/template/ui/form-set/recruit-form/volunteer/paragraphs/recruit-form-volunteer-interview-schedule-paragraph'

function UjatRecruitVolunteerTypedInterviewSchedule({
  templateCode,
  half,
  exceptionScheduleCount,
  commonScheduleSeed,
  onCommonExclusionChange,
  freezeUnavailableCalendar,
}: {
  templateCode: string
  half: 'h1' | 'h2'
  exceptionScheduleCount: number
  commonScheduleSeed?: VolunteerInterviewScheduleEditSeed
  onCommonExclusionChange?: (state: UnavailableDatesExclusionState) => void
  freezeUnavailableCalendar: boolean
}) {
  useUjatRecruitTemplateInterviewBridge({ templateCode, volunteerHalf: half })
  return (
    <RecruitFormVolunteerInterviewScheduleParagraph
      exceptionScheduleCount={exceptionScheduleCount}
      commonScheduleSeed={commonScheduleSeed}
      onCommonExclusionChange={onCommonExclusionChange}
      freezeUnavailableCalendar={freezeUnavailableCalendar}
      typedTemplateAuthoring
      overlayNamespace={ujatVolunteerRecruitInterviewNamespace(half)}
      interviewRangeSealKey={ujatVolunteerRecruitInterviewRangeSealKey(half)}
    />
  )
}

/** UJAT 프로그램 봉사자 모집 폼 — 면접 진행 가능 일정 */
export function UjatRecruitVolunteerInterviewScheduleParagraph({
  exceptionScheduleCount = 0,
  commonScheduleSeed,
  onCommonExclusionChange,
  freezeUnavailableCalendar = false,
  ...props
}: UjatRecruitParagraphProps & {
  exceptionScheduleCount?: number
  commonScheduleSeed?: VolunteerInterviewScheduleEditSeed
  onCommonExclusionChange?: (state: UnavailableDatesExclusionState) => void
  freezeUnavailableCalendar?: boolean
}) {
  if (isUjatRecruitProgramContext(props) && props.program) {
    const mode = resolveUjatRecruitParagraphMode(props)
    return (
      <UjatRecruitInterviewScheduleProgramView
        program={props.program}
        form={props.form}
        isEdit={mode === 'edit'}
        volunteerHalf={props.volunteerHalf}
        sectionTitle={props.sectionTitle}
        highlightParagraphId={props.highlightParagraphId}
      />
    )
  }

  const half = props.volunteerHalf ?? 'h1'
  if (props.templateAuthoring && props.templateCode) {
    return (
      <UjatRecruitVolunteerTypedInterviewSchedule
        templateCode={props.templateCode}
        half={half}
        exceptionScheduleCount={exceptionScheduleCount}
        commonScheduleSeed={commonScheduleSeed}
        onCommonExclusionChange={onCommonExclusionChange}
        freezeUnavailableCalendar={freezeUnavailableCalendar}
      />
    )
  }
  return (
    <RecruitFormVolunteerInterviewScheduleParagraph
      exceptionScheduleCount={exceptionScheduleCount}
      commonScheduleSeed={commonScheduleSeed}
      onCommonExclusionChange={onCommonExclusionChange}
      freezeUnavailableCalendar={freezeUnavailableCalendar}
      overlayNamespace={ujatVolunteerRecruitInterviewNamespace(half)}
      interviewRangeSealKey={ujatVolunteerRecruitInterviewRangeSealKey(half)}
    />
  )
}
