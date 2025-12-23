/**
 * 에러 페이지
 * 404, 403, 500 등 다양한 에러 코드 처리
 */

import { useNavigate, useSearchParams } from 'react-router-dom'
import { Result, Button, Space } from 'antd'
import { HomeOutlined, ReloadOutlined, ArrowLeftOutlined } from '@ant-design/icons'

export function ErrorPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const errorCode = searchParams.get('code') || '404'
  const errorMessage = searchParams.get('message') || '페이지를 찾을 수 없습니다'

  const getErrorConfig = () => {
    switch (errorCode) {
      case '404':
        return {
          status: '404',
          title: '404',
          subTitle: '페이지를 찾을 수 없습니다',
          description: '요청하신 페이지가 존재하지 않거나 이동되었습니다.',
        }
      case '403':
        return {
          status: '403',
          title: '403',
          subTitle: '접근 권한이 없습니다',
          description: '이 페이지에 접근할 권한이 없습니다.',
        }
      case '500':
        return {
          status: '500',
          title: '500',
          subTitle: '서버 오류',
          description: '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        }
      case 'NETWORK_ERROR':
        return {
          status: 'error',
          title: '네트워크 오류',
          subTitle: '서버와의 통신 중 문제가 발생했습니다',
          description: '인터넷 연결을 확인해주세요.',
        }
      default:
        return {
          status: 'error',
          title: '오류가 발생했습니다',
          subTitle: errorMessage,
          description: '예상치 못한 오류가 발생했습니다.',
        }
    }
  }

  const config = getErrorConfig()

  const handleGoHome = () => {
    navigate('/')
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleReload = () => {
    window.location.reload()
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
        status={config.status as any}
        title={config.title}
        subTitle={config.subTitle}
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack}>
              이전 페이지
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReload}>
              새로고침
            </Button>
            <Button type="primary" icon={<HomeOutlined />} onClick={handleGoHome}>
              홈으로 이동
            </Button>
          </Space>
        }
      >
        <div style={{ textAlign: 'center', color: '#8c8c8c' }}>{config.description}</div>
      </Result>
    </div>
  )
}





