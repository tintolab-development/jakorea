#!/usr/bin/env node
/**
 * 빌드된 index.html에 Admin "사이트 정보 관리" 값을 OG·description·favicon 태그로 넣는다.
 * 링크 미리보기 크롤러는 JS를 실행하지 않으므로 런타임 SiteDocumentHead만으로는 부족하다.
 *
 * env
 * - HOMEPAGE_API_BASE_URL (필수): GET {base}/api/public/site/settings
 * - PLATFORM_PUBLIC_ORIGIN (선택): og:url. 비면 og:url을 넣지 않는다.
 * - OG_INJECT_STRICT=1 (선택): API 실패 시 배포를 실패시킨다. 기본은 경고 후 index.html 유지.
 *
 * usage: node scripts/inject-site-og.mjs [dist/index.html]
 */

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const DEFAULT_SITE_NAME = 'JA Korea'
const FETCH_TIMEOUT_MS = 5_000

/** 이 스크립트가 관리하는 태그. og:type·og:locale·twitter:card는 index.html 정적 값을 유지한다. */
const MANAGED_META_KEYS = [
  'description',
  'og:title',
  'og:site_name',
  'og:description',
  'og:image',
  'og:url',
  'twitter:title',
  'twitter:description',
  'twitter:image',
]

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** `{ success: true, data }` 래퍼 해제 — platform map-public-settings.ts와 같은 규칙 */
function unwrapPayload(payload) {
  let current = payload
  for (let depth = 0; depth < 3; depth += 1) {
    if (!isRecord(current) || current.success !== true || !('data' in current)) return current
    current = current.data
  }
  return current
}

function readText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function readHttpUrl(value) {
  const url = readText(value)
  return /^https?:\/\//i.test(url) ? url : ''
}

function escapeAttr(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function fetchSiteSettings(baseUrl) {
  const url = `${baseUrl.replace(/\/$/, '')}/api/public/site/settings`
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`GET ${url} → ${response.status}`)
  const body = unwrapPayload(await response.json())
  if (!isRecord(body)) throw new Error(`GET ${url} → 객체가 아닌 응답`)
  return {
    siteName: readText(body.siteName) || DEFAULT_SITE_NAME,
    description: readText(body.seoMetaDescription),
    ogImageUrl: readHttpUrl(body.ogImageUrl),
    faviconUrl: readHttpUrl(body.faviconUrl),
  }
}

function buildHeadTags(settings, publicOrigin) {
  const meta = (attr, key, content) =>
    `<meta ${attr}="${key}" content="${escapeAttr(content)}" />`
  const tags = [
    meta('property', 'og:title', settings.siteName),
    meta('property', 'og:site_name', settings.siteName),
    meta('name', 'twitter:title', settings.siteName),
  ]
  if (settings.description) {
    tags.push(
      meta('name', 'description', settings.description),
      meta('property', 'og:description', settings.description),
      meta('name', 'twitter:description', settings.description),
    )
  }
  if (settings.ogImageUrl) {
    tags.push(
      meta('property', 'og:image', settings.ogImageUrl),
      meta('name', 'twitter:image', settings.ogImageUrl),
    )
  }
  if (publicOrigin) {
    tags.push(meta('property', 'og:url', `${publicOrigin.replace(/\/$/, '')}/`))
  }
  if (settings.faviconUrl) {
    tags.push(`<link rel="icon" href="${escapeAttr(settings.faviconUrl)}" />`)
  }
  return tags
}

export function injectSiteOg(html, settings, publicOrigin) {
  if (!/<\/head>/i.test(html)) throw new Error('index.html에 </head>가 없습니다.')
  let next = html
  for (const key of MANAGED_META_KEYS) {
    const pattern = new RegExp(
      `[ \\t]*<meta\\s+(?:property|name)="${escapeRegExp(key)}"[^>]*>[ \\t]*\\r?\\n?`,
      'gi',
    )
    next = next.replace(pattern, '')
  }
  if (settings.faviconUrl) {
    next = next.replace(/[ \t]*<link\s+rel="icon"[^>]*>[ \t]*\r?\n?/gi, '')
  }
  next = next.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeAttr(settings.siteName)}</title>`,
  )
  const block = buildHeadTags(settings, publicOrigin)
    .map(tag => `    ${tag}\n`)
    .join('')
  return next.replace(/([ \t]*)<\/head>/i, `${block}$1</head>`)
}

async function main() {
  const target = resolve(process.argv[2] ?? 'dist/index.html')
  const baseUrl = process.env.HOMEPAGE_API_BASE_URL?.trim()
  const publicOrigin = process.env.PLATFORM_PUBLIC_ORIGIN?.trim() ?? ''
  const strict = process.env.OG_INJECT_STRICT === '1'

  if (!baseUrl) {
    console.error('HOMEPAGE_API_BASE_URL=MISSING')
    process.exit(1)
  }

  let settings
  try {
    settings = await fetchSiteSettings(baseUrl)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (strict) {
      console.error(`SITE_OG_INJECT=FAIL ${message}`)
      process.exit(1)
    }
    console.warn(`SITE_OG_INJECT=SKIP (index.html 기본값 유지) ${message}`)
    return
  }

  const html = await readFile(target, 'utf8')
  await writeFile(target, injectSiteOg(html, settings, publicOrigin), 'utf8')
  console.log(
    `SITE_OG_INJECT=PASS title=${JSON.stringify(settings.siteName)} ` +
      `description=${settings.description ? 'Y' : 'N'} image=${settings.ogImageUrl ? 'Y' : 'N'} ` +
      `favicon=${settings.faviconUrl ? 'Y' : 'N'} url=${publicOrigin ? 'Y' : 'N'}`,
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
