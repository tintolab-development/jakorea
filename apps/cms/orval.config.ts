import { defineConfig } from 'orval'

export default defineConfig({
  dashboard: {
    input: './openapi/dashboard.openapi.json',
    output: {
      mode: 'split',
      target: './src/shared/api/generated/dashboard/dashboard-api.ts',
      schemas: './src/shared/api/generated/dashboard/schemas',
      client: 'axios',
      prettier: false,
      override: {
        mutator: {
          path: './src/shared/api/orval-mutator.ts',
          name: 'customInstance',
        },
      },
    },
  },
  logs: {
    input: './openapi/logs.openapi.json',
    output: {
      mode: 'split',
      target: './src/shared/api/generated/logs/logs-api.ts',
      schemas: './src/shared/api/generated/logs/schemas',
      client: 'axios',
      prettier: false,
      override: {
        mutator: {
          path: './src/shared/api/orval-mutator.ts',
          name: 'customInstance',
        },
      },
    },
  },
  dataManagement: {
    input: './openapi/data-management.openapi.json',
    output: {
      mode: 'split',
      target: './src/shared/api/generated/data-management/data-management-api.ts',
      schemas: './src/shared/api/generated/data-management/schemas',
      client: 'axios',
      prettier: false,
      override: {
        mutator: {
          path: './src/shared/api/orval-mutator.ts',
          name: 'customInstance',
        },
      },
    },
  },
  posts: {
    input: './openapi/posts.openapi.json',
    output: {
      mode: 'split',
      target: './src/shared/api/generated/posts/posts-api.ts',
      schemas: './src/shared/api/generated/posts/schemas',
      client: 'axios',
      prettier: false,
      override: {
        mutator: {
          path: './src/shared/api/orval-mutator.ts',
          name: 'customInstance',
        },
      },
    },
  },
})
