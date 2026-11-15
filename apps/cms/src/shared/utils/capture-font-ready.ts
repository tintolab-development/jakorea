/**
 * html2canvas 캡처 전 웹폰트 준비 — 증명서·A4 문서·설문 결과 PDF 공통.
 *
 * 화면(DOM)은 폰트가 늦게 와도 대체 폰트로 배치하지만 html2canvas는 캔버스에 다시 그리므로, 로드 전에 캡처하면
 * 글자 폭·기준선이 달라져 PDF 글자가 밀린다. html2canvas가 만드는 복제 문서(iframe)도 폰트를 따로 불러온다.
 */

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

function sampleText(root: HTMLElement): string {
  return (root.textContent ?? '').replace(/\s+/g, '').slice(0, 200) || '가A1'
}

async function loadFonts(fontSet: FontFaceSet | undefined, source: HTMLElement): Promise<void> {
  if (!fontSet || typeof fontSet.load !== 'function') return
  const sample = sampleText(source)
  await Promise.all(
    collectCaptureFontShorthands(source).map(font => fontSet.load(font, sample).catch(() => []))
  )
  await fontSet.ready
}

/** 현재 문서에서 캡처 영역이 쓰는 웹폰트를 로드하고 기다린다. */
export async function waitForCaptureFonts(root: HTMLElement): Promise<void> {
  await loadFonts(typeof document !== 'undefined' ? document.fonts : undefined, root)
}

/**
 * html2canvas `onclone`에서 호출 — 복제 문서에서 원본 캡처 영역이 쓰는 폰트를 로드하고 기다린 뒤
 * 배치를 계산하게 한다(html2canvas 1.4.1은 onclone이 돌려준 Promise를 기다린다).
 */
export async function waitForClonedDocumentFonts(
  clonedDoc: Document,
  sourceElement: HTMLElement
): Promise<void> {
  await loadFonts(clonedDoc.fonts, sourceElement)
}
