import { useCallback, useRef } from 'react'
import type { ProgramRegistrationEducationScheduleMode } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import {
  getProgramRegistrationOverlayRecord,
  patchProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'

export type EducationScheduleSettingsMode = ProgramRegistrationEducationScheduleMode

export function educationScheduleModeStashKey(
  overlayKeyPrefix: string,
  mode: EducationScheduleSettingsMode
): string {
  return mode === 'date'
    ? `${overlayKeyPrefix}.scheduleLinesByDate`
    : `${overlayKeyPrefix}.scheduleLinesByPeriod`
}

export function readEducationScheduleLineList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

export function swapEducationScheduleLinesForMode(input: {
  currentMode: EducationScheduleSettingsMode
  nextMode: EducationScheduleSettingsMode
  currentLines: readonly string[]
  stashedNextModeLines: readonly string[] | undefined
}): { nextLines: string[]; stashCurrentModeLines: string[] } | null {
  if (input.currentMode === input.nextMode) return null
  return {
    stashCurrentModeLines: [...input.currentLines],
    nextLines: [...(input.stashedNextModeLines ?? [])],
  }
}

export function applyEducationScheduleModeLineSwap(input: {
  overlayKeyPrefix: string
  currentMode: EducationScheduleSettingsMode
  nextMode: EducationScheduleSettingsMode
}): void {
  const swapped = swapEducationScheduleLinesForMode({
    currentMode: input.currentMode,
    nextMode: input.nextMode,
    currentLines: readEducationScheduleLineList(
      getProgramRegistrationOverlayRecord()[`${input.overlayKeyPrefix}.scheduleLines`]
    ),
    stashedNextModeLines: readEducationScheduleLineList(
      getProgramRegistrationOverlayRecord()[
        educationScheduleModeStashKey(input.overlayKeyPrefix, input.nextMode)
      ]
    ),
  })
  if (!swapped) return
  patchProgramRegistrationOverlay({
    [educationScheduleModeStashKey(input.overlayKeyPrefix, input.currentMode)]:
      swapped.stashCurrentModeLines,
    [`${input.overlayKeyPrefix}.scheduleLines`]: swapped.nextLines,
  })
}

/** 폼 수정 — 세션 동안 모드별 예정일 목록을 보관하고 라디오 전환 시 교체 */
export function useEducationScheduleModeLineStash() {
  const stashRef = useRef<{ date: string[]; period: string[] }>({
    date: [],
    period: [],
  })

  return useCallback(
    (
      currentMode: EducationScheduleSettingsMode,
      nextMode: EducationScheduleSettingsMode,
      currentLines: readonly string[]
    ): string[] => {
      const swapped = swapEducationScheduleLinesForMode({
        currentMode,
        nextMode,
        currentLines,
        stashedNextModeLines: stashRef.current[nextMode],
      })
      if (!swapped) return [...currentLines]
      stashRef.current[currentMode] = swapped.stashCurrentModeLines
      return swapped.nextLines
    },
    []
  )
}
