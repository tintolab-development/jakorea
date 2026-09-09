import type { MailSendProgram } from './types'

export function programYearLabel(year: number): string {
  if (!year) return ''
  return `${year}년`
}

export function uniqueProgramYears(programs: MailSendProgram[]): number[] {
  return [...new Set(programs.map(program => program.year).filter(year => year > 0))].sort(
    (a, b) => b - a
  )
}

export function filterMailSendPrograms(
  programs: MailSendProgram[],
  params: { year: number | ''; keyword: string }
): MailSendProgram[] {
  const needle = params.keyword.trim().toLowerCase()
  return programs.filter(program => {
    if (params.year !== '' && program.year !== params.year) return false
    if (!needle) return true
    return program.name.toLowerCase().includes(needle)
  })
}

export function listMailSendProgramPickerRows(
  programs: MailSendProgram[],
  params: { year: number | ''; keyword: string }
): MailSendProgram[] {
  return filterMailSendPrograms(programs, params)
}

export function findMailSendProgram(
  programs: MailSendProgram[],
  programId: string | undefined
): MailSendProgram | undefined {
  if (!programId) return undefined
  return programs.find(program => program.id === programId)
}
