/**
 * 원형 행추가 버튼 (28×28 프레임, 시안 Cell Add on 원본)
 * — UJAT 교육 일정 행추가·학력사항 행추가 등과 동일 스펙
 */

import type { ButtonHTMLAttributes } from 'react'
import cellAddOnUrl from '@/shared/assets/icons/buttons/cell-add-on.svg'
import './cms-circle-add-button.css'

export type CmsCircleAddButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'children'
> & {
  type?: 'button' | 'submit' | 'reset'
  /** 기본: 항목 추가 */
  'aria-label'?: string
}

/** 시안 `Button / Etc / Cell Add` on — 28 프레임 안 20 원 + 굵은 + */
function CmsCircleAddIcon() {
  return <img src={cellAddOnUrl} width={28} height={28} alt="" aria-hidden draggable={false} />
}

export function CmsCircleAddButton({
  className,
  type = 'button',
  'aria-label': ariaLabel = '항목 추가',
  title,
  ...rest
}: CmsCircleAddButtonProps) {
  return (
    <button
      type={type}
      className={['cms-circle-add-button', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      {...rest}
    >
      <CmsCircleAddIcon />
    </button>
  )
}
