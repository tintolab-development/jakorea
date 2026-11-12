import { GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT } from '@/features/program/general/lib/curriculum-progress-session-options'
import {
  PRE_EDUCATION_DISPLAY_LABEL,
  shouldAllowScheduleProgressGroupAdd,
  shouldUseScheduleEventBlockLayout,
} from '@/features/program/general/lib/schedule-detail-form'
import { PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import type {
  ProgramRegistrationEducationScheduleMode,
  ProgramRegistrationScheduleDetailKind,
  ProgramRegistrationSessionRoundType,
  ProgramRegistrationType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsToggle } from '@/shared/ui/cms-toggle'

import { ButtonAddIcon, ButtonClockIcon } from '@/shared/ui/icons/ButtonIcons'
import { TEACHER_TRAINING_BLOCK_LABEL } from '@/features/program/trained-teachers/lib/teacher-training-block'

export type ProgramRegistrationCurriculumTitleActionsProps = {
  variant?: 'general' | 'trainedTeachers'
  programType: ProgramRegistrationType
  sessionRoundType: ProgramRegistrationSessionRoundType
  participantOrganization: boolean
  educationFormScheduleDetail: ProgramRegistrationScheduleDetailKind
  participationScheduleDetail: ProgramRegistrationScheduleDetailKind
  ipsScheduleDetail: ProgramRegistrationScheduleDetailKind
  educationScheduleMode?: ProgramRegistrationEducationScheduleMode
  scheduleCurriculumPreEducation: boolean
  onScheduleCurriculumPreEducationChange: (checked: boolean) => void
  curriculumChartSessionCount: number
  restrictCurriculumSessionStructure?: boolean
  onAddCurriculumSession: () => void
  onAddCurriculumChartSession: () => void
  onAddScheduleCurriculumDetail: () => void
  onAddScheduleCurriculumGroup: () => void
  scheduleCurriculumGroupCount?: number
  trainedTeachersTeacherTrainingEnabled?: boolean
  onTrainedTeachersTeacherTrainingEnabledChange?: (checked: boolean) => void
}

function TitleActionsWrap({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="program-registration-paragraph__card-title-actions"
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      role="presentation"
    >
      {children}
    </div>
  )
}

/**
 * 등록 위저드·상세 수정 공통 — 교육 진행 단락 제목 줄 우측 액션
 */
export function ProgramRegistrationCurriculumTitleActions({
  variant = 'general',
  programType,
  sessionRoundType,
  participantOrganization,
  educationFormScheduleDetail,
  participationScheduleDetail,
  ipsScheduleDetail,
  educationScheduleMode = 'date',
  scheduleCurriculumPreEducation,
  onScheduleCurriculumPreEducationChange,
  curriculumChartSessionCount,
  restrictCurriculumSessionStructure = false,
  onAddCurriculumSession,
  onAddCurriculumChartSession,
  onAddScheduleCurriculumDetail,
  onAddScheduleCurriculumGroup,
  scheduleCurriculumGroupCount = 1,
  trainedTeachersTeacherTrainingEnabled = false,
  onTrainedTeachersTeacherTrainingEnabledChange,
}: ProgramRegistrationCurriculumTitleActionsProps) {
  const isScheduleEventLayout = shouldUseScheduleEventBlockLayout({
    sessionRound: sessionRoundType,
    participantOrganization,
    educationFormScheduleDetail,
    participationScheduleDetail,
    ipsScheduleDetail,
  })
  const allowProgressGroupAdd = shouldAllowScheduleProgressGroupAdd({
    sessionRound: sessionRoundType,
    educationScheduleMode,
  })
  const isTrainedTeachers = variant === 'trainedTeachers'
  const extraToggle = isTrainedTeachers ? (
    // 시안 9899:221372 · 5416:111869 토글 라벨 「교사 연수」 (교육받은 교사 전용 분기)
    <CmsToggle
      label={TEACHER_TRAINING_BLOCK_LABEL}
      checked={trainedTeachersTeacherTrainingEnabled}
      onChange={onTrainedTeachersTeacherTrainingEnabledChange}
    />
  ) : (
    <CmsToggle
      label={PRE_EDUCATION_DISPLAY_LABEL}
      checked={scheduleCurriculumPreEducation}
      onChange={onScheduleCurriculumPreEducationChange}
    />
  )

  if (programType === 'schedule') {
    if (isScheduleEventLayout) {
      return (
        <TitleActionsWrap>
          {extraToggle}
          <CmsButton
            type="button"
            variant="secondary"
            size="medium"
            icon={<ButtonAddIcon aria-hidden />}
            onClick={e => {
              e.stopPropagation()
              onAddScheduleCurriculumDetail()
            }} >
            강의 행사 일정 추가
          </CmsButton>
        </TitleActionsWrap>
      )
    }

    if (sessionRoundType === 'multi' || !allowProgressGroupAdd) {
      return (
        <TitleActionsWrap>
          {extraToggle}
          <CmsButton
            type="button"
            variant="secondary"
            size="medium"
            icon={<ButtonAddIcon aria-hidden />}
            onClick={e => {
              e.stopPropagation()
              onAddScheduleCurriculumDetail()
            }} >
            강의 세부 일정 추가
          </CmsButton>
        </TitleActionsWrap>
      )
    }

    const groupAtMax =
      scheduleCurriculumGroupCount >= PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT
    return (
      <TitleActionsWrap>
        {extraToggle}
        <CmsButton
          type="button"
          variant="secondary"
          size="medium"
          disabled={groupAtMax}
          icon={<ButtonClockIcon />}
          onClick={e => {
            e.stopPropagation()
            if (groupAtMax) return
            onAddScheduleCurriculumGroup()
          }} >
          진행 그룹 구분 추가
        </CmsButton>
        <CmsButton
          type="button"
          variant="secondary"
          size="medium"
          icon={<ButtonAddIcon aria-hidden />}
          onClick={e => {
            e.stopPropagation()
            onAddScheduleCurriculumDetail()
          }} >
          강의 세부 일정 추가
        </CmsButton>
      </TitleActionsWrap>
    )
  }

  const isMulti = sessionRoundType === 'multi'
  const curriculumChartSessionAtMax =
    !isMulti && curriculumChartSessionCount >= GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT
  return (
    <TitleActionsWrap>
      {extraToggle}
      <CmsButton
        type="button"
        variant="secondary"
        size="medium"
        disabled={restrictCurriculumSessionStructure || curriculumChartSessionAtMax}
        icon={<ButtonAddIcon aria-hidden />}
        onClick={e => {
          e.stopPropagation()
          if (restrictCurriculumSessionStructure || curriculumChartSessionAtMax) return
          if (isMulti) onAddCurriculumSession()
          else onAddCurriculumChartSession()
        }} >
        {isMulti ? '강의 진행 회차 추가' : '강의 진행 차시 추가'}
      </CmsButton>
    </TitleActionsWrap>
  )
}
