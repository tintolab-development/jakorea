import { forwardRef } from 'react'
import { Button } from 'antd'
import type { ButtonProps } from 'antd'

import './button-loading-only.css'

/**
 * antd Button — `loading` 시 스피너만 표시.
 * 라벨·아이콘은 visibility로 숨겨 버튼 폭·레이아웃 시프트를 방지합니다.
 */
export const LoadingButton = forwardRef<HTMLButtonElement, ButtonProps>(
  function LoadingButton({ loading, children, icon, className, ...rest }, ref) {
    const cn = ['btn-loading-only', className].filter(Boolean).join(' ')
    const hasContent = icon != null || children != null

    return (
      <Button ref={ref} loading={loading} className={cn} {...rest}>
        {hasContent ? (
          <span className="btn-loading-only__content">
            {icon != null ? <span className="btn-loading-only__icon">{icon}</span> : null}
            {children != null ? <span className="btn-loading-only__label">{children}</span> : null}
          </span>
        ) : null}
      </Button>
    )
  }
)

LoadingButton.displayName = 'LoadingButton'
