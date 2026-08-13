import { matchPathPrefixes, writeOpenApiSubset } from './lib/write-openapi-subset.mjs'

writeOpenApiSubset({
  outputFileName: 'education.openapi.json',
  subsetTitle: 'Education subset',
  description: 'Filtered for Homepage Admin education Orval codegen.',
  matchPath: matchPathPrefixes(['/api/admin/education', '/api/public/education']),
})
