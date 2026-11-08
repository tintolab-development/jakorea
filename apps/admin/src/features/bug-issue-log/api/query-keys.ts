import type { BugIssueListFilter } from '@/entities/bug-issue-log/model/types'

export const bugIssueLogQueryKeys = {
  all: ['bug-issue-log'] as const,
  list: (source: 'remote' | 'local', filter: BugIssueListFilter) =>
    [
      ...bugIssueLogQueryKeys.all,
      'list',
      source,
      filter.userName ?? '',
      filter.from ?? '',
      filter.to ?? '',
    ] as const,
}
