import { matchPathPrefixes, writeOpenApiSubset } from './lib/write-openapi-subset.mjs'

writeOpenApiSubset({
  outputFileName: 'careers.openapi.json',
  subsetTitle: 'Careers subset',
  description: 'Filtered for Homepage Admin careers Orval codegen.',
  matchPath: matchPathPrefixes(['/api/admin/careers', '/api/public/careers']),
})
