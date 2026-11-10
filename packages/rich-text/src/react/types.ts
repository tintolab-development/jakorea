import type { ReactNode } from 'react'
import type { Editor } from '@tiptap/react'
import type { Extensions } from '@tiptap/core'
import type {
  RichTextContentFormat,
  RichTextDisabledFeature,
  RichTextEditorApi,
} from '../core/types'

export type { RichTextContentFormat, RichTextEditorApi, RichTextEditorContentType } from '../core/types'
export type { CreateRichTextExtensionsOptions, RichTextDisabledFeature } from '../core/types'

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
  extraExtensions?: Extensions
  /**
   * Homepage Admin 시각 편집 전용 이미지 정렬·블록 이동.
   * CMS/Platform 공통 에디터에서는 쓰지 않는다.
   */
  visualImagePosition?: boolean
  /**
   * 끌 서식 기능(기본 없음). 확장 자체를 빼므로 단축키·입력 규칙·붙여넣기로도 들어오지 않는다.
   * 배열은 내용이 같으면 같은 값으로 취급한다(리마운트 없음).
   */
  disabledFeatures?: readonly RichTextDisabledFeature[]
  onReady?: (api: RichTextEditorApi) => void
  /**
   * 드롭·붙여넣기 이미지 src. 없으면 data URL.
   * 콜백 참조가 바뀌어도 에디터는 리마운트하지 않는다.
   */
  resolveImageSrc?: (
    file: File
  ) => Promise<import('../core/insert-actions').ResolvedRichTextImageSrc>
  /**
   * TipTap `useEditor` 트랜잭션마다 React 리렌더 여부.
   * 기본 `false` — 툴바는 `useEditorState`로 구독하고, 부모 폼 전체 리렌더를 막는다.
   */
  shouldRerenderOnTransaction?: boolean
}

/** 에디터 셸(툴바+본문) 기본 min-height */
export const RICH_TEXT_EDITOR_DEFAULT_MIN_HEIGHT_PX = 284

export type RichTextEditorProps = {
  editor: Editor | null
  className?: string
  /** 기본 `284px`. 리사이즈 하한과 동일 */
  minHeight?: string | number
  /** 초기 높이. 생략 시 minHeight만 적용. 사용자 리사이즈가 있으면 그 값이 우선 */
  height?: string | number
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
  extraExtensions?: Extensions
  /** 기본 `403px` — 구 공지 상세 뷰어 */
  maxHeight?: string | number
  /** 뷰어 에디터 인스턴스. CMS 인라인 이미지 미리보기 등에 사용 */
  onEditor?: (editor: Editor | null) => void
}
