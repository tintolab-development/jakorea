import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { useMypageMember } from '../../hooks/use-mypage-member'
import { isDocumentConsentWriteKey } from '../../instructor-apply/consent/catalog'
import { listPortalConsentTypes } from '../api/consents'
import { resolvePortalConsentCreateType } from '../lib/settings-consent-key'

/**
 * 동의서·서약서 작성 화면 진입 시점부터 동의 관리 카드를 노출한다 (BE `listed` = true).
 * 게이트 팝업 「동의서 작성하기」도 이 작성 화면으로 들어오므로 같은 시점에 처리된다.
 * 보기 모드·목업 세션·초상권 등 노출 대상이 아닌 키는 호출하지 않는다.
 * 노출 고정은 부가 동작이라 실패해도 작성 흐름은 막지 않는다.
 */
export function useListConsentOnWriteEnter(consentKey: string, enabled: boolean): void {
  const { isRemoteSession } = useMypageMember()
  const queryClient = useQueryClient()
  const requestedKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || !isRemoteSession || !isDocumentConsentWriteKey(consentKey)) return
    if (requestedKeyRef.current === consentKey) return
    requestedKeyRef.current = consentKey
    listPortalConsentTypes([resolvePortalConsentCreateType(consentKey)])
      .then(() => queryClient.invalidateQueries({ queryKey: platformQueryKeys.mypage.consents() }))
      .catch(() => {
        requestedKeyRef.current = null
      })
  }, [consentKey, enabled, isRemoteSession, queryClient])
}
