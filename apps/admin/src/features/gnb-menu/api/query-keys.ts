export const gnbMenuQueryKeys = {
  all: ['gnb-menu'] as const,
  detail: () => [...gnbMenuQueryKeys.all, 'detail', 'remote'] as const,
  /** 저장 mutation 공통 키 — 섹션 간 동시 저장(버전 충돌) 잠금용 */
  save: () => [...gnbMenuQueryKeys.all, 'save'] as const,
}
