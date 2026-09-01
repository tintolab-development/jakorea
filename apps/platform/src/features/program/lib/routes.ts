import { PROGRAMS_PATH } from './constants'

export type ProgramRouteName = 'list' | 'detail' | 'apply' | 'complete'

export type ParsedProgramRoute =
  | { name: 'list' }
  | { name: 'detail'; programId: string }
  | { name: 'apply'; programId: string }
  | { name: 'complete'; programId: string }

export function isProgramsPath(pathname: string) {
  return pathname === PROGRAMS_PATH || pathname.startsWith(`${PROGRAMS_PATH}/`)
}

export function parseProgramRoute(pathname: string): ParsedProgramRoute | null {
  const completeMatch = pathname.match(/^\/programs\/([^/]+)\/apply\/complete$/)
  if (completeMatch?.[1]) {
    return { name: 'complete', programId: completeMatch[1] }
  }

  const applyMatch = pathname.match(/^\/programs\/([^/]+)\/apply$/)
  if (applyMatch?.[1]) {
    return { name: 'apply', programId: applyMatch[1] }
  }

  const detailMatch = pathname.match(/^\/programs\/([^/]+)$/)
  if (detailMatch?.[1]) {
    return { name: 'detail', programId: detailMatch[1] }
  }

  if (pathname === PROGRAMS_PATH) {
    return { name: 'list' }
  }

  return null
}

export function getProgramIdFromPath(pathname = window.location.pathname) {
  const parsed = parseProgramRoute(pathname)
  if (!parsed || parsed.name === 'list') {
    return null
  }

  return parsed.programId
}
