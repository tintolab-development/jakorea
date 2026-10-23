import { useCallback, useEffect, useRef, useState } from 'react'
import { isRegistrationWizardVisitDirty } from '@/features/program/general/lib/registration-wizard-visit'

export function useRegistrationWizardLeaveGuard(args: {
  open: boolean
  onLeave: () => void
  programType?: string
  getOverlayVersion?: () => number
  /** Gemini 등 visit 스냅샷 대신 자체 dirty 판별이 있으면 우선한다. */
  isDirtyOverride?: () => boolean
}) {
  const { open, onLeave, programType, getOverlayVersion, isDirtyOverride } = args
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  const overlayBaselineRef = useRef(0)

  useEffect(() => {
    if (!open) {
      setLeaveConfirmOpen(false)
      return
    }
    overlayBaselineRef.current = getOverlayVersion?.() ?? 0
  }, [open, programType, getOverlayVersion])

  const markLeaveBaseline = useCallback(() => {
    overlayBaselineRef.current = getOverlayVersion?.() ?? 0
  }, [getOverlayVersion])

  const isLeaveDirty = useCallback(() => {
    if (!open) return false
    if (isDirtyOverride?.()) return true
    if (programType != null && isRegistrationWizardVisitDirty(programType)) return true
    if (
      getOverlayVersion != null &&
      getOverlayVersion() !== overlayBaselineRef.current
    ) {
      return true
    }
    return false
  }, [open, programType, getOverlayVersion, isDirtyOverride])

  const requestLeave = useCallback(() => {
    if (isLeaveDirty()) {
      setLeaveConfirmOpen(true)
      return
    }
    onLeave()
  }, [isLeaveDirty, onLeave])

  const confirmLeave = useCallback(() => {
    setLeaveConfirmOpen(false)
    onLeave()
  }, [onLeave])

  const cancelLeave = useCallback(() => {
    setLeaveConfirmOpen(false)
  }, [])

  return {
    leaveConfirmOpen,
    requestLeave,
    confirmLeave,
    cancelLeave,
    markLeaveBaseline,
  }
}
