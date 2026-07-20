/** `/programs/trained-teachers` */
export function isTrainedTeachersProgramsPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/'
  return p === '/programs/trained-teachers' || p.startsWith('/programs/trained-teachers/')
}
