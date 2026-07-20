/** `/programs/company-school` 및 legacy `/programs/economy-education` */
export function isCompanySchoolProgramsPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/'
  return (
    p === '/programs/company-school' ||
    p.startsWith('/programs/company-school/') ||
    p === '/programs/economy-education' ||
    p.startsWith('/programs/economy-education/')
  )
}
