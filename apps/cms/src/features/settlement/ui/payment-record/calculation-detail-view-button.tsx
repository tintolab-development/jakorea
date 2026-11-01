/**
 * 산출 내역 하위 「상세 보기」— 156×32 고정.
 */
import type { ReactNode } from 'react'
import { CmsButton, type CmsButtonProps } from '@/shared/ui/cms-button'
import './calculation-detail-view-button.css'

type CalculationDetailViewButtonProps = Omit<CmsButtonProps, 'variant' | 'size' | 'children'> & {
  children?: ReactNode
}

export function CalculationDetailViewButton({
  className,
  children = '상세 보기',
  ...rest
}: CalculationDetailViewButtonProps) {
  return (
    <CmsButton
      {...rest}
      variant="default"
      size="h32"
      className={['calculation-detail-view-button', className].filter(Boolean).join(' ')}
    >
      {children}
    </CmsButton>
  )
}
