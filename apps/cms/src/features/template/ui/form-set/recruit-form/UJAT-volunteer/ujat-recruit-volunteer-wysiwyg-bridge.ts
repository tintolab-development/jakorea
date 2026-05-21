let getHtmlSnapshot: (() => string) | null = null
export function registerUjatRecruitVolunteerWysiwygGetHtml(fn: (() => string) | null): void {
  getHtmlSnapshot = fn
}
export function captureUjatRecruitVolunteerWysiwygHtml(): string {
  return getHtmlSnapshot?.() ?? ''
}