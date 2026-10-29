import { useEffect, useRef } from 'react'
import { useBlocker, type Location } from 'react-router-dom'
import { GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY } from '@/features/program/general/model/registration-flow'

/** 브라우저 뒤로/앞으로(POP)로 등록 위저드 URL(generalStep)을 벗어나는 이동인지 판별한다. */
export function isRegistrationWizardHistoryLeave(args: {
  currentLocation: Location
  nextLocation: Location
  historyAction: string
}): boolean {
  if (args.historyAction !== 'POP') return false
  if (args.currentLocation.pathname !== args.nextLocation.pathname) return true
  return !new URLSearchParams(args.nextLocation.search).has(
    GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY
  )
}

/**
 * 작성 중 브라우저 뒤로/앞으로로 위저드를 벗어나려 하면 이동을 되돌리고
 * 닫기 버튼과 같은 `requestLeave`(작성 취소 안내)를 탄다.
 * 위저드 내부 이동(단계 replace·미리보기 push/pop)은 막지 않는다.
 */
export function useRegistrationWizardHistoryLeaveGuard(
  enabled: boolean,
  requestLeave: () => void
): void {
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled
  const requestLeaveRef = useRef(requestLeave)
  requestLeaveRef.current = requestLeave
  const blocker = useBlocker(
    ({ currentLocation, nextLocation, historyAction }) =>
      enabledRef.current &&
      isRegistrationWizardHistoryLeave({ currentLocation, nextLocation, historyAction })
  )
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    blocker.reset()
    requestLeaveRef.current()
  }, [blocker])
}
