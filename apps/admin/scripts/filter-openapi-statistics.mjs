import { matchPathPrefixes, writeOpenApiSubset } from './lib/write-openapi-subset.mjs'

writeOpenApiSubset({
  outputFileName: 'statistics.openapi.json',
  subsetTitle: 'Statistics subset',
  description: 'Filtered for Homepage Admin statistics Orval codegen.',
  matchPath: matchPathPrefixes(['/api/admin/statistics', '/api/public/analytics']),
})
