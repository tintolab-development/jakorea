import type { SchoolTeacherEmploymentStatus } from '@jakorea/domain/instructor/employment-status'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import {
  SETTINGS_TEACHER_EMPLOYMENT_OPTIONS,
  type SettingsTeacherEmploymentStatus,
} from '@/features/mypage/settings/lib/map-edit'
import { PFOptionList, SchoolTeacherEmploymentStatusBadge } from '@/shared/ui'
import styles from './teacher-employment-status-picker.module.css'

export type TeacherEmploymentStatusPickerProps = {
  value: SchoolTeacherEmploymentStatus | ''
  onChange: (next: SettingsTeacherEmploymentStatus) => void
}

export function TeacherEmploymentStatusPicker({
  value,
  onChange,
}: TeacherEmploymentStatusPickerProps) {
  const [open, setOpen] = useState(false)
  const [listStyle, setListStyle] = useState<CSSProperties | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useLayoutEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const trigger = rootRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      setListStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: Math.max(120, rect.width),
        zIndex: 20,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return
      setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const showBadge = value !== ''

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="재직 현황"
        onClick={() => setOpen(current => !current)}
      >
        {showBadge ? (
          <SchoolTeacherEmploymentStatusBadge status={value} />
        ) : (
          <span className={styles.placeholder}>재직 현황</span>
        )}
      </button>
      {open
        ? createPortal(
            <PFOptionList
              ref={listRef}
              className={styles.list}
              style={listStyle ?? undefined}
              aria-label="재직 현황"
              options={SETTINGS_TEACHER_EMPLOYMENT_OPTIONS}
              selectedValue={value || undefined}
              onSelect={next => {
                onChange(next as SettingsTeacherEmploymentStatus)
                setOpen(false)
              }}
            />,
            document.body,
          )
        : null}
    </div>
  )
}
