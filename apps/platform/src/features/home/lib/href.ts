export type HomeHref = {
  href: string
  external: boolean
}

const JAKOREA_HOSTS = new Set(['jakorea.org', 'www.jakorea.org'])

export function parseHomeHref(raw: string): HomeHref {
  const value = raw.trim()
  if (!value) return { href: '/', external: false }
  if (value.startsWith('/')) return { href: value, external: false }
  if (value.startsWith('mailto:')) return { href: value, external: true }

  try {
    const url = new URL(value)
    if (JAKOREA_HOSTS.has(url.hostname.toLowerCase())) {
      const path = `${url.pathname}${url.search}${url.hash}`
      return { href: path || '/', external: false }
    }
  } catch {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return { href: value, external: true }
    }
    if (value.startsWith('/')) return { href: value, external: false }
  }

  return { href: value, external: true }
}

export function resolveHomeHref(url: string | undefined, fallback: string): HomeHref {
  const raw = url?.trim()
  if (!raw) return parseHomeHref(fallback)
  return parseHomeHref(raw)
}
