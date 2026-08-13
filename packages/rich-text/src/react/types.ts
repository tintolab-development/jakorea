import type { ReactNode } from 'react'
import type { Editor } from '@tiptap/react'
import type {
  RichTextContentFormat,
  RichTextEditorApi,
} from '../core/types'

export type { RichTextContentFormat, RichTextEditorApi, RichTextEditorContentType } from '../core/types'
export type { CreateRichTextExtensionsOptions } from '../core/types'

export type UseRichTextEditorOptions = {
  /** false면 에디터 인스턴스 비활성(모달 닫힘 등) */
  enabled: boolean
  initialContent?: string
  contentFormat?: RichTextContentFormat
  /** 동일 enabled에서 다른 문서 로드 시 remount·setContent 트리거 */
  resetKey?: string | number
  placeholder?: string
  autofocus?: boolean
  /** `full`(기본) | `basic` — basic은 paste/드롭 이미지·emoji 등 제외 */
  preset?: 'full' | 'basic'
  onReady?: (api: RichTextEditorApi) => void
}

export type RichTextEditorProps = {
  editor: Editor | null
  className?: string
  /** 예: `369px` — notice-register-modal 에디터 높이 */
  minHeight?: string | number
  /**
   * `true`이고 `toolbar`가 없으면 툴바 영역만 비워 둠.
   * 앱별 툴바는 `toolbar` 슬롯으로 주입.
   */
  showToolbar?: boolean
  /** 커스텀 툴바(지정 시 `showToolbar` 무시) */
  toolbar?: ReactNode
  'aria-label'?: string
}

export type RichTextViewerProps = {
  /** Markdown 본문 (`markdown`과 동일) */
  content?: string
  markdown?: string
  contentFormat?: RichTextContentFormat
  className?: string
  /** 기본 `403px` — 구 공지 상세 뷰어 */
  maxHeight?: string | number
}
