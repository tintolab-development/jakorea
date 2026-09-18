import type { VolunteerInterviewScheduleEditSeed } from '@/features/program/shared/lib/volunteer-interview-schedule-edit-seed'
import type { UjatRecruitParagraphProps } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import {
  isUjatRecruitProgramContext,
  resolveUjatRecruitParagraphMode,
} from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import { UjatRecruitInterviewScheduleProgramView } from '@/features/program/ujat/ui/detail-modal/info/recruit-paragraph-views/interview-schedule-program'
import type { UnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import { RecruitFormVolunteerInterviewScheduleParagraph } from '@/features/template/ui/form-set/recruit-form/volunteer/paragraphs/recruit-form-volunteer-interview-schedule-paragraph'

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
      />
    )
  }

  // 양식 편집기: 카드 헤더(타이틀·설명·예외 일정 추가)는 LeftPanel이 담당 — 본문만 렌더
  return (
    <RecruitFormVolunteerInterviewScheduleParagraph
      exceptionScheduleCount={exceptionScheduleCount}
      commonScheduleSeed={commonScheduleSeed}
      onCommonExclusionChange={onCommonExclusionChange}
      freezeUnavailableCalendar={freezeUnavailableCalendar}
    />
  )
}
