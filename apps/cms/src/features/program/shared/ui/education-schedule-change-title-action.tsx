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
  autoFillFromScheduleGroupTimes?: boolean
  lockCalendarTogglesToScheduleMode?: boolean
  operationStart?: DateValue | null
  operationEnd?: DateValue | null
}

function EducationScheduleChangeOverlayTitleAction({
  programId,
  overlayKeyPrefix,
  educationScheduleMode,
  autoFillFromScheduleGroupTimes,
  lockCalendarTogglesToScheduleMode,
  operationStart,
  operationEnd,
}: {
  programId?: string | null
  overlayKeyPrefix: string
  educationScheduleMode?: ProgramRegistrationEducationScheduleMode
  autoFillFromScheduleGroupTimes?: boolean
  lockCalendarTogglesToScheduleMode?: boolean
  operationStart?: DateValue | null
  operationEnd?: DateValue | null
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
      autoFillFromScheduleGroupTimes={autoFillFromScheduleGroupTimes}
      lockCalendarTogglesToScheduleMode={lockCalendarTogglesToScheduleMode}
      operationStart={operationRangeSeal?.start ?? operationStart}
      operationEnd={operationRangeSeal?.end ?? operationEnd}
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
  operationStart,
  operationEnd,
}: Omit<EducationScheduleChangeTitleActionProps, 'overlayKeyPrefix'>) {
  const [open, setOpen] = useState(false)
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
        operationStart={operationStart}
        operationEnd={operationEnd}
        submitting={submitting}
        onCancel={() => {
          if (submitting) return
          setOpen(false)
        }}
        onConfirm={async nextLines => {
          const id = programId?.trim()
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
  autoFillFromScheduleGroupTimes,
  lockCalendarTogglesToScheduleMode,
  operationStart,
  operationEnd,
}: EducationScheduleChangeTitleActionProps) {
  if (overlayKeyPrefix) {
    return (
      <EducationScheduleChangeOverlayTitleAction
        programId={programId}
        overlayKeyPrefix={overlayKeyPrefix}
        educationScheduleMode={educationScheduleMode}
        autoFillFromScheduleGroupTimes={autoFillFromScheduleGroupTimes}
        lockCalendarTogglesToScheduleMode={lockCalendarTogglesToScheduleMode}
        operationStart={operationStart}
        operationEnd={operationEnd}
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
      autoFillFromScheduleGroupTimes={autoFillFromScheduleGroupTimes}
      lockCalendarTogglesToScheduleMode={lockCalendarTogglesToScheduleMode}
      operationStart={operationStart}
      operationEnd={operationEnd}
    />
  )
}
