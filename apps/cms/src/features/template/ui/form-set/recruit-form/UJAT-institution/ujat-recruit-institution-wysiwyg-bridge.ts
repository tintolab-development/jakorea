/** `RecruitDetailInfoParagraph` WYSIWYG HTML — 저장 시 스냅샷 */
let getHtmlSnapshot: (() => string) | null = null
export function registerUjatRecruitInstitutionWysiwygGetHtml(fn: (() => string) | null): void {
  getHtmlSnapshot = fn
}
export function captureUjatRecruitInstitutionWysiwygHtml(): string {
  return getHtmlSnapshot?.() ?? ''
}