import { matchPathPrefixes, writeOpenApiSubset } from './lib/write-openapi-subset.mjs'

writeOpenApiSubset({
  outputFileName: 'notifications.openapi.json',
  subsetTitle: 'System inbox subset',
  description:
    'Filtered for Homepage Admin GNB system inbox Orval codegen. Excludes public-application outbox.',
  matchPath: matchPathPrefixes(['/api/admin/notifications/inbox']),
  pruneUnusedSchemas: true,
})
