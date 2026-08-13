import { matchPathPrefixes, writeOpenApiSubset } from './lib/write-openapi-subset.mjs'

writeOpenApiSubset({
  outputFileName: 'assets.openapi.json',
  subsetTitle: 'Assets subset',
  description: 'Filtered for Homepage Admin assets Orval codegen.',
  matchPath: matchPathPrefixes(['/api/admin/assets']),
})
