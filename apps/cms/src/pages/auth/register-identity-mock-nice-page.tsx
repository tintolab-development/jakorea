import { Button } from 'antd'
import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import './register-identity-mock-nice-page.css'

export function RegisterIdentityMockNicePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId') ?? ''
  const nonce = searchParams.get('nonce') ?? ''

  const callbackPath = useMemo(() => {
    const params = new URLSearchParams({
      web_transaction_id: `mock-tx-${nonce || 'unknown'}`,
    })
    return `/register/identity/callback?${params.toString()}`
  }, [nonce])

  const handleComplete = () => {
    navigate(callbackPath)
  }

  const handleClose = () => {
    window.close()
  }

  return (
    <div className="register-identity-mock-nice">
      <div className="register-identity-mock-nice__card">
        <p className="register-identity-mock-nice__badge">개발용 Mock</p>
        <h1 className="register-identity-mock-nice__title">NICE 통합인증</h1>
        <p className="register-identity-mock-nice__description">
          실제 NICE 표준창 대신 사용하는 mock 화면입니다.
          <br />
          휴대폰 본인인증 완료를 시뮬레이션합니다.
        </p>
        {sessionId ? (
          <p className="register-identity-mock-nice__meta">세션 ID: {sessionId}</p>
        ) : null}
        <div className="register-identity-mock-nice__actions">
          <Button type="primary" block onClick={handleComplete}>
            인증 완료
          </Button>
          <Button block onClick={handleClose}>
            닫기
          </Button>
        </div>
      </div>
    </div>
  )
}
