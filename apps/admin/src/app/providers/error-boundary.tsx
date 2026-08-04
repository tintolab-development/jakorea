/**
 * 전역 Error Boundary (라우터 밖에서도 동작 — navigate 미사용)
 */

import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Button, Result } from 'antd'
import { brandColorsHex } from '@/shared/constants/colors'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <Result
          status="error"
          title="오류가 발생했습니다"
          subTitle={this.state.error?.message ?? '예상치 못한 오류가 발생했습니다.'}
          extra={
            <Button
              type="primary"
              style={{ background: brandColorsHex.primary }}
              onClick={() => window.location.assign('/')}
            >
              홈으로 이동
            </Button>
          }
        />
      )
    }
    return this.props.children
  }
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundaryClass>{children}</ErrorBoundaryClass>
}
