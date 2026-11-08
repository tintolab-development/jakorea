import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSiteSettings } from '../api/use-site-shell'

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attribute}="${key}"]`
  const existing = document.head.querySelector<HTMLMetaElement>(selector)
  const created = !existing
  const previous = existing?.getAttribute('content')
  const element = existing ?? document.createElement('meta')
  element.setAttribute(attribute, key)
  element.setAttribute('content', content)
  if (created) document.head.appendChild(element)
  return () => {
    if (created) {
      element.remove()
      return
    }
    if (previous == null) element.removeAttribute('content')
    else element.setAttribute('content', previous)
  }
}

function probeImage(url: string, signal: { cancelled: boolean }, onLoad: () => void) {
  const image = new Image()
  image.onload = () => {
    if (!signal.cancelled) onLoad()
  }
  image.onerror = () => {
    // 404면 기존 정적 자산을 유지한다.
  }
  image.src = url
}

/**
 * 사이트 설정 구독은 여기 한 곳. 첫 응답 전과 실패는 index.html 헤드를 유지한다.
 */
export function SiteDocumentHead() {
  const settings = useSiteSettings()
  const { pathname } = useLocation()

  useEffect(() => {
    return upsertMeta('property', 'og:url', `${window.location.origin}${pathname}`)
  }, [pathname])

  useEffect(() => {
    if (settings.source !== 'remote' || !settings.title) return

    const previousTitle = document.title
    document.title = settings.title
    const restores = [() => { document.title = previousTitle }]

    if (settings.description) {
      restores.push(upsertMeta('name', 'description', settings.description))
      restores.push(upsertMeta('property', 'og:description', settings.description))
    }
    restores.push(upsertMeta('property', 'og:title', settings.title))
    restores.push(upsertMeta('property', 'og:site_name', settings.title))

    const signal = { cancelled: false }
    if (settings.ogImageUrl) {
      probeImage(settings.ogImageUrl, signal, () => {
        restores.push(upsertMeta('property', 'og:image', settings.ogImageUrl!))
      })
    }
    if (settings.faviconUrl) {
      probeImage(settings.faviconUrl, signal, () => {
        const link =
          document.head.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
          document.createElement('link')
        const created = !link.isConnected
        const previousHref = link.getAttribute('href')
        const previousType = link.getAttribute('type')
        link.rel = 'icon'
        link.removeAttribute('type')
        link.href = settings.faviconUrl!
        if (created) document.head.appendChild(link)
        restores.push(() => {
          if (created) {
            link.remove()
            return
          }
          if (previousHref == null) link.removeAttribute('href')
          else link.href = previousHref
          if (previousType == null) link.removeAttribute('type')
          else link.setAttribute('type', previousType)
        })
      })
    }

    return () => {
      signal.cancelled = true
      for (const restore of restores) restore()
    }
  }, [settings])

  return null
}
