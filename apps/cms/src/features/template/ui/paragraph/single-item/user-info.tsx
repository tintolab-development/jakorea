import type { UserInfoParagraph } from '@/features/template/model/writing-form-draft.schema'

/** 사용자 정보형 (user-info) — 단락 바디 슬롯 (추후 본문 연동) */
export function UserInfo(_props: {
  paragraph: UserInfoParagraph
  onChange?: (next: UserInfoParagraph) => void
  isEditMode: boolean
}) {
  return null
}
