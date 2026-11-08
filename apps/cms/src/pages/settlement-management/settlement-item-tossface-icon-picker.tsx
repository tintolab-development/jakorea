/**
 * 정산 항목 설정 상세 모달 — 헤더 아이콘용 Tossface 이모지 임시 선택기
 * (목 데이터 emojiOverride + theme-provider `.tossface` / CDN tossface.css)
 */

import { useState, type ReactNode } from 'react'
import { Popover } from 'antd'
import './settlement-item-tossface-icon-picker.css'

/**
 * 시안(0-1. 이모티콘 변경 시) 팔레트 — 한 줄 11개.
 * 저장된 emojiOverride는 문자열 그대로 렌더하므로 이 목록에 없는(이전 팔레트) 값도 그대로 표시된다.
 */
const TOSSFACE_PICKER_EMOJI = [
  '🙂',
  '😆',
  '🥰',
  '😲',
  '😭',
  '😡',
  '😱',
  '❤️',
  '👏',
  '👍',
  '☑️',
] as const

export interface SettlementItemTossfaceIconPickerTriggerProps {
  children: ReactNode
  /** 시안에 「기본 아이콘으로」 되돌리기 버튼 없음 — 팔레트 선택만 */
  onPickEmoji: (emoji: string) => void
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
      // 시안 8999:140664: 모달 기준 left 16 · top 68 → 헤더 아이콘(left 30, 하단 57) 대비 x −14 · y +11
      align={{ offset: [-14, 11] }}
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
