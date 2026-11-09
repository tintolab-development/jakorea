/** 파일명의 `/`(경로 구분자)를 `,`로 바꾼다. 예) `버그/이슈 관리` → `버그,이슈 관리` */
export function sanitizeDownloadFileName(filename: string): string {
  return filename.replace(/[/\\]/g, ',')
}
