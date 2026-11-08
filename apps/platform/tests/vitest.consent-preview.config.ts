import { fileURLToPath } from 'node:url'

export default {
  root: fileURLToPath(new URL('..', import.meta.url)),
  resolve: {
    alias: [
      {
        find: /^@\//,
        replacement: '@/',
        async customResolver(source: string, importer: string | undefined) {
          const app = importer?.includes('/apps/cms/') ? '../../cms/src/' : '../src/'
          return this.resolve(
            fileURLToPath(new URL(app + source.slice(2), import.meta.url)),
            importer,
            { skipSelf: true }
          )
        },
      },
    ],
    dedupe: ['react', 'react-dom', 'antd'],
  },
  esbuild: { jsx: 'automatic' as const },
  test: {
    environment: 'jsdom',
    include: ['tests/consent-portrait-preview.test.tsx'],
    css: true,
  },
}
