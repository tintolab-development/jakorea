import { matchPathPrefixes, writeOpenApiSubset } from './lib/write-openapi-subset.mjs'

writeOpenApiSubset({
  outputFileName: 'sponsorship.openapi.json',
  subsetTitle: 'Sponsorship subset',
  description: 'Filtered for Homepage Admin sponsorship Orval codegen.',
  matchPath: matchPathPrefixes(['/api/admin/sponsorship', '/api/public/sponsorship']),
})
