import { useState } from 'react'
import { CmsButton } from '@/shared/ui'
import type { DateValue } from '@/types'
import type { ProgramRegistrationEducationScheduleMode } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { useProgramRegistrationOverlayKv } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { EducationScheduleChangeModal } from '@/features/program/shared/ui/education-schedule-change-modal'
import {
  educationOperationRangeSealKeyFromSchedulePrefix,
  type EducationOperationRangeSeal,
} from '@/features/program/shared/lib/education-schedule-change'

const EMPTY_SCHEDULE_LINES: string[] = []

type EducationScheduleChangeTitleActionProps = {
  scheduleLines?: readonly string[]
  onApply?: (nextLines: string[]) => void
  overlayKeyPrefix?: string
  educationScheduleMode?: ProgramRegistrationEducationScheduleMode
  autoFillFromScheduleGroupTimes?: boolean
  lockCalendarTogglesToScheduleMode?: boolean
  operationStart?: DateValue | null
  operationEnd?: DateValue | null
}

function EducationScheduleChangeOverlayTitleAction({
  overlayKeyPrefix,
  educationScheduleMode,
  autoFillFromScheduleGroupTimes,
  lockCalendarTogglesToScheduleMode,
  operationStart,
  operationEnd,
}: {
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

function EducationScheduleChangeTitleActionView({
  scheduleLines = EMPTY_SCHEDULE_LINES,
  onApply,
  educationScheduleMode,
  operationStart,
  operationEnd,
}: Omit<EducationScheduleChangeTitleActionProps, 'overlayKeyPrefix'>) {
  const [open, setOpen] = useState(false)

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
        educationScheduleMode={educationScheduleMode}
        operationStart={operationStart}
        operationEnd={operationEnd}
        onCancel={() => setOpen(false)}
        onConfirm={nextLines => {
          onApply?.(nextLines)
          setOpen(false)
        }}
      />
    </div>
  )
}

/** 공통 정보 · 교육 진행 일정 설정 — 수정 모드 섹션 헤더 우측 */
export function EducationScheduleChangeTitleAction({
  overlayKeyPrefix,
  scheduleLines,
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
      scheduleLines={scheduleLines}
      onApply={onApply}
      educationScheduleMode={educationScheduleMode}
      autoFillFromScheduleGroupTimes={autoFillFromScheduleGroupTimes}
      lockCalendarTogglesToScheduleMode={lockCalendarTogglesToScheduleMode}
      operationStart={operationStart}
      operationEnd={operationEnd}
    />
  )
}
