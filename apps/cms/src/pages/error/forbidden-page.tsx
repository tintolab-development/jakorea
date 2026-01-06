/**
 * 403 Forbidden 페이지
 * Phase 4.1.1: 사용자 인증 시스템
 */

import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'

export function ForbiddenPage() {
  const navigate = useNavigate()

  return (
    <Result
      status="403"
      title="403"
      subTitle="죄송합니다. 이 페이지에 접근할 권한이 없습니다."
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          홈으로 돌아가기
        </Button>
      }
    />
  )
}



