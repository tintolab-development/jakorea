import { useEffect, useRef } from 'react'
import styles from './kakao-map-embed.module.css'

type KakaoMapEmbedProps = {
  html: string
  className?: string
}

function loadExternalScript(host: HTMLElement, sourceScript: HTMLScriptElement) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    Array.from(sourceScript.attributes).forEach(attr => {
      script.setAttribute(attr.name, attr.value)
    })
    script.async = false
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${sourceScript.src}`))
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

/**
 * link/div를 먼저 붙인 뒤 script는 src → inline 순서로 실행한다.
 * (Leaflet 등 외부 SDK 로드 후 초기화 스크립트가 돌도록)
 */
async function mountEmbedHtml(host: HTMLElement, html: string, trackedLinks: HTMLLinkElement[]) {
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

    host.appendChild(node.cloneNode(true))
  })

  for (const sourceScript of scripts) {
    if (sourceScript.src) {
      await loadExternalScript(host, sourceScript)
    } else {
      appendInlineScript(host, sourceScript)
    }
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

    host.replaceChildren()
    const trackedLinks: HTMLLinkElement[] = []
    let cancelled = false

    const trimmed = html.trim()
    if (!trimmed) return

    void mountEmbedHtml(host, trimmed, trackedLinks).catch(() => {
      if (!cancelled) {
        // 지도 스크립트/HTML 오류 시 UI는 유지하고 빈 영역만 둔다
      }
    })

    return () => {
      cancelled = true
      host.replaceChildren()
      trackedLinks.forEach(link => {
        link.remove()
      })
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
