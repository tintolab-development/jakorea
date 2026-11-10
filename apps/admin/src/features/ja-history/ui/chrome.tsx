import type { ReactNode } from 'react'
import { JaHistorySaveError, type JaHistoryMedia } from '@/entities/ja-history/model/types'
import { CmsButton, CmsInput, CmsTextArea, REQUIRED_FIELDS_INCOMPLETE_ALERT } from '@/shared/ui'

type TextProps = {
  editing: boolean
  value: string
  onChange: (value: string) => void
  rows: number
  label: string
  placeholder?: string
}

export function fieldClass(editing: boolean): string {
  return [
    'ja-history-inline-field',
    editing && 'ja-history-inline-field--edit',
    'cms-textarea--fixed-rows',
  ]
    .filter(Boolean)
    .join(' ')
}

export function InlineText({ editing, value, onChange, rows, label, placeholder }: TextProps) {
  return (
    <CmsTextArea
      className={fieldClass(editing)}
      inputSize="medium"
      width="100%"
      // 수정 시 줄바꿈 수만큼 높이가 늘고 줄어든다(hug). 조회는 기존 rows 고정
      rows={editing ? undefined : rows}
      autoSize={editing ? { minRows: 1 } : undefined}
      value={value}
      readOnly={!editing}
      inlineReadOnly="slot"
      placeholder={placeholder}
      aria-label={label}
      onChange={event => {
        if (!editing) return
        onChange(event.target.value)
      }}
    />
  )
}

export function InlineInput({
  editing,
  value,
  onChange,
  label,
  placeholder,
}: Omit<TextProps, 'rows'>) {
  return (
    <CmsInput
      className={fieldClass(editing)}
      inputSize="medium"
      width="100%"
      value={value}
      readOnly={!editing}
      inlineReadOnly="slot"
      placeholder={placeholder}
      aria-label={label}
      onChange={event => {
        if (!editing) return
        onChange(event.target.value)
      }}
    />
  )
}

export function HistoryCopy({
  value,
  align = 'start',
}: {
  value: string
  align?: 'start' | 'center'
}) {
  return (
    <p
      className={[
        'ja-history-copy',
        align === 'center' ? 'ja-history-copy--center' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {value || '-'}
    </p>
  )
}

export function MediaPreview({
  media,
  tone = 'plain',
  size = 'default',
}: {
  media: JaHistoryMedia
  tone?: 'plain' | 'mark'
  size?: 'default' | 'wide' | 'banner' | 'hero' | 'era' | 'thumb' | 'card' | 'origin' | 'cta'
}) {
  return (
    <span
      className={[
        'ja-history-preview',
        tone === 'mark' ? 'ja-history-preview--mark' : '',
        size === 'wide' ? 'ja-history-preview--wide' : '',
        size === 'banner' ? 'ja-history-preview--banner' : '',
        size === 'hero' ? 'ja-history-preview--hero' : '',
        size === 'era' ? 'ja-history-preview--era' : '',
        size === 'thumb' ? 'ja-history-preview--thumb' : '',
        size === 'card' ? 'ja-history-preview--card' : '',
        size === 'origin' ? 'ja-history-preview--origin' : '',
        size === 'cta' ? 'ja-history-preview--cta' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {media.url ? (
        <img src={media.url} alt={media.alt || media.fileName || '이미지'} />
      ) : (
        <span className="ja-history-preview__empty">없음</span>
      )}
    </span>
  )
}

export function MediaThumb({ media }: { media: JaHistoryMedia }) {
  return (
    <div className="ja-history-thumb-cell">
      <MediaPreview media={media} />
      <span className="ja-history-locked-media__name">{media.fileName || '등록된 파일 없음'}</span>
    </div>
  )
}

export function LockedMedia({
  media,
  tone = 'plain',
}: {
  media: JaHistoryMedia
  tone?: 'plain' | 'mark'
}) {
  return (
    <div className="ja-history-locked-media">
      <MediaPreview media={media} tone={tone} />
      <span className="ja-history-locked-media__name">{media.fileName || '등록된 파일 없음'}</span>
    </div>
  )
}

type SectionFrameProps = {
  title: string
  /** Figma Title 마커. 히어로·연혁·시작·CTA는 없음. */
  marker?: boolean
  note?: string
  editing?: boolean
  saving?: boolean
  onEdit: () => void
  onCancel?: () => void
  onSave?: () => void
  children: ReactNode
}

export function SectionFrame({
  title,
  marker = true,
  note,
  editing = false,
  saving = false,
  onEdit,
  onCancel,
  onSave,
  children,
}: SectionFrameProps) {
  return (
    <section className="admin-list-card ja-history-section">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper ja-history-section__heading">
          <span className="table-title">{marker ? `■ ${title}` : title}</span>
          {note ? <span className="ja-history-section__note">{note}</span> : null}
        </div>
        <div className="table-header-actions--wrapper ja-history-section__actions">
          {editing ? (
            <>
              <CmsButton
                variant="secondary"
                size="h40"
                type="button"
                disabled={saving}
                onClick={onCancel} >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="h40"
                type="button"
                loading={saving}
                disabled={saving}
                onClick={onSave} >
                저장
              </CmsButton>
            </>
          ) : (
            <CmsButton variant="primary" size="h40" type="button" onClick={onEdit}>
              수정
            </CmsButton>
          )}
        </div>
      </div>
      <div className="ja-history-section__body">{children}</div>
    </section>
  )
}

export function jaHistorySaveAlert(error: unknown, fallback: string) {
  if (error instanceof JaHistorySaveError) {
    if (error.code === 'OPTIMISTIC_LOCK') {
      return { title: '저장 실패', content: error.message }
    }
    if (error.code === 'REQUIRED') return REQUIRED_FIELDS_INCOMPLETE_ALERT
    return {
      title: '저장 실패',
      content: error.message,
    }
  }
  return { title: '저장 실패', content: fallback }
}
