/**
 * HTML 원본 블록 — 붙여넣은 HTML 소스(스티비 뉴스레터 등)를 손대지 않고 보존하는 atom 노드.
 *
 * - ProseMirror 스키마는 원본 문자열을 절대 파싱하지 않는다(atom, attrs.html 문자열).
 * - 저장 HTML: `<div data-raw-html-block="" data-raw-html-encoding="base64" data-raw-html="…">`
 *   - 값은 UTF-8 → base64. innerHTML로 넣으면 브라우저·서버 파서가 `<html>/<head>/<meta>/<style>`를
 *     정규화(제거·재배치)하므로 무손실이 아니다. 속성 인코딩은 파서가 건드리지 않는다.
 *   - URI 인코딩 대비: 한글 1자가 9자(%XX×3)로 늘지만 base64는 4자. 본문 길이 제한(100,000자)에 유리.
 *   - base64에는 `<` `>` `&` `"`가 없어 서버 visible-length(태그 제거 후 글자 수)는 이 속성을 0자로 센다.
 * - 화면: sandbox iframe(srcdoc, allow-scripts 없음)로 원래 모양 그대로 미리보기, 높이 자동.
 * - 편집 가능한 에디터에서는 iframe 문서를 designMode로 열어 글자를 바로 고친다.
 *   고친 문서는 미리보기용으로 덧붙인 것(base·CSP)만 빼고 다시 HTML 문자열로 저장한다.
 *   한 번도 고치지 않은 블록은 원본 문자열을 그대로 둔다.
 * - 블록 안 이미지는 외부 URL 그대로 두며 이미지 10개 제한·용량 합계에 넣지 않는다.
 *   단 data: 이미지는 저장 API가 거절하므로 입력·저장 시점에 제거한다.
 */
import { Node, mergeAttributes, type Editor, type JSONContent } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { RICH_TEXT_IMAGE_ACCEPT } from './insert-actions'
import { stripPastedDataUriImages } from './strip-pasted-data-uri-images'
import {
  RICH_TEXT_INLINE_IMAGE_MAX_BYTES,
  RICH_TEXT_INLINE_IMAGE_SIZE_MESSAGE,
} from './visible-length'

export const RAW_HTML_BLOCK_NODE_NAME = 'rawHtmlBlock'
export const RAW_HTML_BLOCK_ATTR = 'data-raw-html-block'
export const RAW_HTML_BLOCK_VALUE_ATTR = 'data-raw-html'
export const RAW_HTML_BLOCK_ENCODING_ATTR = 'data-raw-html-encoding'
export const RAW_HTML_BLOCK_ENCODING = 'base64'
/** 미리보기에서만 덧붙인 요소 표시. 저장할 때 이 표시가 있는 요소는 뺀다 */
export const RAW_HTML_PREVIEW_MARKER_ATTR = 'data-raw-html-preview'
/** 블록 안에서 직접 고친 내용을 반영한 트랜잭션 meta 키 */
export const RAW_HTML_BLOCK_INLINE_EDIT_META = 'rawHtmlBlockInlineEdit'
/** 직접 편집 후 저장까지 기다리는 시간(ms). 포커스가 빠지면 바로 저장한다 */
export const RAW_HTML_BLOCK_EDIT_DEBOUNCE_MS = 400
/**
 * 스크립트 실행 금지(allow-scripts 없음). allow-same-origin은 부모가 높이를 재고
 * 직접 편집(designMode)·직렬화를 하기 위해서만 쓴다.
 * 스크립트가 없으면 same-origin이어도 iframe 안에서 부모를 건드릴 수 없다.
 * 링크는 `<base target="_blank">`로 새 탭에서 연다(allow-popups*).
 */
export const RAW_HTML_BLOCK_IFRAME_SANDBOX =
  'allow-same-origin allow-popups allow-popups-to-escape-sandbox'

export type RawHtmlSourceRequest = {
  /** 편집 시작 값. 새로 넣을 때는 빈 문자열 */
  initialHtml: string
  mode: 'insert' | 'edit'
}

/** 소스 편집 UI. 저장하면 문자열, 취소하면 null */
export type RawHtmlSourceRequester = (request: RawHtmlSourceRequest) => Promise<string | null>

/** 이미지 파일을 올리고 공개 URL(https)을 돌려준다 */
export type RawHtmlImageUploader = (file: File) => Promise<string>

export type RawHtmlBlockStorage = {
  /** 앱 툴바가 모달을 연결한다. 없으면 window.prompt 폴백 */
  requestSource: RawHtmlSourceRequester | null
  /** 앱이 업로드 함수를 연결한다. 없으면 블록 안 '이미지' 버튼을 숨긴다 */
  uploadImage: RawHtmlImageUploader | null
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    rawHtmlBlock: {
      /** HTML 원본 블록 삽입 (data: 이미지는 제거) */
      insertRawHtmlBlock: (html: string) => ReturnType
    }
  }
  interface Storage {
    rawHtmlBlock: RawHtmlBlockStorage
  }
}

const BASE64_CHUNK = 0x8000

/** UTF-8 → base64 (브라우저·jsdom·Node 공통) */
export function encodeRawHtml(raw: string): string {
  if (!raw) return ''
  const bytes = new TextEncoder().encode(raw)
  let binary = ''
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + BASE64_CHUNK))
  }
  return btoa(binary)
}

/** base64 → UTF-8. 깨진 값이면 빈 문자열 */
export function decodeRawHtml(encoded: string | null | undefined): string {
  if (!encoded) return ''
  try {
    const binary = atob(encoded.trim())
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return ''
  }
}

/** 입력 시점 정리 — 저장 API가 거절하는 data: 이미지만 제거, 나머지는 그대로 */
export function normalizeRawHtmlInput(raw: string): string {
  return stripPastedDataUriImages(raw)
}

/** 저장 HTML 래퍼 문자열 (Markdown 직렬화 등에서 사용) */
export function renderRawHtmlBlockWrapper(raw: string): string {
  return `<div ${RAW_HTML_BLOCK_ATTR}="" ${RAW_HTML_BLOCK_ENCODING_ATTR}="${RAW_HTML_BLOCK_ENCODING}" ${RAW_HTML_BLOCK_VALUE_ATTR}="${encodeRawHtml(raw)}"></div>`
}

const HEAD_OPEN = /<head\b[^>]*>/i
const HTML_OPEN = /<html\b[^>]*>/i
const DOCTYPE = /^\s*<!doctype[^>]*>/i
const DOCUMENT_SHELL = /<!doctype\b|<html\b|<head\b|<body\b/i

const PREVIEW_INJECTED =
  `<meta http-equiv="Content-Security-Policy" content="script-src 'none'; object-src 'none'" ${RAW_HTML_PREVIEW_MARKER_ATTR}="">` +
  `<base target="_blank" ${RAW_HTML_PREVIEW_MARKER_ATTR}="">`

/** 원본이 문서 전체(doctype/html/head/body)인지, 조각인지 */
export function isRawHtmlDocument(raw: string): boolean {
  return DOCUMENT_SHELL.test(raw)
}

/**
 * iframe srcdoc — 원본 앞에 링크 새 탭(`<base target="_blank">`)과 스크립트 차단 CSP만 덧붙인다.
 * doctype 앞에는 넣지 않는다(quirks 모드로 바뀌면 모양이 달라짐). 저장 값은 바꾸지 않는다.
 * 덧붙인 요소에는 `data-raw-html-preview` 표시를 달아 직렬화 때 뺀다.
 */
export function buildRawHtmlSrcdoc(raw: string): string {
  const head = HEAD_OPEN.exec(raw)
  if (head) {
    const at = head.index + head[0].length
    return raw.slice(0, at) + PREVIEW_INJECTED + raw.slice(at)
  }
  const html = HTML_OPEN.exec(raw)
  if (html) {
    const at = html.index + html[0].length
    return raw.slice(0, at) + PREVIEW_INJECTED + raw.slice(at)
  }
  const doctype = DOCTYPE.exec(raw)
  if (doctype) {
    const at = doctype[0].length
    return raw.slice(0, at) + PREVIEW_INJECTED + raw.slice(at)
  }
  return PREVIEW_INJECTED + raw
}

function serializeDoctype(doctype: DocumentType): string {
  let out = `<!DOCTYPE ${doctype.name}`
  if (doctype.publicId) out += ` PUBLIC "${doctype.publicId}"`
  if (doctype.systemId) out += doctype.publicId ? ` "${doctype.systemId}"` : ` SYSTEM "${doctype.systemId}"`
  return `${out}>`
}

function isDataUriImage(element: Element): boolean {
  return /^\s*data:/i.test(element.getAttribute('src') ?? '')
}

/** 미리보기용 요소·편집 흔적·data: 이미지를 뺀 사본 */
function cleanForSerialize(root: Element): Element {
  const clone = root.cloneNode(true) as Element
  for (const el of Array.from(clone.querySelectorAll(`[${RAW_HTML_PREVIEW_MARKER_ATTR}]`))) {
    el.remove()
  }
  for (const img of Array.from(clone.querySelectorAll('img'))) {
    if (isDataUriImage(img)) img.remove()
  }
  return clone
}

export type SerializeRawHtmlDocumentOptions = {
  /**
   * 원본이 조각(doctype/html/head/body 없음)이었으면 true —
   * 파서가 만든 `<html><head><body>` 껍데기 없이 head 안 요소 + body 내용만 돌려준다.
   */
  fragment?: boolean
}

/**
 * iframe(미리보기) 문서 → 저장할 HTML 문자열.
 * doctype·html/head/body 속성·meta·style·class·표는 그대로 두고 미리보기가 덧붙인 base·CSP만 뺀다.
 * 브라우저 직렬화라 따옴표·공백·태그 대소문자 등 표기는 원본과 다를 수 있다(의미는 같음).
 */
export function serializeRawHtmlDocument(
  doc: Document,
  options: SerializeRawHtmlDocumentOptions = {}
): string {
  const root = doc.documentElement
  if (!root) return ''
  if (options.fragment) {
    const clean = cleanForSerialize(root)
    const head = clean.querySelector('head')
    const body = clean.querySelector('body')
    const headPart = head ? Array.from(head.children).map(el => el.outerHTML).join('') : ''
    return normalizeRawHtmlInput(headPart + (body?.innerHTML ?? ''))
  }
  const parts: string[] = []
  for (const child of Array.from(doc.childNodes)) {
    if (child.nodeType === 10) parts.push(serializeDoctype(child as DocumentType))
    else if (child === root) parts.push(cleanForSerialize(root).outerHTML)
    else if (child.nodeType === 8) parts.push(`<!--${(child as Comment).data}-->`)
  }
  return normalizeRawHtmlInput(parts.join('\n'))
}

/** 블록에 넣을 이미지 파일 검사. 문제 없으면 null, 있으면 안내 문구 */
export function validateRawHtmlImageFile(file: File): string | null {
  const accepted = RICH_TEXT_IMAGE_ACCEPT.split(',').map(type => type.trim())
  if (!accepted.includes(file.type)) return 'JPG, PNG, GIF, WebP 이미지만 넣을 수 있어요.'
  if (file.size > RICH_TEXT_INLINE_IMAGE_MAX_BYTES) return RICH_TEXT_INLINE_IMAGE_SIZE_MESSAGE
  return null
}

/** 업로드 결과가 쓸 수 있는 원격 주소인지 (data:·blob: 거절) */
export function normalizeUploadedImageUrl(url: string | null | undefined): string | null {
  const trimmed = (url ?? '').trim()
  if (!/^https?:\/\//i.test(trimmed)) return null
  return trimmed
}

export function escapeRawHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** 블록 안에 넣을 `<img>` 태그 */
export function buildRawHtmlImageTag(url: string): string {
  return `<img src="${escapeRawHtmlAttr(url)}" alt="" style="max-width:100%">`
}

/** 링크 입력값 정리. 허용: http(s)·mailto·tel, `www.`는 https로. 그 외 null */
export function normalizeRawHtmlLinkUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`
  return null
}

function measureFrameHeight(iframe: HTMLIFrameElement): number {
  try {
    const doc = iframe.contentDocument
    const root = doc?.documentElement
    if (!doc || !root) return 0
    const rootHeight = Math.ceil(root.getBoundingClientRect().height)
    return Math.max(rootHeight, doc.body?.scrollHeight ?? 0)
  } catch {
    return 0
  }
}

/** iframe 높이를 내용에 맞춘다. 반환값은 정리 함수 */
function attachAutoHeight(iframe: HTMLIFrameElement, onLoaded?: () => void): () => void {
  let observer: ResizeObserver | null = null
  const timers: ReturnType<typeof setTimeout>[] = []

  const apply = () => {
    const height = measureFrameHeight(iframe)
    if (height > 0 && iframe.style.height !== `${height}px`) {
      iframe.style.height = `${height}px`
    }
  }

  const onLoad = () => {
    observer?.disconnect()
    observer = null
    apply()
    try {
      const doc = iframe.contentDocument
      const win = iframe.contentWindow
      // 이미지 등 하위 리소스 로드 시(캡처 단계)
      doc?.addEventListener('load', apply, true)
      // iframe 너비가 바뀌면 줄바꿈이 달라진다
      win?.addEventListener('resize', apply)
      void doc?.fonts?.ready.then(apply)
      if (typeof ResizeObserver !== 'undefined' && doc?.body) {
        observer = new ResizeObserver(() => apply())
        observer.observe(doc.body)
      }
    } catch {
      /* 다른 출처 등 측정 불가 — 기본 높이 유지 */
    }
    for (const delay of [100, 500, 1500]) timers.push(setTimeout(apply, delay))
    onLoaded?.()
  }

  iframe.addEventListener('load', onLoad)
  return () => {
    iframe.removeEventListener('load', onLoad)
    observer?.disconnect()
    for (const timer of timers) clearTimeout(timer)
  }
}

/** sandbox iframe 미리보기 요소 (에디터·뷰어 공통) */
export function createRawHtmlPreviewFrame(raw: string): HTMLIFrameElement {
  const iframe = document.createElement('iframe')
  iframe.className = 'rich-text-raw-html-block__frame'
  iframe.setAttribute('sandbox', RAW_HTML_BLOCK_IFRAME_SANDBOX)
  iframe.setAttribute('title', 'HTML 원본 미리보기')
  iframe.setAttribute('scrolling', 'no')
  iframe.srcdoc = buildRawHtmlSrcdoc(raw)
  return iframe
}

/**
 * 앱 UI(모달)를 블록의 '소스 편집'에 연결한다. 반환값으로 연결 해제.
 * 에디터에 rawHtmlBlock 확장이 없으면 아무것도 하지 않는다.
 */
export function registerRawHtmlSourceRequester(
  editor: Editor,
  requester: RawHtmlSourceRequester
): () => void {
  const storage = editor.storage.rawHtmlBlock as RawHtmlBlockStorage | undefined
  if (!storage) return () => {}
  storage.requestSource = requester
  return () => {
    if (storage.requestSource === requester) storage.requestSource = null
  }
}

/**
 * 블록 안 '이미지' 버튼이 쓸 업로드 함수를 연결한다(앱의 기존 본문 이미지 업로드 경로).
 * 반환값으로 연결 해제. 연결하지 않으면 버튼이 보이지 않는다.
 */
export function registerRawHtmlImageUploader(
  editor: Editor,
  uploader: RawHtmlImageUploader
): () => void {
  const storage = editor.storage.rawHtmlBlock as RawHtmlBlockStorage | undefined
  if (!storage) return () => {}
  storage.uploadImage = uploader
  return () => {
    if (storage.uploadImage === uploader) storage.uploadImage = null
  }
}

function defaultRequestSource({ initialHtml }: RawHtmlSourceRequest): Promise<string | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  return Promise.resolve(window.prompt('HTML 소스', initialHtml))
}

function createButton(label: string, action: string, title?: string): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `rich-text-raw-html-block__button rich-text-raw-html-block__button--${action}`
  button.textContent = label
  button.dataset.action = action
  if (title) {
    button.title = title
    button.setAttribute('aria-label', title)
  }
  return button
}

function closestAnchor(node: globalThis.Node | null): HTMLAnchorElement | null {
  let current: globalThis.Node | null = node
  while (current) {
    if (current.nodeType === 1 && (current as Element).tagName === 'A') {
      return current as HTMLAnchorElement
    }
    current = current.parentNode
  }
  return null
}

function closestImage(node: globalThis.Node | null): HTMLImageElement | null {
  let current: globalThis.Node | null = node
  while (current) {
    if (current.nodeType === 1 && (current as Element).tagName === 'IMG') {
      return current as HTMLImageElement
    }
    current = current.parentNode
  }
  return null
}

function caretRangeFromPoint(
  doc: Document,
  clientX: number,
  clientY: number
): Range | null {
  const withCaret = doc as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: globalThis.Node; offset: number } | null
  }
  if (typeof withCaret.caretRangeFromPoint === 'function') {
    return withCaret.caretRangeFromPoint(clientX, clientY)
  }
  const position = withCaret.caretPositionFromPoint?.(clientX, clientY)
  if (!position) return null
  const range = doc.createRange()
  range.setStart(position.offsetNode, position.offset)
  range.collapse(true)
  return range
}

function applyImageAlign(img: HTMLImageElement, align: 'left' | 'center' | 'right') {
  img.style.float = align === 'center' ? 'none' : align
  img.style.display = align === 'center' ? 'block' : ''
  img.style.marginLeft = align === 'center' || align === 'right' ? 'auto' : ''
  img.style.marginRight = align === 'center' || align === 'left' ? 'auto' : ''
  if (align === 'center') img.removeAttribute('align')
  else img.setAttribute('align', align)
}

export const RawHtmlBlock = Node.create<Record<string, never>, RawHtmlBlockStorage>({
  name: RAW_HTML_BLOCK_NODE_NAME,
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  isolating: true,
  // 이 노드 앞에서 우선 매칭 (일반 div 파서보다 먼저)
  priority: 1000,

  addStorage() {
    return { requestSource: null, uploadImage: null }
  },

  addAttributes() {
    return {
      html: {
        default: '',
        parseHTML: (element: HTMLElement) =>
          decodeRawHtml(element.getAttribute(RAW_HTML_BLOCK_VALUE_ATTR)),
        renderHTML: (attributes: { html?: string | null }) => ({
          [RAW_HTML_BLOCK_ENCODING_ATTR]: RAW_HTML_BLOCK_ENCODING,
          [RAW_HTML_BLOCK_VALUE_ATTR]: encodeRawHtml(attributes.html ?? ''),
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: `div[${RAW_HTML_BLOCK_ATTR}]`, priority: 1000 }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ [RAW_HTML_BLOCK_ATTR]: '' }, HTMLAttributes)]
  },

  /** textbook 등 Markdown 저장 — HTML 블록으로 그대로 통과(@tiptap/markdown이 html 토큰을 다시 파싱) */
  renderMarkdown: (node: JSONContent) => {
    const html = (node.attrs as { html?: string } | undefined)?.html ?? ''
    return renderRawHtmlBlockWrapper(html)
  },

  addCommands() {
    return {
      insertRawHtmlBlock:
        (html: string) =>
        ({ commands }) => {
          const value = normalizeRawHtmlInput(html)
          if (!value.trim()) return false
          return commands.insertContent({ type: this.name, attrs: { html: value } })
        },
    }
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      let current: ProseMirrorNode = node
      /** iframe이 지금 보여 주는 HTML (자기 저장 값이면 다시 그리지 않는다) */
      let frameHtml = current.attrs.html as string
      let dirty = false
      let commitTimer: ReturnType<typeof setTimeout> | null = null
      let frameFocused = false
      let uploading = false
      let savedRange: Range | null = null
      let draggingImg: HTMLImageElement | null = null
      let detachFrameListeners: () => void = () => {}

      const dom = document.createElement('div')
      dom.className = 'rich-text-raw-html-block'
      dom.setAttribute(RAW_HTML_BLOCK_ATTR, '')
      dom.contentEditable = 'false'

      const toolbar = document.createElement('div')
      toolbar.className = 'rich-text-raw-html-block__toolbar'
      const badge = document.createElement('span')
      badge.className = 'rich-text-raw-html-block__badge'
      badge.textContent = 'HTML 원본'
      badge.title = '눌러서 블록 선택 · 끌어서 이동'
      const hint = document.createElement('span')
      hint.className = 'rich-text-raw-html-block__hint'
      hint.textContent = '이미지를 끌어 위치를 바꿀 수 있어요'
      const editButton = createButton('소스 편집', 'edit')
      const deleteButton = createButton('삭제', 'delete')
      toolbar.append(badge, hint, editButton, deleteButton)

      // 블록 안 직접 편집용 작은 서식 툴바 (iframe에 포커스가 있을 때만 보임)
      const formatBar = document.createElement('div')
      formatBar.className = 'rich-text-raw-html-block__format'
      formatBar.setAttribute('role', 'toolbar')
      formatBar.setAttribute('aria-label', 'HTML 원본 서식')
      const boldButton = createButton('B', 'bold', '굵게')
      const italicButton = createButton('I', 'italic', '기울임')
      const underlineButton = createButton('U', 'underline', '밑줄')
      const alignLeftButton = createButton('좌', 'align-left', '왼쪽 정렬')
      const alignCenterButton = createButton('중', 'align-center', '가운데 정렬')
      const alignRightButton = createButton('우', 'align-right', '오른쪽 정렬')
      const linkButton = createButton('링크', 'link', '링크')
      const imageButton = createButton('이미지', 'image', '이미지 삽입')
      formatBar.append(
        boldButton,
        italicButton,
        underlineButton,
        alignLeftButton,
        alignCenterButton,
        alignRightButton,
        linkButton,
        imageButton
      )

      const fileInput = document.createElement('input')
      fileInput.type = 'file'
      fileInput.accept = RICH_TEXT_IMAGE_ACCEPT
      fileInput.className = 'rich-text-raw-html-block__file-input'
      fileInput.tabIndex = -1
      fileInput.setAttribute('aria-hidden', 'true')

      let iframe = createRawHtmlPreviewFrame(frameHtml)
      dom.append(toolbar, formatBar, fileInput, iframe)

      const resolvePos = (): number | null => {
        const pos = typeof getPos === 'function' ? getPos() : undefined
        return typeof pos === 'number' ? pos : null
      }

      const frameDoc = (): Document | null => {
        try {
          return iframe.contentDocument
        } catch {
          return null
        }
      }

      const uploader = (): RawHtmlImageUploader | null =>
        editor.storage.rawHtmlBlock?.uploadImage ?? null

      const canInlineEdit = () => editor.isEditable && !editor.isDestroyed

      /** 직접 고친 iframe 문서를 노드 속성에 반영 */
      const commit = () => {
        if (commitTimer) clearTimeout(commitTimer)
        commitTimer = null
        if (!dirty) return
        dirty = false
        if (!canInlineEdit()) return
        const doc = frameDoc()
        if (!doc?.documentElement) return
        const html = serializeRawHtmlDocument(doc, {
          fragment: !isRawHtmlDocument(current.attrs.html as string),
        })
        frameHtml = html
        if (html === current.attrs.html) return
        const pos = resolvePos()
        if (pos == null) return
        const target = editor.state.doc.nodeAt(pos)
        if (!target || target.type.name !== RAW_HTML_BLOCK_NODE_NAME) return
        const tr = editor.state.tr.setNodeMarkup(pos, undefined, { ...target.attrs, html })
        tr.setMeta(RAW_HTML_BLOCK_INLINE_EDIT_META, true)
        editor.view.dispatch(tr)
      }

      const scheduleCommit = () => {
        dirty = true
        if (commitTimer) clearTimeout(commitTimer)
        commitTimer = setTimeout(commit, RAW_HTML_BLOCK_EDIT_DEBOUNCE_MS)
      }

      const positionFormatBar = () => {
        if (!frameFocused) return
        const doc = frameDoc()
        const selection = doc?.getSelection()
        let rect: DOMRect | null = null
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          rect = range.getBoundingClientRect()
          if (rect.top === 0 && rect.bottom === 0) {
            rect = range.getClientRects()[0] ?? null
            if (!rect) {
              const el =
                range.startContainer.nodeType === 1
                  ? (range.startContainer as Element)
                  : range.startContainer.parentElement
              rect = el?.getBoundingClientRect() ?? null
            }
          }
        }
        const barHeight = formatBar.offsetHeight || 30
        const barWidth = formatBar.offsetWidth || 220
        const frameTop = iframe.offsetTop
        let top = frameTop + (rect ? rect.top : 0) - barHeight - 6
        if (top < 0) top = frameTop + (rect ? rect.bottom : 0) + 6
        const maxLeft = Math.max(0, dom.clientWidth - barWidth)
        const left = Math.min(Math.max(0, rect ? rect.left : 0), maxLeft)
        formatBar.style.top = `${Math.round(top)}px`
        formatBar.style.left = `${Math.round(left)}px`
      }

      const setFrameFocused = (next: boolean) => {
        frameFocused = next && canInlineEdit()
        dom.classList.toggle('rich-text-raw-html-block--editing', frameFocused || uploading)
        imageButton.hidden = uploader() == null
        if (frameFocused) positionFormatBar()
      }

      /** 에디터 편집 가능 여부에 맞춰 iframe designMode를 켜고 끈다 */
      const syncEditable = () => {
        const editable = canInlineEdit()
        dom.classList.toggle('rich-text-raw-html-block--editable', editable)
        iframe.title = editable ? 'HTML 원본 (눌러서 바로 편집)' : 'HTML 원본 미리보기'
        const doc = frameDoc()
        if (!doc?.documentElement) return
        const mode = editable ? 'on' : 'off'
        if (doc.designMode !== mode) {
          try {
            doc.designMode = mode
          } catch {
            /* 측정·편집 불가 문서 */
          }
        }
        if (!editable) {
          if (dirty) commit()
          setFrameFocused(false)
        }
      }

      const saveSelection = () => {
        const selection = frameDoc()?.getSelection()
        savedRange =
          selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null
      }

      const restoreSelection = (): Selection | null => {
        const doc = frameDoc()
        const win = iframe.contentWindow
        if (!doc || !win) return null
        win.focus()
        const selection = doc.getSelection()
        if (!selection) return null
        if (savedRange && savedRange.startContainer.ownerDocument === doc && savedRange.startContainer.isConnected) {
          selection.removeAllRanges()
          selection.addRange(savedRange)
        } else if (selection.rangeCount === 0 && doc.body) {
          const range = doc.createRange()
          range.selectNodeContents(doc.body)
          range.collapse(false)
          selection.addRange(range)
        }
        return selection
      }

      const markImagesDraggable = (doc: Document) => {
        for (const img of Array.from(doc.querySelectorAll('img'))) {
          img.draggable = true
        }
      }

      const applyAlign = (align: 'left' | 'center' | 'right') => {
        if (!canInlineEdit()) return
        restoreSelection()
        const img = closestImage(savedRange?.commonAncestorContainer ?? null)
        if (img) {
          applyImageAlign(img, align)
          scheduleCommit()
          positionFormatBar()
          return
        }
        const command =
          align === 'left' ? 'justifyLeft' : align === 'right' ? 'justifyRight' : 'justifyCenter'
        exec(command)
      }

      const exec = (command: string, value?: string): boolean => {
        const doc = frameDoc()
        if (!doc || !canInlineEdit()) return false
        iframe.contentWindow?.focus()
        let ok = false
        try {
          ok = doc.execCommand(command, false, value)
        } catch {
          ok = false
        }
        // 변경은 iframe의 input 이벤트로 저장한다(바뀐 게 없으면 원본 문자열 유지)
        positionFormatBar()
        return ok
      }

      const insertHtmlAtCaret = (html: string) => {
        const doc = frameDoc()
        if (!doc) return
        const selection = restoreSelection()
        if (!exec('insertHTML', html) && selection && selection.rangeCount > 0) {
          // execCommand가 안 되는 브라우저 — Range로 직접 넣는다
          const range = selection.getRangeAt(0)
          range.deleteContents()
          const template = doc.createElement('template')
          template.innerHTML = html
          const fragment = template.content
          const last = fragment.lastChild
          range.insertNode(fragment)
          if (last) {
            range.setStartAfter(last)
            range.collapse(true)
            selection.removeAllRanges()
            selection.addRange(range)
          }
          scheduleCommit()
        }
      }

      const insertUploadedImage = async (file: File) => {
        const upload = uploader()
        if (!upload) return
        const invalid = validateRawHtmlImageFile(file)
        if (invalid) {
          window.alert(invalid)
          return
        }
        uploading = true
        imageButton.disabled = true
        imageButton.textContent = '업로드 중…'
        try {
          const url = normalizeUploadedImageUrl(await upload(file))
          if (!url) {
            window.alert('이미지 주소를 받지 못했어요. 다시 시도해 주세요.')
            return
          }
          if (!canInlineEdit()) return
          insertHtmlAtCaret(buildRawHtmlImageTag(url))
          commit()
        } catch (error) {
          const message = error instanceof Error ? error.message.trim() : ''
          window.alert(message || '이미지를 올리지 못했어요. 다시 시도해 주세요.')
        } finally {
          uploading = false
          imageButton.disabled = false
          imageButton.textContent = '이미지'
          setFrameFocused(frameFocused)
        }
      }

      const handleLink = () => {
        const doc = frameDoc()
        if (!doc) return
        saveSelection()
        const anchor = closestAnchor(savedRange?.commonAncestorContainer ?? null)
        const input = window.prompt(
          '링크 URL (비우면 링크 해제)',
          anchor?.getAttribute('href') ?? 'https://'
        )
        if (input == null) {
          restoreSelection()
          return
        }
        const selection = restoreSelection()
        if (!input.trim() || input.trim() === 'https://') {
          if (anchor && savedRange?.collapsed) {
            const range = doc.createRange()
            range.selectNodeContents(anchor)
            selection?.removeAllRanges()
            selection?.addRange(range)
          }
          exec('unlink')
          return
        }
        const href = normalizeRawHtmlLinkUrl(input)
        if (!href) {
          window.alert('링크는 https://, http://, mailto:, tel: 로 시작해 주세요.')
          return
        }
        if (anchor && savedRange?.collapsed) {
          anchor.setAttribute('href', href)
          scheduleCommit()
          return
        }
        if (!savedRange || savedRange.collapsed) {
          const safe = escapeRawHtmlAttr(href)
          insertHtmlAtCaret(`<a href="${safe}">${safe}</a>`)
          return
        }
        exec('createLink', href)
      }

      /** 파일 붙여넣기·끌어놓기 — data: 이미지가 들어가지 않게 막고, 업로더가 있으면 올린다 */
      const handleFileTransfer = (event: ClipboardEvent | DragEvent, files: FileList | null | undefined) => {
        const images = Array.from(files ?? []).filter(file => file.type.startsWith('image/'))
        if (images.length === 0) return
        event.preventDefault()
        if (!uploader()) {
          window.alert('이 블록에는 이미지 파일을 직접 넣을 수 없어요.')
          return
        }
        saveSelection()
        void (async () => {
          for (const file of images) await insertUploadedImage(file)
        })()
      }

      /** 붙여넣기 등으로 들어온 data: 이미지는 화면에서도 바로 지운다 */
      const removeLiveDataImages = (doc: Document) => {
        for (const img of Array.from(doc.querySelectorAll('img'))) {
          if (isDataUriImage(img)) img.remove()
        }
      }

      const attachFrameListeners = () => {
        detachFrameListeners()
        const doc = frameDoc()
        const win = iframe.contentWindow
        if (!doc || !win) return
        const onInput = () => {
          if (!canInlineEdit()) return
          removeLiveDataImages(doc)
          markImagesDraggable(doc)
          scheduleCommit()
          positionFormatBar()
        }
        const onFocus = () => setFrameFocused(true)
        const onBlur = () => {
          commit()
          // 서식 버튼·파일 선택 중에는 툴바 유지
          if (!uploading) setFrameFocused(false)
        }
        const onSelectionChange = () => positionFormatBar()
        const onPaste = (event: ClipboardEvent) => {
          if (!canInlineEdit()) return
          handleFileTransfer(event, event.clipboardData?.files)
        }
        const onDragStart = (event: DragEvent) => {
          if (!canInlineEdit()) return
          const img = closestImage(event.target as globalThis.Node | null)
          if (!img) return
          draggingImg = img
          event.dataTransfer?.setData('text/plain', img.getAttribute('src') ?? '')
          event.dataTransfer?.setDragImage(img, 8, 8)
        }
        const onDragOver = (event: DragEvent) => {
          if (!canInlineEdit()) return
          const types = Array.from(event.dataTransfer?.types ?? [])
          if (draggingImg || types.includes('Files')) {
            event.preventDefault()
            if (event.dataTransfer) event.dataTransfer.dropEffect = draggingImg ? 'move' : 'copy'
          }
        }
        const onDrop = (event: DragEvent) => {
          if (!canInlineEdit()) return
          const files = event.dataTransfer?.files
          if (files && files.length > 0) {
            draggingImg = null
            handleFileTransfer(event, files)
            return
          }
          const img = draggingImg
          draggingImg = null
          if (!img || !img.isConnected) return
          event.preventDefault()
          const range = caretRangeFromPoint(doc, event.clientX, event.clientY)
          if (!range) return
          if (img === range.startContainer || img.contains(range.startContainer)) return
          img.parentNode?.removeChild(img)
          range.insertNode(img)
          markImagesDraggable(doc)
          scheduleCommit()
        }
        const onDragEnd = () => {
          draggingImg = null
        }
        const onClick = (event: MouseEvent) => {
          // 편집 중에는 링크로 이동하지 않는다
          if (canInlineEdit() && closestAnchor(event.target as globalThis.Node | null)) {
            event.preventDefault()
          }
        }
        markImagesDraggable(doc)
        doc.addEventListener('input', onInput)
        doc.addEventListener('selectionchange', onSelectionChange)
        doc.addEventListener('paste', onPaste)
        doc.addEventListener('dragstart', onDragStart)
        doc.addEventListener('dragover', onDragOver)
        doc.addEventListener('drop', onDrop)
        doc.addEventListener('dragend', onDragEnd)
        doc.addEventListener('click', onClick)
        win.addEventListener('focus', onFocus)
        win.addEventListener('blur', onBlur)
        detachFrameListeners = () => {
          doc.removeEventListener('input', onInput)
          doc.removeEventListener('selectionchange', onSelectionChange)
          doc.removeEventListener('paste', onPaste)
          doc.removeEventListener('dragstart', onDragStart)
          doc.removeEventListener('dragover', onDragOver)
          doc.removeEventListener('drop', onDrop)
          doc.removeEventListener('dragend', onDragEnd)
          doc.removeEventListener('click', onClick)
          win.removeEventListener('focus', onFocus)
          win.removeEventListener('blur', onBlur)
          detachFrameListeners = () => {}
        }
      }

      const onFrameLoaded = () => {
        attachFrameListeners()
        syncEditable()
      }

      let detachHeight = attachAutoHeight(iframe, onFrameLoaded)

      const replaceFrame = (html: string) => {
        if (commitTimer) clearTimeout(commitTimer)
        commitTimer = null
        dirty = false
        detachFrameListeners()
        detachHeight()
        frameHtml = html
        const next = createRawHtmlPreviewFrame(html)
        iframe.replaceWith(next)
        iframe = next
        setFrameFocused(false)
        detachHeight = attachAutoHeight(iframe, onFrameLoaded)
      }

      const keepFrameFocus = (event: MouseEvent) => {
        // 서식 버튼을 눌러도 iframe 선택 영역이 사라지지 않게
        event.preventDefault()
        saveSelection()
      }
      formatBar.addEventListener('mousedown', keepFrameFocus)

      boldButton.addEventListener('click', () => exec('bold'))
      italicButton.addEventListener('click', () => exec('italic'))
      underlineButton.addEventListener('click', () => exec('underline'))
      alignLeftButton.addEventListener('click', () => applyAlign('left'))
      alignCenterButton.addEventListener('click', () => applyAlign('center'))
      alignRightButton.addEventListener('click', () => applyAlign('right'))
      linkButton.addEventListener('click', handleLink)
      imageButton.addEventListener('click', () => {
        if (!uploader() || uploading) return
        saveSelection()
        fileInput.click()
      })
      fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0]
        fileInput.value = ''
        if (file) void insertUploadedImage(file)
      })

      editButton.addEventListener('click', event => {
        event.preventDefault()
        if (!editor.isEditable) return
        commit()
        const request = editor.storage.rawHtmlBlock?.requestSource ?? defaultRequestSource
        void request({ initialHtml: current.attrs.html as string, mode: 'edit' }).then(next => {
          if (next == null) return
          const value = normalizeRawHtmlInput(next)
          if (!value.trim()) return
          const pos = resolvePos()
          if (pos == null) return
          editor
            .chain()
            .command(({ tr }) => {
              tr.setNodeMarkup(pos, undefined, { ...current.attrs, html: value })
              return true
            })
            .run()
        })
      })

      deleteButton.addEventListener('click', event => {
        event.preventDefault()
        if (!editor.isEditable) return
        const pos = resolvePos()
        if (pos == null) return
        if (commitTimer) clearTimeout(commitTimer)
        dirty = false
        editor
          .chain()
          .focus()
          .command(({ tr }) => {
            tr.delete(pos, pos + current.nodeSize)
            return true
          })
          .run()
      })

      // setEditable(true/false)는 'update'를 낸다
      const onEditorChange = () => syncEditable()
      editor.on('update', onEditorChange)

      return {
        dom,
        update: updated => {
          if (updated.type !== current.type) return false
          current = updated
          // 자기 직접 편집으로 생긴 값이면 다시 그리지 않는다(커서·실행 취소 스택 유지)
          if ((current.attrs.html as string) !== frameHtml) {
            replaceFrame(current.attrs.html as string)
          }
          return true
        },
        selectNode: () => dom.classList.add('rich-text-raw-html-block--selected'),
        deselectNode: () => dom.classList.remove('rich-text-raw-html-block--selected'),
        stopEvent: event => {
          const target = event.target
          if (!(target instanceof Element)) return false
          // 배지는 ProseMirror에 맡긴다(노드 선택·드래그)
          if (badge.contains(target)) return false
          return (
            toolbar.contains(target) ||
            formatBar.contains(target) ||
            target === fileInput ||
            target === iframe
          )
        },
        ignoreMutation: () => true,
        destroy: () => {
          // 노드가 지워지는 중일 수 있어 여기서는 저장하지 않는다(blur에서 이미 저장)
          if (commitTimer) clearTimeout(commitTimer)
          editor.off('update', onEditorChange)
          detachFrameListeners()
          detachHeight()
        },
      }
    }
  },
})
