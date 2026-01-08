/**
 * 준비중 페이지
 * 템플릿 관리, 게시글 관리, 로그 관리 등 아직 구현되지 않은 기능에 대한 안내 페이지
 */

import { useNavigate } from 'react-router-dom'
import { Result, Button, Space } from 'antd'
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons'

interface ComingSoonPageProps {
  title?: string
  description?: string
}

export function ComingSoonPage({ 
  title = '화면 준비중입니다',
  description = '해당 기능은 현재 준비 중입니다. 곧 만나보실 수 있습니다.'
}: ComingSoonPageProps) {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate('/')
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 48px)',
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
            <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack}>
              이전 페이지
            </Button>
            <Button type="primary" icon={<HomeOutlined />} onClick={handleGoHome}>
              홈으로 이동
            </Button>
          </Space>
        }
      />
    </div>
  )
}
