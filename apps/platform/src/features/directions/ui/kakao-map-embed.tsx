import { useEffect, useRef } from 'react'
import styles from './kakao-map-embed.module.css'

type KakaoMapEmbedProps = {
  html: string
  className?: string
}

type DaumRoughmapConfig = {
  phase?: string
  cdn?: string
  url_protocal?: string
  Lander?: new (options: Record<string, string>) => { render: () => void }
}

type DaumRoughmapWindow = Window & {
  daum?: {
    roughmap?: DaumRoughmapConfig
  }
}

function findLoadedScript(src: string): HTMLScriptElement | undefined {
  for (const node of document.querySelectorAll('script[src]')) {
    if (!(node instanceof HTMLScriptElement)) continue
    const raw = node.getAttribute('src')
    if (node.src === src || raw === src) return node
  }
  return undefined
}

function loadScript(src: string, host: HTMLElement, attrs?: NamedNodeMap) {
  return new Promise<void>((resolve, reject) => {
    if (findLoadedScript(src)) {
      // 이미 로드된 스크립트면 onload를 다시 기다리지 않는다.
      resolve()
      return
    }

    const script = document.createElement('script')
    if (attrs) {
      Array.from(attrs).forEach(attr => {
        if (attr.name !== 'src') {
          script.setAttribute(attr.name, attr.value)
        }
      })
    } else {
      script.charset = 'UTF-8'
    }
    script.src = src
    script.async = false
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    host.appendChild(script)
  })
}

function appendInlineScript(host: HTMLElement, sourceScript: HTMLScriptElement) {
  const script = document.createElement('script')
  Array.from(sourceScript.attributes).forEach(attr => {
    if (attr.name !== 'src') {
      script.setAttribute(attr.name, attr.value)
    }
  })
  script.text = sourceScript.textContent ?? ''
  host.appendChild(script)
}

function isKakaoRoughmapLoader(src: string): boolean {
  return /roughmapLoader\.js/i.test(src)
}

function getRoughmapLander(): DaumRoughmapConfig['Lander'] | undefined {
  return (window as DaumRoughmapWindow).daum?.roughmap?.Lander
}

/**
 * roughmapLoader.js 는 SPA에서 비동기로 붙이면 document.write 가 실패한다.
 * loader 가 세팅한 phase/cdn 으로 lander 스크립트를 직접 로드한다.
 */
function resolveRoughmapLanderSrc(): string | null {
  const rm = (window as DaumRoughmapWindow).daum?.roughmap
  if (!rm?.cdn || !rm?.phase) return null
  const protocol =
    rm.url_protocal || (location.protocol === 'https:' ? 'https:' : 'http:')
  return `${protocol}//t1.kakaocdn.net/kakaomapweb/roughmap/place/${rm.phase}/${rm.cdn}/roughmapLander.js`
}

function waitForKakaoRoughmapLander(
  isActive: () => boolean,
  timeoutMs = 8_000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now()
    const tick = () => {
      if (!isActive()) {
        reject(new Error('Kakao Roughmap mount cancelled'))
        return
      }
      if (typeof getRoughmapLander() === 'function') {
        resolve()
        return
      }
      if (Date.now() - started >= timeoutMs) {
        reject(new Error('Kakao Roughmap Lander was not ready'))
        return
      }
      window.setTimeout(tick, 50)
    }
    tick()
  })
}

async function ensureKakaoRoughmapLander(
  host: HTMLElement,
  isActive: () => boolean,
) {
  if (typeof getRoughmapLander() === 'function') return

  const landerSrc = resolveRoughmapLanderSrc()
  if (landerSrc) {
    await loadScript(landerSrc, host)
  }

  if (!isActive()) return
  await waitForKakaoRoughmapLander(isActive)
}

/**
 * link/div를 먼저 붙인 뒤 script는 src → inline 순서로 실행한다.
 * Roughmap loader 의 document.write 실패를 lander 직접 로드로 보완한다.
 */
async function mountEmbedHtml(
  host: HTMLElement,
  html: string,
  trackedLinks: HTMLLinkElement[],
  isActive: () => boolean,
) {
  const template = document.createElement('template')
  template.innerHTML = html.trim()

  const nodes = Array.from(template.content.childNodes)
  const scripts: HTMLScriptElement[] = []

  nodes.forEach(node => {
    const tag = node.nodeName.toLowerCase()
    if (tag === 'script') {
      scripts.push(node as HTMLScriptElement)
      return
    }

    if (tag === 'link') {
      const sourceLink = node as HTMLLinkElement
      const link = document.createElement('link')
      Array.from(sourceLink.attributes).forEach(attr => {
        link.setAttribute(attr.name, attr.value)
      })
      document.head.appendChild(link)
      trackedLinks.push(link)
      return
    }

    if (!isActive()) return
    host.appendChild(node.cloneNode(true))
  })

  for (const sourceScript of scripts) {
    if (!isActive()) return
    if (sourceScript.src) {
      const restoreWrite = isKakaoRoughmapLoader(sourceScript.src)
        ? installDocumentWriteNoop()
        : null
      try {
        await loadScript(sourceScript.src, host, sourceScript.attributes)
      } finally {
        restoreWrite?.()
      }
      if (!isActive()) return
      if (isKakaoRoughmapLoader(sourceScript.src)) {
        await ensureKakaoRoughmapLander(host, isActive)
      }
    } else {
      if (typeof getRoughmapLander() !== 'function') {
        await ensureKakaoRoughmapLander(host, isActive)
      }
      if (!isActive()) return
      appendInlineScript(host, sourceScript)
    }
  }
}

/** SPA에서 roughmapLoader 의 document.write 경고를 막는다. lander 는 별도 로드. */
function installDocumentWriteNoop(): () => void {
  const original = document.write.bind(document)
  document.write = () => {
    // no-op: lander 는 ensureKakaoRoughmapLander 에서 직접 로드
  }
  return () => {
    document.write = original
  }
}

/**
 * Admin에서 붙여 넣는 카카오 Roughmap HTML 또는 iframe/고정 지도를 마운트한다.
 * React의 dangerouslySetInnerHTML은 script를 실행하지 않으므로 노드를 재생성한다.
 */
export function KakaoMapEmbed({ html, className }: KakaoMapEmbedProps) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let active = true
    const trimmed = html.trim()
    let mountVersion = 0
    let cleanupMount: () => void = () => {}
    let resizeFrame: number | null = null
    let lastWidth = host.getBoundingClientRect().width

    const mount = () => {
      const version = ++mountVersion
      const trackedLinks: HTMLLinkElement[] = []
      host.replaceChildren()
      const isActive = () => active && version === mountVersion

      void mountEmbedHtml(host, trimmed, trackedLinks, isActive).catch(() => {
        // 취소·로드 실패 시 UI는 유지하고 빈 영역만 둔다
      })

      return () => {
        trackedLinks.forEach(link => link.remove())
      }
    }

    if (!trimmed) {
      host.replaceChildren()
      return
    }

    cleanupMount = mount()

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(entries => {
            const nextWidth = entries[0]?.contentRect.width ?? host.getBoundingClientRect().width
            if (Math.abs(nextWidth - lastWidth) < 1) return
            lastWidth = nextWidth
            if (resizeFrame != null) window.cancelAnimationFrame(resizeFrame)
            resizeFrame = window.requestAnimationFrame(() => {
              resizeFrame = null
              if (!active) return
              cleanupMount()
              cleanupMount = mount()
            })
          })
    resizeObserver?.observe(host)

    return () => {
      active = false
      mountVersion += 1
      resizeObserver?.disconnect()
      if (resizeFrame != null) window.cancelAnimationFrame(resizeFrame)
      cleanupMount()
      host.replaceChildren()
    }
  }, [html])

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.mapFrame}>
        <div ref={hostRef} className={styles.mapHost} />
      </div>
    </div>
  )
}
