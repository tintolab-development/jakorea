import { matchPathPrefixes, writeOpenApiSubset } from './lib/write-openapi-subset.mjs'

writeOpenApiSubset({
  outputFileName: 'ja-korea.openapi.json',
  subsetTitle: 'JA Korea subset',
  description: 'Filtered for Homepage Admin JA Korea Orval codegen.',
  matchPath: matchPathPrefixes(['/api/admin/ja-korea', '/api/public/ja-korea']),
})
