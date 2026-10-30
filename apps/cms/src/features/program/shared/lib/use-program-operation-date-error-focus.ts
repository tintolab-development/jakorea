import { useEffect, useRef } from 'react'
import {
  PROGRAM_OPERATION_DATE_FOCUS_EVENT,
  readProgramOperationDateFocusEvent,
  scrollToProgramOperationDateField,
  type ProgramOperationDateFocus,
} from '@/features/program/shared/lib/program-date-outside-open-period-alert'

export function useProgramOperationDateErrorFocus(
  active: boolean,
  onFocus: (focus: ProgramOperationDateFocus) => void
): void {
  const onFocusRef = useRef(onFocus)
  onFocusRef.current = onFocus

  useEffect(() => {
    if (!active || typeof window === 'undefined') return
    const handleFocus = (event: Event) => {
      const focus = readProgramOperationDateFocusEvent(event)
      if (focus == null) return
      onFocusRef.current(focus)
      window.setTimeout(() => scrollToProgramOperationDateField(focus.highlightKeys), 0)
      window.setTimeout(() => scrollToProgramOperationDateField(focus.highlightKeys), 80)
    }
    window.addEventListener(PROGRAM_OPERATION_DATE_FOCUS_EVENT, handleFocus)
    return () => window.removeEventListener(PROGRAM_OPERATION_DATE_FOCUS_EVENT, handleFocus)
  }, [active])
}
