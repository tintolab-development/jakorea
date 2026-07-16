/**
 * 댓글 작성기 — 입력 + 이모지 토글/피커 + 전송 (controlled)
 */

import { useId, type ReactNode } from 'react'
import { ProfileAvatarIcon } from '@/shared/ui/icons/ProfileAvatarIcon'
import { CommentEmojiToggleIcon } from '@/shared/ui/icons/CommentEmojiToggleIcon'
import { CommentSendIcon } from '@/shared/ui/icons/CommentSendIcon'
import { REACTION_EMOJI_ITEMS } from './reaction-emoji-icons'
import { ReactionEmojiPicker } from './reaction-emoji-picker'
import './comment-composer.css'

export interface CommentComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  /** 피커 열림 */
  emojiPickerOpen: boolean
  onEmojiToggle: () => void
  selectedEmojiIndex: number | null
  onEmojiSelect: (index: number) => void
  placeholder?: string
  className?: string
  avatar?: ReactNode
  /** send 버튼 active — 미전달 시 value trim 또는 emoji 선택 */
  sendActive?: boolean
}

export function CommentComposer({
  value,
  onChange,
  onSubmit,
  emojiPickerOpen,
  onEmojiToggle,
  selectedEmojiIndex,
  onEmojiSelect,
  placeholder = '댓글을 남겨보세요',
  className = '',
  avatar,
  sendActive: sendActiveProp,
}: CommentComposerProps) {
  const emojiBtnClipId = useId().replace(/:/g, '')
  const sendActive =
    sendActiveProp ?? (value.trim().length > 0 || selectedEmojiIndex != null)

  return (
    <div className={['comment-composer', className].filter(Boolean).join(' ')}>
      {avatar ?? <ProfileAvatarIcon className="comment-composer__avatar" />}
      <input
        className="comment-composer__input"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            e.preventDefault()
            onSubmit()
          }
        }}
      />
      <button
        type="button"
        className={[
          'comment-composer__btn',
          emojiPickerOpen && 'comment-composer__btn--emoji-picker-open',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label="이모티콘"
        aria-expanded={emojiPickerOpen}
        onClick={onEmojiToggle}
      >
        {selectedEmojiIndex != null ? (
          <span className="comment-composer__emoji-preview" aria-hidden>
            {REACTION_EMOJI_ITEMS[selectedEmojiIndex].renderIcon(`${emojiBtnClipId}-sel`)}
          </span>
        ) : (
          <CommentEmojiToggleIcon active={emojiPickerOpen} />
        )}
      </button>
      {emojiPickerOpen ? (
        <div className="comment-composer__emoji-popover">
          <ReactionEmojiPicker
            onSelect={onEmojiSelect}
            clipIdPrefix={`${emojiBtnClipId}-picker`}
          />
        </div>
      ) : null}
      <button
        type="button"
        className="comment-composer__btn"
        aria-label="댓글 전송"
        onClick={onSubmit}
      >
        <CommentSendIcon active={sendActive} />
      </button>
    </div>
  )
}
