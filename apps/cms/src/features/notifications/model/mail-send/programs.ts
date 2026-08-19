import { MAIL_SEND_ALL_PROGRAM_ID, type MailSendProgram } from './types'

export const MAIL_SEND_ALL_PROGRAM: MailSendProgram = {
  id: MAIL_SEND_ALL_PROGRAM_ID,
  name: '전체',
  year: 0,
}

export function programYearLabel(year: number): string {
  if (!year) return ''
  return `${year}년`
}

export function uniqueProgramYears(programs: MailSendProgram[]): number[] {
  return [...new Set(programs.map(program => program.year))].sort((a, b) => b - a)
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
  const filtered = filterMailSendPrograms(programs, params)
  const needle = params.keyword.trim().toLowerCase()
  const allMatches = !needle || MAIL_SEND_ALL_PROGRAM.name.toLowerCase().includes(needle)
  if (allMatches) return [MAIL_SEND_ALL_PROGRAM, ...filtered]
  return filtered
}

export function findMailSendProgram(
  programs: MailSendProgram[],
  programId: string | undefined
): MailSendProgram | undefined {
  if (!programId) return undefined
  if (programId === MAIL_SEND_ALL_PROGRAM_ID) return MAIL_SEND_ALL_PROGRAM
  return programs.find(program => program.id === programId)
}
