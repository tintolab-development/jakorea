import { useLayoutEffect, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  resolveUjatVolunteerInterviewScheduleDisplay,
  resolveUjatVolunteerInterviewScheduleEditSeed,
} from '@/features/program/ujat/lib/ujat-volunteer-interview-schedule-display'
import { UjatVolunteerInterviewScheduleReadonly } from '@/features/program/ujat/ui/detail-modal/info/ujat-volunteer-interview-schedule-readonly'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import type { UnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import {
  ujatVolunteerRecruitInterviewNamespace,
  ujatVolunteerRecruitInterviewRangeSealKey,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'
import { getGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  hydrateMissingVolunteerInterviewOverlay,
  listFilledVolunteerInterviewExceptionBlockIds,
} from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-sync'
import { RecruitFormVolunteerInterviewScheduleParagraph } from '@/features/template/ui/form-set/recruit-form/volunteer/paragraphs/recruit-form-volunteer-interview-schedule-paragraph'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { CmsButton } from '@/shared/ui'
import { ButtonAddIcon } from '@/shared/ui/icons/ButtonIcons'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import '@/features/template/ui/form-set/application-form/volunteer/paragraphs/volunteer-interview-available-schedule-paragraph.css'
import './interview-schedule-program.css'

const INTERVIEW_SCHEDULE_EDIT_DESCRIPTION =
  '서류 합격 시 면접이 진행됩니다. 면접이 진행 가능한 일정을 모두 선택해 주세요.'

export function UjatRecruitInterviewScheduleProgramView({
  program,
  form,
  isEdit,
  volunteerHalf,
  sectionTitle = '면접 진행 가능 일정',
  highlightParagraphId,
  isTemplateAuthoring = false,
}: {
  program: Program
  volunteerHalf?: UjatVolunteerRecruitHalf
  sectionTitle?: string
  highlightParagraphId?: string
  form?: UseFormReturn<ProgramDetailEditFormValues>
  isEdit: boolean
  /** 양식 작성 화면 — mock·미리보기 선택값을 넣지 않음 */
  isTemplateAuthoring?: boolean
}) {
  const display = resolveUjatVolunteerInterviewScheduleDisplay(program, volunteerHalf, {
    allowMockFallback: !isTemplateAuthoring,
  })
  const editSeed = resolveUjatVolunteerInterviewScheduleEditSeed(program, volunteerHalf, {
    allowMockFallback: !isTemplateAuthoring,
  })
  const interviewNamespace = volunteerHalf
    ? ujatVolunteerRecruitInterviewNamespace(volunteerHalf)
    : undefined
  const interviewRangeSealKey = volunteerHalf
    ? ujatVolunteerRecruitInterviewRangeSealKey(volunteerHalf)
    : 'recruit.volunteer.interviewRangeSeal'
  const [exceptionBlockKeys, setExceptionBlockKeys] = useState<number[]>([])
  const [exceptionScheduleAddDisabled, setExceptionScheduleAddDisabled] = useState(
    () => editSeed?.excludeNone ?? false
  )
  useLayoutEffect(() => {
    const registrationOverlay =
      program.ujatRegistrationOverlay != null &&
      typeof program.ujatRegistrationOverlay === 'object' &&
      !Array.isArray(program.ujatRegistrationOverlay)
        ? program.ujatRegistrationOverlay
        : {}
    const savedOverlay =
      program.registrationOverlay != null &&
      typeof program.registrationOverlay === 'object' &&
      !Array.isArray(program.registrationOverlay)
        ? program.registrationOverlay
        : {}
    const source = { ...savedOverlay, ...registrationOverlay }
    hydrateMissingVolunteerInterviewOverlay({
      source,
      store: 'recruit',
      namespace: interviewNamespace,
      additionalKeys: [interviewRangeSealKey],
    })
    setExceptionBlockKeys(prev => {
      if (prev.length > 0) return prev
      const ids = listFilledVolunteerInterviewExceptionBlockIds(
        { ...source, ...getGeneralRecruitOverlayRecord() },
        'recruit',
        interviewNamespace
      )
      return ids.length > 0 ? ids : prev
    })
  }, [
    interviewNamespace,
    interviewRangeSealKey,
    program.id,
    program.registrationOverlay,
    program.ujatRegistrationOverlay,
  ])

  const isFormEdit = Boolean(isEdit && form)

  return (
    <section className="ujat-recruit-interview-schedule-program-view" aria-label={sectionTitle}>
      <FormParagraphSectionHeader
        title={sectionTitle}
        surface="responseEntry"
        titleAligned
        required
        highlightParagraphId={highlightParagraphId}
        description={isFormEdit ? INTERVIEW_SCHEDULE_EDIT_DESCRIPTION : undefined}
        titleTrailing={
          isFormEdit ? (
            <div className="volunteer-interview-available-schedule__card-title-actions">
              <CmsButton
                type="button"
                variant="secondary"
                size="medium"
                width={160}
                disabled={exceptionScheduleAddDisabled}
                icon={<ButtonAddIcon aria-hidden />}
                onClick={() => setExceptionBlockKeys(prev => [...prev, Date.now()])}
              >
                예외 일정 추가
              </CmsButton>
            </div>
          ) : undefined
        }
      />
      {isFormEdit && form ? (
        <RecruitFormVolunteerInterviewScheduleParagraph
          exceptionBlockKeys={exceptionBlockKeys}
          onRemoveExceptionBlock={key =>
            setExceptionBlockKeys(prev => prev.filter(blockKey => blockKey !== key))
          }
          commonScheduleSeed={editSeed}
          onCommonExclusionChange={(state: UnavailableDatesExclusionState) =>
            setExceptionScheduleAddDisabled(state.excludeNone)
          }
          freezeUnavailableCalendar={false}
          overlayNamespace={
            volunteerHalf ? ujatVolunteerRecruitInterviewNamespace(volunteerHalf) : undefined
          }
          interviewRangeSealKey={interviewRangeSealKey}
        />
      ) : (
        <UjatVolunteerInterviewScheduleReadonly data={display} />
      )}
    </section>
  )
}
