import { matchPathPrefixes, writeOpenApiSubset } from './lib/write-openapi-subset.mjs'

writeOpenApiSubset({
  outputFileName: 'participation.openapi.json',
  subsetTitle: 'Participation subset',
  description: 'Filtered for Homepage Admin participation Orval codegen.',
  matchPath: matchPathPrefixes(['/api/admin/participation', '/api/public/participation']),
})
