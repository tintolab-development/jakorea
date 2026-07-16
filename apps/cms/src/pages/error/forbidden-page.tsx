/**
 * 403 Forbidden 페이지
 */

import { Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import { CmsButton } from '@/shared/ui/cms-button'

export function ForbiddenPage() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '100%',
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
          <CmsButton variant="primary" size="medium" onClick={() => navigate('/')}>
            홈으로 돌아가기
          </CmsButton>
        }
      />
    </div>
  )
}
