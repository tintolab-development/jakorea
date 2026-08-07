import type { FileDownloadListFilter } from '@/entities/file-download-log/model/types'

export const fileDownloadLogQueryKeys = {
  all: ['file-download-log'] as const,
  list: (source: 'remote' | 'local', filter: FileDownloadListFilter) =>
    [
      ...fileDownloadLogQueryKeys.all,
      'list',
      source,
      filter.fileName ?? '',
      filter.userName ?? '',
      filter.from ?? '',
      filter.to ?? '',
    ] as const,
}
