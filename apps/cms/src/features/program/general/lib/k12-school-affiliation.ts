/** 초·중·고등학교 소속명. 대학교·기관·빈 값은 false */
const K12_SCHOOL_NAME_RE = /초등학교|중학교|고등학교/

export function isK12SchoolAffiliationName(value?: string | null): boolean {
  const name = value?.trim() ?? ''
  if (!name) return false
  return K12_SCHOOL_NAME_RE.test(name)
}
