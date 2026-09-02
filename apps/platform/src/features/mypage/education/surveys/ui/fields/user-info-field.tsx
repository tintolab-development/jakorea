import type { UserInfoParagraph } from '@jakorea/form-schema/writing-form'
import { PFInfoReview } from '@/shared/ui'

type SurveyUserInfoFieldProps = {
  paragraph: UserInfoParagraph
  programTitle: string
}

const USER_INFO_MOCK_VALUES: Record<string, string> = {
  name: '홍길동',
  gender: '남',
  birthDate: '2008-03-15',
  phone: '010-1234-5678',
  email: 'member@example.com',
  programName: '',
  period: '2026년 04월 20일(월) 9:30 ~ 12:20',
}

export function SurveyUserInfoField({ paragraph, programTitle }: SurveyUserInfoFieldProps) {
  const selectedKeys = paragraph.selectedUserFieldKeys ?? []
  const fields = paragraph.userFields ?? []

  const rows = selectedKeys
    .map(key => {
      const field = fields.find(entry => entry.key === key)
      if (!field) return null
      const value =
        key === 'programName'
          ? programTitle
          : (USER_INFO_MOCK_VALUES[key] ?? '-')
      return { label: field.label, value }
    })
    .filter((row): row is { label: string; value: string } => row != null)

  if (rows.length === 0) {
    return null
  }

  return <PFInfoReview rows={rows} />
}
