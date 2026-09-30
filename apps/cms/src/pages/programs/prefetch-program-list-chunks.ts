/** LNB 호버 시 프로그램 목록 라우트 청크만 미리 받는다. 쿼리·상태는 건드리지 않는다. */
const PROGRAM_LIST_CHUNK_LOADERS: Record<string, () => Promise<unknown>> = {
  '/programs/general': () => import('@/pages/programs/general/page'),
  '/programs/company-school': () => import('@/pages/programs/program-list-page'),
  '/programs/trained-teachers': () => import('@/pages/programs/trained-teachers/page'),
  '/programs/ujat': () => import('@/pages/programs/UJAT/page'),
  '/programs/ujat/regions': () => import('@/pages/programs/UJAT/education-regions-page'),
  '/programs/gemini/performance': () => import('@/pages/programs/gemini/performance/page'),
  '/programs/gemini/visiting-training': () => import('@/pages/programs/gemini/visiting-training/page'),
}

const prefetched = new Set<string>()

export function prefetchProgramListChunk(href: string): void {
  const loader = PROGRAM_LIST_CHUNK_LOADERS[href]
  if (!loader || prefetched.has(href)) return
  prefetched.add(href)
  void loader().catch(() => {
    prefetched.delete(href)
  })
}

export function isPrefetchableProgramListHref(href: string): boolean {
  return href in PROGRAM_LIST_CHUNK_LOADERS
}
