/**
 * 준비중 페이지
 */

import { useNavigate } from 'react-router-dom'
import { Result, Space } from 'antd'
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { CmsButton } from '@/shared/ui/cms-button'

interface ComingSoonPageProps {
  title?: string
  description?: string
}

export function ComingSoonPage({
  title = '화면 준비중입니다',
  description = '해당 기능은 현재 준비 중입니다. 곧 만나보실 수 있습니다.',
}: ComingSoonPageProps) {
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
        status="info"
        title={title}
        subTitle={description}
        extra={
          <Space>
            <CmsButton
              variant="secondary"
              size="medium"
              className="cms-button--footer-auto"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
            >
              이전 페이지
            </CmsButton>
            <CmsButton
              variant="primary"
              size="medium"
              className="cms-button--footer-auto"
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
            >
              홈으로 이동
            </CmsButton>
          </Space>
        }
      />
    </div>
  )
}
