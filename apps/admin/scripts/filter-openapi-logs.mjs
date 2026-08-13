import { matchPathPrefixes, writeOpenApiSubset } from './lib/write-openapi-subset.mjs'

writeOpenApiSubset({
  outputFileName: 'logs.openapi.json',
  subsetTitle: 'Logs subset',
  description: 'Filtered for Homepage Admin logs Orval codegen.',
  matchPath: matchPathPrefixes(['/api/admin/logs']),
})
