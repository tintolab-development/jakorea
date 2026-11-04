import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CmsButton } from '@/shared/ui'

import './account-identity-mock-page.css'

export function AccountIdentityMockPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId') ?? ''
  const nonce = searchParams.get('nonce') ?? ''

  const callbackPath = useMemo(() => {
    const params = new URLSearchParams({
      web_transaction_id: `mock-tx-${nonce || 'unknown'}`,
    })
    return `/account/identity/callback?${params.toString()}`
  }, [nonce])

  const handleComplete = () => {
    navigate(callbackPath)
  }

  const handleClose = () => {
    window.close()
  }

  return (
    <div className="account-identity-mock">
      <div className="account-identity-mock__card">
        <p className="account-identity-mock__badge">개발용 Mock</p>
        <h1 className="account-identity-mock__title">NICE 통합인증</h1>
        <p className="account-identity-mock__description">
          실제 NICE 표준창 대신 사용하는 mock 화면입니다.
          <br />
          휴대폰 본인인증 완료를 시뮬레이션합니다.
        </p>
        {sessionId ? <p className="account-identity-mock__meta">세션 ID: {sessionId}</p> : null}
        <div className="account-identity-mock__actions">
          <CmsButton variant="primary" size="h44" onClick={handleComplete}>
            인증 완료
          </CmsButton>
          <CmsButton variant="default" size="h44" onClick={handleClose}>
            닫기
          </CmsButton>
        </div>
      </div>
    </div>
  )
}
