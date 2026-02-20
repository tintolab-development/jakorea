declare module '@toast-ui/editor' {
  // Toast UI Editor는 패키지 exports 제약으로 타입 해석이 깨질 수 있어,
  // 프로젝트 로컬에서 최소 선언으로 보강합니다.
  // (런타임 동작에는 영향 없음)
  export interface EditorOptions {
    el: HTMLElement
    autofocus?: boolean
    height?: string
    initialEditType?: 'markdown' | 'wysiwyg'
    previewStyle?: 'tab' | 'vertical'
    usageStatistics?: boolean
    initialValue?: string
    events?: {
      change?: () => void
      load?: (editor: Editor) => void
    }
  }

  export default class Editor {
    constructor(options: EditorOptions)
    getMarkdown(): string
    getHTML(): string
    insertText(text: string): void
    destroy(): void
  }
}

declare module '@toast-ui/editor/dist/toastui-editor-viewer' {
  export interface ViewerOptions {
    el: HTMLElement
    initialValue?: string
    usageStatistics?: boolean
  }

  export default class Viewer {
    constructor(options: ViewerOptions)
    setMarkdown(markdown: string): void
    destroy(): void
  }
}
