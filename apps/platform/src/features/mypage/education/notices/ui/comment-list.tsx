import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type { EducationNoticeComment } from '../model/types'
import { formatEducationNoticePublishedAt } from '../lib/format'
import moreVerticalUrl from '../assets/icon/more-vertical.svg'
import { PFButton, PFOptionList, PFText } from '@/shared/ui'
import styles from './comment-list.module.css'

const COMMENT_MENU_OPTIONS = [
  { value: 'edit', label: '수정하기' },
  { value: 'delete', label: '삭제하기' },
]

const COMMENT_MENU_GAP_PX = 4
const COMMENT_MENU_Z_INDEX = 1100

function computeCommentMenuStyle(anchor: HTMLElement, menu: HTMLElement | null): CSSProperties {
  const rect = anchor.getBoundingClientRect()
  const menuHeight = menu?.offsetHeight ?? 96
  const menuWidth = menu?.offsetWidth ?? 140
  const spaceBelow = window.innerHeight - rect.bottom - COMMENT_MENU_GAP_PX
  const openUpward = spaceBelow < menuHeight && rect.top > spaceBelow
  const top = openUpward
    ? Math.max(8, rect.top - COMMENT_MENU_GAP_PX - menuHeight)
    : rect.bottom + COMMENT_MENU_GAP_PX

  return {
    position: 'fixed',
    top,
    left: Math.max(8, rect.right - menuWidth),
    zIndex: COMMENT_MENU_Z_INDEX,
    minWidth: 140,
  }
}

type EducationNoticeCommentListProps = {
  comments: EducationNoticeComment[]
  currentUserName: string
  onUpdate: (commentId: string, content: string) => void
  onDeleteRequest: (commentId: string) => void
  className?: string
}

export function EducationNoticeCommentList({
  comments,
  currentUserName,
  onUpdate,
  onDeleteRequest,
  className,
}: EducationNoticeCommentListProps) {
  const menuId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  useLayoutEffect(() => {
    if (!openMenuId) {
      setMenuStyle(null)
      return
    }

    const place = () => {
      const anchor = buttonRef.current
      const list = listRef.current
      if (!anchor) return
      const rect = anchor.getBoundingClientRect()
      const listRect = list?.getBoundingClientRect()
      const outsideList =
        listRect != null && (rect.bottom <= listRect.top || rect.top >= listRect.bottom)
      if (outsideList) {
        setOpenMenuId(null)
        return
      }
      setMenuStyle(computeCommentMenuStyle(anchor, menuRef.current))
    }

    place()
    const list = listRef.current
    list?.addEventListener('scroll', place, { passive: true })
    window.addEventListener('resize', place)
    return () => {
      list?.removeEventListener('scroll', place)
      window.removeEventListener('resize', place)
    }
  }, [openMenuId])

  useEffect(() => {
    if (!openMenuId) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (menuRef.current?.contains(target)) return
      if (buttonRef.current?.contains(target)) return
      setOpenMenuId(null)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenuId(null)
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [openMenuId])

  const startEdit = (comment: EducationNoticeComment) => {
    setOpenMenuId(null)
    setEditingId(comment.id)
    setEditValue(comment.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const saveEdit = () => {
    if (!editingId) return
    const next = editValue.trim()
    if (!next) return
    onUpdate(editingId, next)
    cancelEdit()
  }

  if (comments.length === 0) return null

  return (
    <div ref={listRef} className={[styles.list, className].filter(Boolean).join(' ')}>
      {comments.map(comment => {
        const isMine = comment.mine ?? comment.authorName === currentUserName
        const isEditing = editingId === comment.id
        const isMenuOpen = openMenuId === comment.id

        return (
          <article
            key={comment.id}
            id={`notice-comment-${comment.id}`}
            tabIndex={-1}
            className={styles.item}
          >
            <div className={styles.top}>
              <div className={styles.meta}>
                <PFText as="span" typo="bd-sm-sb" color="black" className={styles.author}>
                  {comment.authorName}
                </PFText>
                <PFText as="span" typo="bd-sm-rg" color="neutral-cool-500" className={styles.date}>
                  {formatEducationNoticePublishedAt(comment.createdAt)}
                </PFText>
              </div>
              {isMine && !isEditing ? (
                <div className={styles.moreWrap}>
                  <button
                    ref={isMenuOpen ? buttonRef : undefined}
                    type="button"
                    className={styles.moreButton}
                    aria-label="댓글 더보기"
                    aria-haspopup="menu"
                    aria-expanded={isMenuOpen}
                    aria-controls={isMenuOpen ? menuId : undefined}
                    onClick={() => setOpenMenuId(open => (open === comment.id ? null : comment.id))}
                  >
                    <img src={moreVerticalUrl} alt="" width={24} height={24} aria-hidden="true" />
                  </button>
                  {isMenuOpen
                    ? createPortal(
                        <PFOptionList
                          ref={menuRef}
                          id={menuId}
                          className={styles.moreMenu}
                          role="menu"
                          style={
                            menuStyle ?? {
                              position: 'fixed',
                              top: -9999,
                              left: 0,
                              minWidth: 140,
                            }
                          }
                          options={COMMENT_MENU_OPTIONS}
                          onSelect={value => {
                            if (value === 'edit') {
                              startEdit(comment)
                              return
                            }
                            setOpenMenuId(null)
                            onDeleteRequest(comment.id)
                          }}
                        />,
                        document.body,
                      )
                    : null}
                </div>
              ) : null}
            </div>

            {isEditing ? (
              <div className={styles.edit}>
                <textarea
                  className={styles.editInput}
                  value={editValue}
                  aria-label="댓글 수정"
                  onChange={event => setEditValue(event.target.value)}
                />
                <div className={styles.editActions}>
                  <PFButton type="button" variant="tertiary" size="medium" onClick={cancelEdit}>
                    취소
                  </PFButton>
                  <PFButton
                    type="button"
                    variant="primary"
                    size="medium"
                    disabled={editValue.trim().length === 0}
                    onClick={saveEdit}
                  >
                    저장
                  </PFButton>
                </div>
              </div>
            ) : (
              <PFText as="p" typo="bd-md-md" color="black" className={styles.content}>
                {comment.content}
              </PFText>
            )}
          </article>
        )
      })}
    </div>
  )
}
