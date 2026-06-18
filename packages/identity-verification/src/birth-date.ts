/** UI `1990.01.01` → API `1990-01-01` */
export function toApiBirthDate(birthDate: string): string {
  return birthDate.replace(/\./g, '-')
}

export function toVerifiedBirthDate(birthDate: string): string {
  return birthDate.replace(/\./g, '')
}
