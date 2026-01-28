/**
 * 403 Forbidden 페이지
 * Phase 4.1.1: 사용자 인증 시스템
 */

import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'

export function ForbiddenPage() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '100%', // 레이아웃 콘텐츠 영역의 전체 높이 활용
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
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
    </div>
  )
}
