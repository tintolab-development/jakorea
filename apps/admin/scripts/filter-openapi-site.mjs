import { matchPathPrefixes, writeOpenApiSubset } from './lib/write-openapi-subset.mjs'

writeOpenApiSubset({
  outputFileName: 'site.openapi.json',
  subsetTitle: 'Site subset',
  description: 'Filtered for Homepage Admin site Orval codegen.',
  matchPath: matchPathPrefixes(['/api/admin/site', '/api/public/site']),
})
