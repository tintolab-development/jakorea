/**
 * 반응 이모지 피커 툴바 (고정 11종)
 */

import { useId } from 'react'
import { REACTION_EMOJI_ITEMS } from './reaction-emoji-icons'
import './reaction-emoji-picker.css'

export interface ReactionEmojiPickerProps {
  onSelect: (index: number) => void
  className?: string
  /** clipPath id 접두사 (DOM 충돌 방지) */
  clipIdPrefix?: string
}

export function ReactionEmojiPicker({
  onSelect,
  className = '',
  clipIdPrefix,
}: ReactionEmojiPickerProps) {
  const autoPrefix = useId().replace(/:/g, '')
  const prefix = clipIdPrefix ?? autoPrefix

  return (
    <div className={['reaction-emoji-picker', className].filter(Boolean).join(' ')}>
      <div className="reaction-emoji-picker__panel">
        <div className="reaction-emoji-picker__bar" role="toolbar" aria-label="이모티콘 선택">
          {REACTION_EMOJI_ITEMS.map((item, index) => {
            const clipId = `${prefix}-emoji-${index}`
            return (
              <button
                key={item.label}
                type="button"
                className="reaction-emoji-picker__bar-btn"
                aria-label={item.label}
                onClick={() => onSelect(index)}
              >
                {item.renderIcon(clipId)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
