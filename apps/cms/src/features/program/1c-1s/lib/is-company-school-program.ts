import type { Program } from '@/types/domain'

/** mock·local·제목 휴리스틱 (원격 id는 접두어가 없을 수 있음 → 라우트/variant와 병행) */
export function isCompanySchoolProgram(
  program: Pick<Program, 'id' | 'title' | 'mainTitle'> | null | undefined
): boolean {
  if (!program?.id) return false
  const id = String(program.id)
  return (
    id.startsWith('economy-prog-') ||
    id.startsWith('company-school-prog-') ||
    id.startsWith('company-school-local-') ||
    program.mainTitle?.includes('1사1교') === true ||
    program.title.includes('1사1교')
  )
}
