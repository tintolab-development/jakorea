/**
 * 프로그램 관리 — Mock 제거 후 API 미연동/비활성 구간 안내
 * 빈 목록과 함께 AlertModal을 1회(세션·featureKey당) 표시한다.
 */

import { useEffect } from 'react'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'

export const PROGRAM_API_UNAVAILABLE_TITLE = 'API 연동 안내'

export const PROGRAM_API_UNAVAILABLE_CONTENT =
  '해당 기능의 API 연동이 되어 있지 않아 데이터를 표시할 수 없습니다.'

const notifiedKeys = new Set<string>()

export function buildProgramApiUnavailableContent(featureLabel?: string): string {
  if (!featureLabel) return PROGRAM_API_UNAVAILABLE_CONTENT
  return `${featureLabel}\n\n${PROGRAM_API_UNAVAILABLE_CONTENT}`
}

/** React 밖·서비스/훅에서 사용. featureKey당 세션 1회. */
export function notifyProgramApiUnavailable(
  featureKey: string,
  featureLabel?: string
): void {
  if (notifiedKeys.has(featureKey)) return
  notifiedKeys.add(featureKey)
  cmsAlertModal.show({
    title: PROGRAM_API_UNAVAILABLE_TITLE,
    content: buildProgramApiUnavailableContent(featureLabel),
  })
}

/** 컴포넌트에서 when=true일 때 1회 alert (Provider 경로 우선). */
export function useNotifyProgramApiUnavailableOnce(
  when: boolean,
  featureKey: string,
  featureLabel?: string
): void {
  const { showAlert } = useCmsAlert()

  useEffect(() => {
    if (!when) return
    if (notifiedKeys.has(featureKey)) return
    notifiedKeys.add(featureKey)
    showAlert({
      title: PROGRAM_API_UNAVAILABLE_TITLE,
      content: buildProgramApiUnavailableContent(featureLabel),
    })
  }, [when, featureKey, featureLabel, showAlert])
}

/** 테스트·HMR용 */
export function resetProgramApiUnavailableNotifications(): void {
  notifiedKeys.clear()
}
