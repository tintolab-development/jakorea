/**
 * 정산 항목 설정 상세 모달 — 헤더 아이콘용 Tossface 이모지 임시 선택기
 * (목 데이터 emojiOverride + theme-provider `.tossface` / CDN tossface.css)
 */

import { useState, type ReactNode } from 'react'
import { Popover } from 'antd'
import './settlement-item-tossface-icon-picker.css'

/** Tossface에서 자주 쓰이는 범주 위주 임시 팔레트(표준 이모지 코드포인트) */
const TOSSFACE_PICKER_EMOJI = [
  '💰',
  '💵',
  '🪙',
  '💼',
  '🎓',
  '🏫',
  '🚌',
  '🚗',
  '✈️',
  '🏨',
  '🍔',
  '☕',
  '📅',
  '📋',
  '✏️',
  '🎯',
  '👤',
  '❤️',
  '⭐',
  '🔔',
  '✅',
  '📌',
] as const

export interface SettlementItemTossfaceIconPickerTriggerProps {
  children: ReactNode
  onPickEmoji: (emoji: string | null) => void
}

export function SettlementItemTossfaceIconPickerTrigger({
  children,
  onPickEmoji,
}: SettlementItemTossfaceIconPickerTriggerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottomLeft"
      zIndex={11000}
      overlayClassName="settlement-item-tossface-picker-popover"
      content={
        <div className="settlement-item-tossface-picker">
          <div className="settlement-item-tossface-picker__grid">
            {TOSSFACE_PICKER_EMOJI.map(ch => (
              <button
                key={ch}
                type="button"
                className="settlement-item-tossface-picker__cell tossface"
                aria-label={`이모지 ${ch} 선택`}
                onClick={() => {
                  onPickEmoji(ch)
                  setOpen(false)
                }}
              >
                {ch}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="settlement-item-tossface-picker__reset"
            onClick={() => {
              onPickEmoji(null)
              setOpen(false)
            }}
          >
            기본 아이콘(SVG)으로
          </button>
        </div>
      }
    >
      <button
        type="button"
        className="settlement-item-setting-detail-modal__header-icon-hit"
        aria-label="Tossface 이모지로 아이콘 바꾸기 (임시)"
      >
        {children}
      </button>
    </Popover>
  )
}
