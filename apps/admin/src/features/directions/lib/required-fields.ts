/** 오시는 길 수정 — 빈 필수값이면 공통 미입력 안내 */
export function hasIncompleteRequiredDirectionsFields(input: {
  addressKo: string
  addressEn: string
  kakaoMapHtml: string
  phone: string
  fax: string
  email: string
}): boolean {
  return (
    input.addressKo.trim() === '' ||
    input.addressEn.trim() === '' ||
    input.kakaoMapHtml.trim() === '' ||
    input.phone.trim() === '' ||
    input.fax.trim() === '' ||
    input.email.trim() === ''
  )
}
