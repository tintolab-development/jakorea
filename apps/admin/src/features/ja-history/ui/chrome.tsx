import type { ReactNode } from 'react'
import { Image } from 'antd'
import { JaHistorySaveError, type JaHistoryMedia } from '@/entities/ja-history/model/types'
import { CmsButton, CmsInput, CmsTextArea } from '@/shared/ui'

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
    editing ? 'ja-history-inline-field--edit' : 'ja-history-inline-field--readonly',
    'cms-textarea--fixed-rows',
  ].join(' ')
}

export function InlineText({ editing, value, onChange, rows, label, placeholder }: TextProps) {
  return (
    <CmsTextArea
      className={fieldClass(editing)}
      inputSize="medium"
      width="100%"
      rows={rows}
      value={value}
      readOnly={!editing}
      tabIndex={editing ? 0 : -1}
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
      tabIndex={editing ? 0 : -1}
      placeholder={placeholder}
      aria-label={label}
      onChange={event => {
        if (!editing) return
        onChange(event.target.value)
      }}
    />
  )
}

export function MediaPreview({
  media,
  tone = 'plain',
  size = 'default',
}: {
  media: JaHistoryMedia
  tone?: 'plain' | 'mark'
  size?: 'default' | 'wide' | 'banner' | 'hero' | 'era' | 'thumb'
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
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {media.url ? (
        <Image
          src={media.url}
          alt={media.alt || media.fileName || '이미지'}
          preview={{ mask: '이미지 보기' }}
        />
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
          <span className="table-title">■ {title}</span>
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
                수정
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
    return {
      title: error.code === 'REQUIRED' ? '입력 확인' : '저장 실패',
      content: error.message,
    }
  }
  return { title: '저장 실패', content: fallback }
}
