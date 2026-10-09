/** 신규 등록 첫 hydrate만 이전 방문 초안을 건너뛴다. 템플릿 변경(revision >= 1) 후엔 방금 persist한 본문을 읽는다. */
export function shouldSkipFreshWizardDraftLoad(args: {
  skipDraftRestore: boolean
  wizardDraftRevision: number
}): boolean {
  return args.skipDraftRestore && args.wizardDraftRevision <= 0
}
