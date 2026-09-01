export const historyAwardsCertsQueryKeys = {
  all: ['history-awards-certs'] as const,
  history: {
    all: ['history-awards-certs', 'history'] as const,
    lists: () => [...historyAwardsCertsQueryKeys.history.all, 'list'] as const,
    list: (source: 'remote' | 'local', filterKey: string) =>
      [...historyAwardsCertsQueryKeys.history.lists(), source, filterKey] as const,
  },
  award: {
    all: ['history-awards-certs', 'award'] as const,
    lists: () => [...historyAwardsCertsQueryKeys.award.all, 'list'] as const,
    list: (source: 'remote' | 'local', filterKey: string) =>
      [...historyAwardsCertsQueryKeys.award.lists(), source, filterKey] as const,
  },
  cert: {
    all: ['history-awards-certs', 'cert'] as const,
    lists: () => [...historyAwardsCertsQueryKeys.cert.all, 'list'] as const,
    list: (source: 'remote' | 'local', filterKey: string) =>
      [...historyAwardsCertsQueryKeys.cert.lists(), source, filterKey] as const,
  },
}
