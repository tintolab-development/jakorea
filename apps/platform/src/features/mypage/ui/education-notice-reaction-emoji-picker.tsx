import { useId } from 'react'
import { REACTION_EMOJI_ITEMS } from '@jakorea/ui'
import styles from './education-notice-reaction-emoji-picker.module.css'

type EducationNoticeReactionEmojiPickerProps = {
  onSelect: (index: number) => void
  selectedIndex?: number | null
  className?: string
}

export function EducationNoticeReactionEmojiPicker({
  onSelect,
  selectedIndex = null,
  className,
}: EducationNoticeReactionEmojiPickerProps) {
  const prefix = useId().replace(/:/g, '')
  const rootClassName = [styles.root, className].filter(Boolean).join(' ')

  return (
    <div className={rootClassName} role="toolbar" aria-label="이모티콘 선택">
      {REACTION_EMOJI_ITEMS.map((item, index) => (
        <button
          key={item.label}
          type="button"
          className={[styles.button, selectedIndex === index ? styles.buttonSelected : undefined]
            .filter(Boolean)
            .join(' ')}
          aria-label={item.label}
          aria-pressed={selectedIndex === index}
          onClick={() => onSelect(index)}
        >
          {item.renderIcon(`${prefix}-${index}`)}
        </button>
      ))}
    </div>
  )
}
