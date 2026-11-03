import { Button, Input, Modal } from 'antd'
import type { TextAreaRef } from 'antd/es/input/TextArea'
import { useRef, useState, type ChangeEvent } from 'react'
import {
  buildRawHtmlImageTag,
  normalizeUploadedImageUrl,
  RICH_TEXT_IMAGE_ACCEPT,
  validateRawHtmlImageFile,
  type RawHtmlSourceRequest,
} from '@jakorea/rich-text'

export type RawHtmlSourceModalProps = {
  /** null이면 닫힘 */
  request: RawHtmlSourceRequest | null
  onSubmit: (html: string) => void
  onCancel: () => void
  /** 본문 이미지 업로드와 같은 경로. 없으면 '이미지 업로드' 버튼을 숨긴다 */
  uploadImage?: (file: File) => Promise<string>
}

/** HTML 원본 블록 소스 편집 — 붙여넣은 원본을 그대로 저장한다 */
export function RawHtmlSourceModal({
  request,
  onSubmit,
  onCancel,
  uploadImage,
}: RawHtmlSourceModalProps) {
  const [value, setValue] = useState(request?.initialHtml ?? '')
  const [shownRequest, setShownRequest] = useState(request)
  const [uploading, setUploading] = useState(false)
  const textAreaRef = useRef<TextAreaRef>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // 새 요청이 열리면 입력값을 그 요청의 초기값으로 맞춘다 (렌더 중 상태 조정)
  if (request !== shownRequest) {
    setShownRequest(request)
    if (request) setValue(request.initialHtml)
  }

  const isInsert = request?.mode === 'insert'

  const insertAtCursor = (snippet: string) => {
    const textarea = textAreaRef.current?.resizableTextArea?.textArea
    const start = textarea?.selectionStart ?? value.length
    const end = textarea?.selectionEnd ?? value.length
    const next = value.slice(0, start) + snippet + value.slice(end)
    setValue(next)
    const caret = start + snippet.length
    requestAnimationFrame(() => {
      const el = textAreaRef.current?.resizableTextArea?.textArea
      if (!el) return
      el.focus()
      el.setSelectionRange(caret, caret)
    })
  }

  const handleImageFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !uploadImage) return
    const invalid = validateRawHtmlImageFile(file)
    if (invalid) {
      window.alert(invalid)
      return
    }
    setUploading(true)
    try {
      const url = normalizeUploadedImageUrl(await uploadImage(file))
      if (!url) {
        window.alert('이미지 주소를 받지 못했어요. 다시 시도해 주세요.')
        return
      }
      insertAtCursor(buildRawHtmlImageTag(url))
    } catch (error) {
      const message = error instanceof Error ? error.message.trim() : ''
      window.alert(message || '이미지를 올리지 못했어요. 다시 시도해 주세요.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Modal
      open={request != null}
      title={isInsert ? 'HTML 소스 붙여넣기' : 'HTML 소스 편집'}
      okText={isInsert ? '삽입' : '저장'}
      cancelText="취소"
      width={880}
      okButtonProps={{ disabled: !value.trim() || uploading }}
      onOk={() => onSubmit(value)}
      onCancel={onCancel}
      maskClosable={false}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <p className="rich-text-raw-html-modal__hint" style={{ margin: 0 }}>
          {uploadImage
            ? '스티비 뉴스레터 같은 HTML 원본을 붙여넣으세요. 스크립트는 실행되지 않아요. 이미지는 이미지 업로드 버튼으로 넣어 주세요.'
            : '스티비 뉴스레터 같은 HTML 원본을 붙여넣으세요. 스크립트는 실행되지 않아요. 이미지는 https:// 주소로 넣어 주세요.'}
        </p>
        {uploadImage ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={RICH_TEXT_IMAGE_ACCEPT}
              hidden
              onChange={event => void handleImageFileChange(event)}
            />
            <Button
              size="small"
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              이미지 업로드
            </Button>
          </>
        ) : null}
      </div>
      <Input.TextArea
        ref={textAreaRef}
        className="rich-text-raw-html-modal__textarea"
        value={value}
        onChange={event => setValue(event.target.value)}
        autoSize={{ minRows: 16, maxRows: 28 }}
        spellCheck={false}
        placeholder="<!DOCTYPE html>…"
        aria-label="HTML 소스"
        style={{
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
          fontSize: 12,
        }}
      />
    </Modal>
  )
}
