import type { MouseEvent, ReactNode } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import './item-add-button.css'

type ItemAddButtonProps = {
  className?: string
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
  /** 기본: `+ 항목 추가` */
  children?: ReactNode
}

/** 단일항목 에디터 — 항목 리스트 하단 전폭 추가 버튼 (객관식 우측 패널 등) */
export function ItemAddButton({
  className,
  onClick,
  children = '+ 항목 추가',
}: ItemAddButtonProps) {
  return (
    <CmsButton
      variant="secondary"
      type="button"
      size="medium"
      className={['item-add-button', className].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      {children}
    </CmsButton>
  )
}
