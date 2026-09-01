import { matchPathPrefixes, writeOpenApiSubset } from './lib/write-openapi-subset.mjs'

writeOpenApiSubset({
  outputFileName: 'impact-story.openapi.json',
  subsetTitle: 'Impact Story subset',
  description: 'Filtered for Homepage Admin impact-story Orval codegen.',
  matchPath: matchPathPrefixes(['/api/admin/impact-story', '/api/public/impact-story']),
})
