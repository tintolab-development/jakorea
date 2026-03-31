/**
 * 문서·내역 모달 래퍼: 청록 헤더 대신 흰 배경·구분선 없는 헤더 + 공통 타이포
 * — 스타일은 plain-header-modal.css (모달 루트에 plain-header-modal 클래스)
 */

import { TealHeaderModal } from './teal-header-modal'
import type { TealHeaderModalProps } from './teal-header-modal'
import './plain-header-modal.css'

export type PlainHeaderModalProps = TealHeaderModalProps

export function PlainHeaderModal({ className, ...props }: PlainHeaderModalProps) {
  return (
    <TealHeaderModal
      {...props}
      className={['plain-header-modal', className].filter(Boolean).join(' ')}
    />
  )
}
