export const postsQueryKeys = {
  all: ['cms', 'posts'] as const,
  notices: {
    all: () => [...postsQueryKeys.all, 'notices'] as const,
    list: (searchParamsKey: string) =>
      [...postsQueryKeys.notices.all(), 'list', searchParamsKey] as const,
    detail: (id: string) => [...postsQueryKeys.notices.all(), 'detail', id] as const,
    categories: () => [...postsQueryKeys.notices.all(), 'categories'] as const,
  },
  faqs: {
    all: () => [...postsQueryKeys.all, 'faqs'] as const,
    list: (searchParamsKey: string) =>
      [...postsQueryKeys.faqs.all(), 'list', searchParamsKey] as const,
    detail: (id: string) => [...postsQueryKeys.faqs.all(), 'detail', id] as const,
    categories: () => [...postsQueryKeys.faqs.all(), 'categories'] as const,
  },
  inquiries: {
    all: () => [...postsQueryKeys.all, 'inquiries'] as const,
    list: (searchParamsKey: string) =>
      [...postsQueryKeys.inquiries.all(), 'list', searchParamsKey] as const,
    detail: (id: string) => [...postsQueryKeys.inquiries.all(), 'detail', id] as const,
    answers: (inquiryId: string) =>
      [...postsQueryKeys.inquiries.all(), 'answers', inquiryId] as const,
  },
} as const
