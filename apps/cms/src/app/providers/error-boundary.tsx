/**
 * 전역 Error Boundary
 * 클라이언트 에러 및 페이지 접근 에러 처리
 */

import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// ErrorFallback을 별도 컴포넌트로 분리하여 hooks 사용 가능하게 함
function ErrorFallbackWrapper({ error, errorInfo }: { error: Error | null; errorInfo: ErrorInfo | null }) {
  return <ErrorFallback error={error} errorInfo={errorInfo} />
}

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return <ErrorFallbackWrapper error={this.state.error} errorInfo={this.state.errorInfo} />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
}

function ErrorFallback({ error, errorInfo }: ErrorFallbackProps) {
  const navigate = useNavigate()
  const location = useLocation()

  // 에러 타입 및 코드 분석
  const getErrorCode = (): { code: string; message: string; description: string } => {
    if (!error) {
      return {
        code: 'UNKNOWN',
        message: '알 수 없는 오류',
        description: '예상치 못한 오류가 발생했습니다.',
      }
    }

    // React Router 에러 (404 등)
    if (error.message.includes('404') || error.message.includes('No route')) {
      return {
        code: '404',
        message: '페이지를 찾을 수 없습니다',
        description: '요청하신 페이지가 존재하지 않거나 이동되었습니다.',
      }
    }

    // 네트워크 에러
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: '네트워크 오류',
        description: '서버와의 통신 중 문제가 발생했습니다. 인터넷 연결을 확인해주세요.',
      }
    }

    // 타입 에러
    if (error.name === 'TypeError') {
      return {
        code: 'TYPE_ERROR',
        message: '타입 오류',
        description: '데이터 형식이 올바르지 않습니다.',
      }
    }

    // 참조 에러
    if (error.name === 'ReferenceError') {
      return {
        code: 'REFERENCE_ERROR',
        message: '참조 오류',
        description: '존재하지 않는 변수나 함수를 참조했습니다.',
      }
    }

    // 권한 에러
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return {
        code: '403',
        message: '접근 권한이 없습니다',
        description: '이 페이지에 접근할 권한이 없습니다.',
      }
    }

    // 서버 에러
    if (error.message.includes('500') || error.message.includes('Internal Server')) {
      return {
        code: '500',
        message: '서버 오류',
        description: '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      }
    }

    // 일반 에러
    return {
      code: 'GENERAL_ERROR',
      message: '오류가 발생했습니다',
      description: error.message || '예상치 못한 오류가 발생했습니다.',
    }
  }

  const errorDetails = getErrorCode()

  const handleGoHome = () => {
    navigate('/')
    window.location.reload()
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
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#f5f5f5',
      }}
    >
      <div
        style={{
          maxWidth: 600,
          width: '100%',
          background: '#fff',
          padding: '48px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#ff4d4f',
              marginBottom: '16px',
            }}
          >
            {errorDetails.code}
          </div>
          <h1 style={{ fontSize: '24px', marginBottom: '8px', color: '#262626' }}>
            {errorDetails.message}
          </h1>
          <p style={{ color: '#8c8c8c', marginBottom: '24px' }}>{errorDetails.description}</p>
        </div>

        {import.meta.env.DEV && error && (
          <div
            style={{
              background: '#fff7e6',
              border: '1px solid #ffd591',
              borderRadius: '4px',
              padding: '16px',
              marginBottom: '24px',
            }}
          >
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
                개발자 정보 (개발 모드에서만 표시)
              </summary>
              <pre
                style={{
                  background: '#fff',
                  padding: '12px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '12px',
                  marginTop: '8px',
                }}
              >
                <strong>에러 메시지:</strong>
                {error.message}
                {'\n\n'}
                <strong>에러 스택:</strong>
                {error.stack}
                {'\n\n'}
                {errorInfo && (
                  <>
                    <strong>컴포넌트 스택:</strong>
                    {errorInfo.componentStack}
                  </>
                )}
                {'\n\n'}
                <strong>경로:</strong>
                {location.pathname}
              </pre>
            </details>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={handleGoBack}
            style={{
              padding: '8px 16px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            이전 페이지
          </button>
          <button
            onClick={handleReload}
            style={{
              padding: '8px 16px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            새로고침
          </button>
          <button
            onClick={handleGoHome}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: '#1890ff',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            홈으로 이동
          </button>
        </div>
      </div>
    </div>
  )
}

// HOC로 ErrorBoundary를 래핑하여 useNavigate 사용 가능하게 함
export function ErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundaryClass>{children}</ErrorBoundaryClass>
}

