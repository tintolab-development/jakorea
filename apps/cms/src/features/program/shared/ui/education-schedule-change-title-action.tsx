import { useState } from 'react'
import { isAxiosError } from 'axios'
import { CmsButton } from '@/shared/ui'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import type { DateValue } from '@/types'
import type { ProgramRegistrationEducationScheduleMode } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { useProgramRegistrationOverlayKv } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { EducationScheduleChangeModal } from '@/features/program/shared/ui/education-schedule-change-modal'
import { patchProgramSchedulesSameDate } from '@/features/program/shared/api/program-same-date-schedule-api'
import {
  buildSameDateScheduleChangePairs,
  educationOperationRangeSealKeyFromSchedulePrefix,
  findEducationScheduleChangePeriodIssues,
  type EducationOperationRangeSeal,
} from '@/features/program/shared/lib/education-schedule-change'
import { extractApiErrorMessage } from '@/shared/lib/extract-api-error-message'

const EMPTY_SCHEDULE_LINES: string[] = []

type EducationScheduleChangeTitleActionProps = {
  programId?: string | null
  scheduleLines?: readonly string[]
  scheduleRowLabels?: readonly string[]
  onApply?: (nextLines: string[]) => void
  overlayKeyPrefix?: string
  educationScheduleMode?: ProgramRegistrationEducationScheduleMode
  /** 있으면 「교육 진행 일정 선택」과 같은 데이트피커를 쓴다. */
  educationStructure?: 'curriculum' | 'schedule'
  participantOrganization?: boolean
  sessionRound?: 'single' | 'multi'
  autoFillFromScheduleGroupTimes?: boolean
  lockCalendarTogglesToScheduleMode?: boolean
  operationStart?: DateValue | null
  operationEnd?: DateValue | null
  /** 수정 폼의 기간과 별개로, API가 현재 저장된 기간을 검증할 때 사용할 기간 */
  persistedOperationStart?: DateValue | null
  persistedOperationEnd?: DateValue | null
  /**
   * `general`: 일반 프로그램 상세 시안 — 팝업 확인 버튼 「선택 완료」, 적용 후 「변경 완료」 안내.
   * 생략(`default`) 시 기존 동작(1사1교 등) 유지.
   */
  variant?: EducationScheduleChangeVariant
}

type EducationScheduleChangeVariant = 'default' | 'general'

const EDUCATION_SCHEDULE_CHANGE_COMPLETED_TITLE = '변경 완료'
const EDUCATION_SCHEDULE_CHANGE_COMPLETED_BODY = '변경되었습니다.'

function EducationScheduleChangeOverlayTitleAction({
  programId,
  overlayKeyPrefix,
  educationScheduleMode,
  educationStructure,
  participantOrganization,
  sessionRound,
  autoFillFromScheduleGroupTimes,
  lockCalendarTogglesToScheduleMode,
  operationStart,
  operationEnd,
  persistedOperationStart,
  persistedOperationEnd,
  variant,
}: {
  programId?: string | null
  overlayKeyPrefix: string
  educationScheduleMode?: ProgramRegistrationEducationScheduleMode
  educationStructure?: 'curriculum' | 'schedule'
  participantOrganization?: boolean
  sessionRound?: 'single' | 'multi'
  autoFillFromScheduleGroupTimes?: boolean
  lockCalendarTogglesToScheduleMode?: boolean
  operationStart?: DateValue | null
  operationEnd?: DateValue | null
  persistedOperationStart?: DateValue | null
  persistedOperationEnd?: DateValue | null
  variant?: EducationScheduleChangeVariant
}) {
  const [lines, setLines] = useProgramRegistrationOverlayKv<string[]>(
    `${overlayKeyPrefix}.scheduleLines`,
    EMPTY_SCHEDULE_LINES
  )
  const [operationRangeSeal] = useProgramRegistrationOverlayKv<EducationOperationRangeSeal>(
    educationOperationRangeSealKeyFromSchedulePrefix(overlayKeyPrefix),
    null
  )
  return (
    <EducationScheduleChangeTitleActionView
      programId={programId}
      scheduleLines={lines}
      onApply={setLines}
      educationScheduleMode={educationScheduleMode}
      educationStructure={educationStructure}
      participantOrganization={participantOrganization}
      sessionRound={sessionRound}
      autoFillFromScheduleGroupTimes={autoFillFromScheduleGroupTimes}
      lockCalendarTogglesToScheduleMode={lockCalendarTogglesToScheduleMode}
      operationStart={operationRangeSeal?.start ?? operationStart}
      operationEnd={operationRangeSeal?.end ?? operationEnd}
      persistedOperationStart={persistedOperationStart}
      persistedOperationEnd={persistedOperationEnd}
      variant={variant}
    />
  )
}

async function applySameDateInstitutionScheduleChanges(
  programId: string,
  previousLines: readonly string[],
  nextLines: readonly string[]
): Promise<void> {
  const pairs = buildSameDateScheduleChangePairs(previousLines, nextLines)
  for (const pair of pairs) {
    await patchProgramSchedulesSameDate(programId, pair)
  }
}

function EducationScheduleChangeTitleActionView({
  programId,
  scheduleLines = EMPTY_SCHEDULE_LINES,
  scheduleRowLabels,
  onApply,
  educationScheduleMode,
  educationStructure,
  participantOrganization,
  sessionRound,
  operationStart,
  operationEnd,
  persistedOperationStart,
  persistedOperationEnd,
  variant = 'default',
}: Omit<EducationScheduleChangeTitleActionProps, 'overlayKeyPrefix'>) {
  const [open, setOpen] = useState(false)
  const isGeneralVariant = variant === 'general'
  const [submitting, setSubmitting] = useState(false)

  return (
    <div
      className="program-registration-paragraph__card-title-actions"
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      role="presentation"
    >
      <CmsButton type="button" variant="secondary" size="medium" onClick={() => setOpen(true)}>
        일정 변경
      </CmsButton>
      <EducationScheduleChangeModal
        open={open}
        scheduleLines={scheduleLines}
        scheduleRowLabels={scheduleRowLabels}
        educationScheduleMode={educationScheduleMode}
        educationStructure={educationStructure}
        participantOrganization={participantOrganization}
        sessionRound={sessionRound}
        operationStart={operationStart}
        operationEnd={operationEnd}
        submitting={submitting}
        confirmLabel={isGeneralVariant ? '선택 완료' : undefined}
        onCancel={() => {
          if (submitting) return
          setOpen(false)
        }}
        onConfirm={async nextLines => {
          const id = programId?.trim()
          const periodIssues = findEducationScheduleChangePeriodIssues(
            scheduleLines,
            nextLines,
            persistedOperationStart ?? operationStart,
            persistedOperationEnd ?? operationEnd
          ).filter(issue => issue.targetOutsideOperationRange)
          if (periodIssues.length > 0) {
            const dates = periodIssues
              .map(issue => `${issue.fromDate} → ${issue.toDate}`)
              .join(', ')
            cmsAlertModal.show({
              title: '교육 일정 변경 안내',
              content: `변경 대상 일정(${dates})이 현재 저장된 사업 운영기간 밖입니다.\n사업 운영기간을 먼저 저장한 후 교육 일정 변경을 다시 시도해 주세요.`,
            })
            return
          }
          if (id) {
            setSubmitting(true)
            try {
              await applySameDateInstitutionScheduleChanges(id, scheduleLines, nextLines)
            } catch (error) {
              const responseData = isAxiosError(error) ? error.response?.data : undefined
              const httpStatus = isAxiosError(error) ? error.response?.status : undefined
              cmsAlertModal.show({
                title: '일정 변경 실패',
                content: extractApiErrorMessage(responseData, {
                  httpStatus,
                  fallback: '교육 진행 일정을 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.',
                }),
              })
              return
            } finally {
              setSubmitting(false)
            }
          }
          onApply?.(nextLines)
          setOpen(false)
          if (isGeneralVariant) {
            cmsAlertModal.show({
              title: EDUCATION_SCHEDULE_CHANGE_COMPLETED_TITLE,
              content: EDUCATION_SCHEDULE_CHANGE_COMPLETED_BODY,
            })
          }
        }}
      />
    </div>
  )
}

/** 공통 정보 · 교육 진행 일정 설정 — 수정 모드 섹션 헤더 우측 */
export function EducationScheduleChangeTitleAction({
  programId,
  overlayKeyPrefix,
  scheduleLines,
  scheduleRowLabels,
  onApply,
  educationScheduleMode,
  educationStructure,
  participantOrganization,
  sessionRound,
  autoFillFromScheduleGroupTimes,
  lockCalendarTogglesToScheduleMode,
  operationStart,
  operationEnd,
  persistedOperationStart,
  persistedOperationEnd,
  variant,
}: EducationScheduleChangeTitleActionProps) {
  if (overlayKeyPrefix) {
    return (
      <EducationScheduleChangeOverlayTitleAction
        programId={programId}
        overlayKeyPrefix={overlayKeyPrefix}
        educationScheduleMode={educationScheduleMode}
        educationStructure={educationStructure}
        participantOrganization={participantOrganization}
        sessionRound={sessionRound}
        autoFillFromScheduleGroupTimes={autoFillFromScheduleGroupTimes}
        lockCalendarTogglesToScheduleMode={lockCalendarTogglesToScheduleMode}
        operationStart={operationStart}
        operationEnd={operationEnd}
        persistedOperationStart={persistedOperationStart}
        persistedOperationEnd={persistedOperationEnd}
        variant={variant}
      />
    )
  }
  return (
    <EducationScheduleChangeTitleActionView
      programId={programId}
      scheduleLines={scheduleLines}
      scheduleRowLabels={scheduleRowLabels}
      onApply={onApply}
      educationScheduleMode={educationScheduleMode}
      educationStructure={educationStructure}
      participantOrganization={participantOrganization}
      sessionRound={sessionRound}
      autoFillFromScheduleGroupTimes={autoFillFromScheduleGroupTimes}
      lockCalendarTogglesToScheduleMode={lockCalendarTogglesToScheduleMode}
      operationStart={operationStart}
      operationEnd={operationEnd}
      persistedOperationStart={persistedOperationStart}
      persistedOperationEnd={persistedOperationEnd}
      variant={variant}
    />
  )
}
