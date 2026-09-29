import fs from 'node:fs'
import path from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'

const URL_PREFIX = '/platform-preview/'

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
}

type PlatformPreviewBundleOptions = {
  /** `apps/platform` `vite build --mode platform-preview` 결과 */
  bundleDir: string
}

/**
 * Platform 모집 미리보기 번들을 CMS와 같은 도메인 `/platform-preview/`로 제공한다.
 * dev는 정적 서빙, build는 `dist/platform-preview/`로 복사.
 */
export function platformPreviewBundlePlugin({ bundleDir }: PlatformPreviewBundleOptions): Plugin {
  let config: ResolvedConfig

  return {
    name: 'cms-platform-preview-bundle',
    configResolved(resolved) {
      config = resolved
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (!url.startsWith(URL_PREFIX)) return next()
        const relative = decodeURIComponent(url.slice(URL_PREFIX.length)) || 'preview.html'
        const filePath = path.resolve(bundleDir, relative)
        if (!filePath.startsWith(path.resolve(bundleDir) + path.sep)) {
          res.statusCode = 403
          res.end()
          return
        }
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          res.statusCode = 404
          res.end('platform preview bundle not found — run `pnpm --filter platform build:preview`')
          return
        }
        res.setHeader(
          'Content-Type',
          MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
        )
        res.setHeader('Cache-Control', 'no-cache')
        fs.createReadStream(filePath).pipe(res)
      })
    },
    closeBundle() {
      if (config.command !== 'build' || config.build.ssr) return
      if (!fs.existsSync(path.join(bundleDir, 'preview.html'))) {
        throw new Error(
          `[cms-platform-preview-bundle] ${bundleDir}/preview.html 없음 — \`pnpm --filter platform build:preview\` 선행 필요`,
        )
      }
      const outDir = path.resolve(config.root, config.build.outDir, 'platform-preview')
      fs.rmSync(outDir, { recursive: true, force: true })
      fs.cpSync(bundleDir, outDir, { recursive: true })
    },
  }
}
