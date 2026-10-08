import { ClockCircleOutlined } from '@ant-design/icons'
import { GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT } from '@/features/program/general/lib/curriculum-progress-session-options'
import {
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

import { ButtonAddIcon } from '@/shared/ui/icons/ButtonIcons'

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

  if (variant === 'trainedTeachers') {
    const teacherTrainingToggle = (
      <CmsToggle
        label="교육 연수"
        checked={trainedTeachersTeacherTrainingEnabled}
        onChange={onTrainedTeachersTeacherTrainingEnabledChange}
      />
    )

    if (programType === 'schedule') {
      const addScheduleLabel = isScheduleEventLayout ? '강의 행사 일정 추가' : '강의 세부 일정 추가'
      return (
        <TitleActionsWrap>
          {teacherTrainingToggle}
          {sessionRoundType === 'multi' || !allowProgressGroupAdd || isScheduleEventLayout ? (
            <CmsButton
              type="button"
              variant="secondary"
              size="medium"
              width={160}
              icon={<ButtonAddIcon aria-hidden />}
              onClick={e => {
                e.stopPropagation()
                onAddScheduleCurriculumDetail()
              }}
            >
              {addScheduleLabel}
            </CmsButton>
          ) : (
            <>
              <CmsButton
                type="button"
                variant="secondary"
                size="medium"
                width={160}
                icon={<ButtonAddIcon aria-hidden />}
                onClick={e => {
                  e.stopPropagation()
                  onAddScheduleCurriculumDetail()
                }}
              >
                {addScheduleLabel}
              </CmsButton>
              <CmsButton
                type="button"
                variant="secondary"
                size="medium"
                width={160}
                icon={<ButtonAddIcon aria-hidden />}
                onClick={e => {
                  e.stopPropagation()
                  onAddScheduleCurriculumGroup()
                }}
              >
                진행 그룹 추가
              </CmsButton>
            </>
          )}
        </TitleActionsWrap>
      )
    }

    const curriculumChartSessionAtMax =
      curriculumChartSessionCount >= GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT
    return (
      <TitleActionsWrap>
        {teacherTrainingToggle}
        <CmsButton
          type="button"
          variant="secondary"
          size="medium"
          width={160}
          disabled={curriculumChartSessionAtMax}
          icon={<ButtonAddIcon aria-hidden />}
          onClick={e => {
            e.stopPropagation()
            if (curriculumChartSessionAtMax) return
            onAddCurriculumChartSession()
          }}
        >
          강의 진행 차시 추가
        </CmsButton>
      </TitleActionsWrap>
    )
  }

  const preEducationToggle = (
    <CmsToggle
      label="사전 교육"
      checked={scheduleCurriculumPreEducation}
      onChange={onScheduleCurriculumPreEducationChange}
    />
  )

  if (programType === 'schedule') {
    if (isScheduleEventLayout) {
      return (
        <TitleActionsWrap>
          {preEducationToggle}
          <CmsButton
            type="button"
            variant="secondary"
            size="medium"
            width={160}
            icon={<ButtonAddIcon aria-hidden />}
            onClick={e => {
              e.stopPropagation()
              onAddScheduleCurriculumDetail()
            }}
          >
            강의 행사 일정 추가
          </CmsButton>
        </TitleActionsWrap>
      )
    }

    if (sessionRoundType === 'multi' || !allowProgressGroupAdd) {
      return (
        <TitleActionsWrap>
          {preEducationToggle}
          <CmsButton
            type="button"
            variant="secondary"
            size="medium"
            width={160}
            icon={<ButtonAddIcon aria-hidden />}
            onClick={e => {
              e.stopPropagation()
              onAddScheduleCurriculumDetail()
            }}
          >
            강의 세부 일정 추가
          </CmsButton>
        </TitleActionsWrap>
      )
    }

    const groupAtMax =
      scheduleCurriculumGroupCount >= PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT
    return (
      <TitleActionsWrap>
        {preEducationToggle}
        <CmsButton
          type="button"
          variant="secondary"
          size="medium"
          width={160}
          disabled={groupAtMax}
          icon={<ClockCircleOutlined aria-hidden />}
          onClick={e => {
            e.stopPropagation()
            if (groupAtMax) return
            onAddScheduleCurriculumGroup()
          }}
        >
          진행 그룹 구분 추가
        </CmsButton>
        <CmsButton
          type="button"
          variant="secondary"
          size="medium"
          width={160}
          icon={<ButtonAddIcon aria-hidden />}
          onClick={e => {
            e.stopPropagation()
            onAddScheduleCurriculumDetail()
          }}
        >
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
      {preEducationToggle}
      <CmsButton
        type="button"
        variant="secondary"
        size="medium"
        width={isMulti ? 160 : 180}
        disabled={restrictCurriculumSessionStructure || curriculumChartSessionAtMax}
        icon={<ButtonAddIcon aria-hidden />}
        onClick={e => {
          e.stopPropagation()
          if (restrictCurriculumSessionStructure || curriculumChartSessionAtMax) return
          if (isMulti) onAddCurriculumSession()
          else onAddCurriculumChartSession()
        }}
      >
        {isMulti ? '강의 진행 회차 추가' : '강의 진행 차시 추가'}
      </CmsButton>
    </TitleActionsWrap>
  )
}
