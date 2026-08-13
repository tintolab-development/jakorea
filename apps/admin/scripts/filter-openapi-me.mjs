import { matchPathPrefixes, writeOpenApiSubset } from './lib/write-openapi-subset.mjs'

writeOpenApiSubset({
  outputFileName: 'me.openapi.json',
  subsetTitle: 'Me subset',
  description: 'Filtered for Homepage Admin me Orval codegen.',
  matchPath: matchPathPrefixes(['/api/admin/me']),
})
