import { PFText } from '../pf-text'

/** 「입력하지 않은 필수 항목이 있어요.」 팝업 설명 — ‘*’의 별표만 빨간색 (Figma 14491-2657) */
export function PFRequiredFieldsIncompleteDescription() {
  return (
    <>
      ‘
      {/* 글자 크기는 팝업 설명(PC 16px·모바일 14px)을 그대로 따른다 */}
      <PFText as="span" color="error">
        *
      </PFText>
      ’ 표시된 필수 항목을 모두 작성해 주세요.
    </>
  )
}
