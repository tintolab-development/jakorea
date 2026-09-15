import { resolveNeisAtptOfcdcScCode } from '@jakorea/location/neis'

function trimOptional(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/**
 * NEIS schoolSelection.educationOfficeCode (`ATPT_OFCDC_SC_CODE`).
 * 선택 시점 코드를 우선하고, 없으면 시/도·학교 코드에서 유도한다.
 */
export function resolveNeisEducationOfficeCode(args: {
  provider?: string
  educationOfficeCode?: string | null
  regionSido?: string
  externalSchoolCode?: string
}): string | undefined {
  if (trimOptional(args.provider) === 'CAREER_NET') return undefined

  const explicit = trimOptional(args.educationOfficeCode)
  if (explicit) return explicit

  const regionSido = trimOptional(args.regionSido)
  if (regionSido) {
    const fromSido = resolveNeisAtptOfcdcScCode(regionSido)
    if (fromSido) return fromSido
  }

  const externalSchoolCode = trimOptional(args.externalSchoolCode)
  if (externalSchoolCode && /^[A-Za-z]\d{2}/.test(externalSchoolCode)) {
    return externalSchoolCode.slice(0, 3).toUpperCase()
  }

  return undefined
}
