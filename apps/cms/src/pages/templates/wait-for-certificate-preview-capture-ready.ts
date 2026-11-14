function loadImage(src: string): Promise<void> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
  })
}

function extractCssBackgroundImageUrl(element: HTMLElement): string | null {
  const raw = element.style.getPropertyValue('--certificate-bg-url')
  const match = raw.match(/url\(["']?([^"')]+)["']?\)/)
  return match?.[1] ?? null
}

/**
 * 캡처 영역 글자에 쓰인 폰트(굵기·크기·패밀리) 목록. 같은 조합은 한 번만.
 *
 * 실제 굵기와 함께 기본 굵기(400)도 넣는다. html2canvas(1.4.1 `FontMetrics.parseMetrics`)는 글자 기준선을
 * 잴 때 측정용 요소에 글꼴·크기만 주고 굵기를 주지 않아 400 face로 잰다. 그 face가 로드 전이면 대체 폰트
 * 기준선으로 그려, 새로고침 직후 첫 다운로드에서 제목(Source Han Serif K Bold)이 약 28px 위로 밀린다.
 */
export function collectCaptureFontShorthands(root: HTMLElement): string[] {
  const fonts = new Set<string>()
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))]
  for (const element of elements) {
    const hasText = Array.from(element.childNodes).some(
      node => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== ''
    )
    if (!hasText) continue
    const style = getComputedStyle(element)
    if (!style.fontFamily) continue
    fonts.add(`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`)
    fonts.add(`normal 400 ${style.fontSize} ${style.fontFamily}`)
  }
  return Array.from(fonts)
}

/**
 * 캡처 영역 웹폰트 로드 대기. 화면(DOM)은 폰트가 늦게 와도 대체 폰트로 배치하지만 html2canvas는 캔버스에
 * 다시 그리므로, 로드 전에 캡처하면 글자 폭이 달라져 PDF 글자가 밀린다.
 */
async function waitForCaptureFonts(root: HTMLElement): Promise<void> {
  const fontSet = typeof document !== 'undefined' ? document.fonts : undefined
  if (!fontSet || typeof fontSet.load !== 'function') return
  const sample = (root.textContent ?? '').replace(/\s+/g, '').slice(0, 200) || '가A1'
  await Promise.all(
    collectCaptureFontShorthands(root).map(font => fontSet.load(font, sample).catch(() => []))
  )
  await fontSet.ready
}

/** html2canvas 캡처 전 — 레이아웃 커밋·웹폰트·이미지·배경 로드 대기 */
export async function waitForCertificatePreviewCaptureReady(
  root: HTMLElement | null
): Promise<void> {
  if (root == null) return

  await new Promise<void>(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })

  await waitForCaptureFonts(root)

  const bgUrl = extractCssBackgroundImageUrl(root)
  const imageWaits = [
    ...(bgUrl ? [loadImage(bgUrl)] : []),
    ...Array.from(root.querySelectorAll('img')).map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve()
      return new Promise<void>(resolve => {
        const done = () => resolve()
        img.addEventListener('load', done, { once: true })
        img.addEventListener('error', done, { once: true })
      })
    }),
  ]

  await Promise.all(imageWaits)
}
