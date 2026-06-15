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

/** html2canvas 캡처 전 — 레이아웃 커밋·이미지·배경 로드 대기 */
export async function waitForCertificatePreviewCaptureReady(
  root: HTMLElement | null
): Promise<void> {
  if (root == null) return

  await new Promise<void>(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })

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
