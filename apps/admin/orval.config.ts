import { defineConfig } from 'orval'

const mutator = {
  path: './src/shared/api/orval-mutator.ts',
  name: 'customInstance',
} as const

function domainConfig(fileSlug: string) {
  return {
    input: `./openapi/${fileSlug}.openapi.json`,
    output: {
      mode: 'split' as const,
      target: `./src/shared/api/generated/${fileSlug}/${fileSlug}-api.ts`,
      schemas: `./src/shared/api/generated/${fileSlug}/schemas`,
      client: 'axios' as const,
      prettier: false,
      override: { mutator },
    },
  }
}

export default defineConfig({
  main: domainConfig('main'),
  jaKorea: domainConfig('ja-korea'),
  impactStory: domainConfig('impact-story'),
  education: domainConfig('education'),
  sponsorship: domainConfig('sponsorship'),
  participation: domainConfig('participation'),
  site: domainConfig('site'),
  statistics: domainConfig('statistics'),
  logs: domainConfig('logs'),
  assets: domainConfig('assets'),
  me: domainConfig('me'),
})
