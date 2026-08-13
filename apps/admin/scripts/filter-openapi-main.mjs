import { matchPathPrefixes, writeOpenApiSubset } from './lib/write-openapi-subset.mjs'

writeOpenApiSubset({
  outputFileName: 'main.openapi.json',
  subsetTitle: 'Main subset',
  description: 'Filtered for Homepage Admin main-screen Orval codegen.',
  matchPath: matchPathPrefixes(['/api/admin/main', '/api/public/main']),
})
