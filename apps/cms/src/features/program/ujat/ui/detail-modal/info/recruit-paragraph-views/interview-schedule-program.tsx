import { useLayoutEffect, useRef, useState } from 'react'
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
import {
  getRecruitTypedInterviewRecord,
  hydrateMissingVolunteerInterviewOverlay,
  listFilledVolunteerInterviewExceptionBlockIds,
  setRecruitTypedInterviewRecordBridge,
} from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-sync'
import { pickUjatVolunteerRecruitmentRow } from '@/features/program/ujat/lib/ujat-recruit-display-program'
import {
  interviewConfigFromLegacyOverlay,
  interviewConfigToLegacyOverlayRecord,
  overlayRecordToInterviewConfig,
  parseRecruitmentInterviewConfig,
} from '@/features/program/ujat/lib/recruitment-typed-contract'
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
  sectionTitle,
  highlightParagraphId,
  hideSectionHeader = false,
  exceptionScheduleCount = 0,
  isTemplateAuthoring = false,
}: {
  program: Program
  volunteerHalf?: UjatVolunteerRecruitHalf
  sectionTitle?: string
  highlightParagraphId?: string
  hideSectionHeader?: boolean
  /** 등록 위저드 단락 헤더「예외 일정 추가」와 연동 */
  exceptionScheduleCount?: number
  form?: UseFormReturn<ProgramDetailEditFormValues>
  isEdit: boolean
  /** 양식 작성 화면 — mock·미리보기 선택값을 넣지 않음 */
  isTemplateAuthoring?: boolean
}) {
  const display = resolveUjatVolunteerInterviewScheduleDisplay(program, volunteerHalf, {
    allowOverlayFallback: isTemplateAuthoring,
  })
  const editSeed = resolveUjatVolunteerInterviewScheduleEditSeed(program, volunteerHalf, {
    allowOverlayFallback: isTemplateAuthoring,
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
  const programRef = useRef(program)
  programRef.current = program
  useLayoutEffect(() => {
    const programSnapshot = programRef.current
    if (isTemplateAuthoring) {
      const registrationOverlay =
        programSnapshot.ujatRegistrationOverlay != null &&
        typeof programSnapshot.ujatRegistrationOverlay === 'object' &&
        !Array.isArray(programSnapshot.ujatRegistrationOverlay)
          ? programSnapshot.ujatRegistrationOverlay
          : {}
      const savedOverlay =
        programSnapshot.registrationOverlay != null &&
        typeof programSnapshot.registrationOverlay === 'object' &&
        !Array.isArray(programSnapshot.registrationOverlay)
          ? programSnapshot.registrationOverlay
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
          source,
          'recruit',
          interviewNamespace
        )
        return ids.length > 0 ? ids : prev
      })
      return
    }

    if (!isEdit || !form) {
      setRecruitTypedInterviewRecordBridge(null)
      return
    }

    const ns = interviewNamespace ?? 'recruit.volunteer.interview'
    const fromForm = parseRecruitmentInterviewConfig(form.getValues('volunteerInterviewConfig'))
    const row = volunteerHalf
      ? pickUjatVolunteerRecruitmentRow(programSnapshot, volunteerHalf)
      : undefined
    const fromRow = row?.interviewConfig
    const fromLegacy =
      row && !Object.prototype.hasOwnProperty.call(row, 'interviewConfig')
        ? interviewConfigFromLegacyOverlay(programSnapshot.ujatRegistrationOverlay, ns)
        : null
    const seed = fromForm ?? fromRow ?? fromLegacy
    const record = interviewConfigToLegacyOverlayRecord(seed, ns)
    setRecruitTypedInterviewRecordBridge(record)
    setExceptionBlockKeys(prev => {
      if (prev.length > 0) return prev
      const ids = listFilledVolunteerInterviewExceptionBlockIds(record, 'recruit', ns)
      return ids.length > 0 ? ids : prev
    })
    return () => {
      const live = getRecruitTypedInterviewRecord()
      if (live) {
        form.setValue('volunteerInterviewConfig', overlayRecordToInterviewConfig(live, ns), {
          shouldDirty: true,
        })
      }
      setRecruitTypedInterviewRecordBridge(null)
    }
  }, [
    form,
    interviewNamespace,
    interviewRangeSealKey,
    isEdit,
    isTemplateAuthoring,
    volunteerHalf,
  ])

  const isFormEdit = Boolean(isEdit && form)
  const resolvedSectionTitle = sectionTitle?.trim() || '면접 진행 가능 일정'
  const useParagraphHeadingExceptionControl = hideSectionHeader && isFormEdit

  return (
    <section
      className="ujat-recruit-interview-schedule-program-view"
      aria-label={resolvedSectionTitle}
    >
      {!hideSectionHeader && sectionTitle?.trim() ? (
        <FormParagraphSectionHeader
          title={sectionTitle.trim()}
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
      ) : null}
      {isFormEdit && form ? (
        <RecruitFormVolunteerInterviewScheduleParagraph
          exceptionScheduleCount={
            useParagraphHeadingExceptionControl ? exceptionScheduleCount : 0
          }
          exceptionBlockKeys={
            useParagraphHeadingExceptionControl ? undefined : exceptionBlockKeys
          }
          onRemoveExceptionBlock={
            useParagraphHeadingExceptionControl
              ? undefined
              : key => setExceptionBlockKeys(prev => prev.filter(blockKey => blockKey !== key))
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
