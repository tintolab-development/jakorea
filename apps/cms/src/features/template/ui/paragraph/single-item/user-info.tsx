import type { UserInfoParagraph } from '@/features/template/model/writing-form-draft.schema'
import './user-info.css'

const DEFAULT_USER_INFO_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'name', label: '이름' },
  { key: 'gender', label: '성별' },
  { key: 'birthDate', label: '생년월일' },
  { key: 'phone', label: '연락처' },
  { key: 'email', label: '이메일' },
  { key: 'addressRegion', label: '자택 주소지(지역)' },
  { key: 'addressDetail', label: '자택 주소지(상세)' },
  { key: 'affiliation', label: '소속' },
  { key: 'applicantType', label: '신청자 유형' },
  { key: 'programName', label: '프로그램명' },
  { key: 'period', label: '교육 진행 일정(진행 기간)' },
  { key: 'institutionName', label: '기관명' },
  { key: 'institutionRegion', label: '기관 소재지(시군구)' },
  { key: 'educationTarget', label: '교육 대상(담당 대상)' },
  { key: 'educationGrade', label: '교육 학년(담당 학년)' },
  { key: 'teamName', label: '팀 명' },
  { key: 'teamPartnerName', label: '팀원/파트너 명' },
]

function normalizeFields(paragraph: UserInfoParagraph): Array<{ key: string; label: string }> {
  return paragraph.userFields?.length ? paragraph.userFields : DEFAULT_USER_INFO_FIELDS
}

/** 단일항목 사용자 정보형 — 버튼형 필드 선택 미리보기 */
export function UserInfo({
  paragraph,
  onChange,
  isEditMode,
}: {
  paragraph: UserInfoParagraph
  onChange?: (next: UserInfoParagraph) => void
  isEditMode: boolean
}) {
  const fields = normalizeFields(paragraph)
  const selected = new Set(paragraph.selectedUserFieldKeys ?? [])

  const onToggle = (fieldKey: string) => {
    if (!isEditMode || !onChange) return
    const next = new Set(selected)
    if (next.has(fieldKey)) next.delete(fieldKey)
    else next.add(fieldKey)
    onChange({
      ...paragraph,
      userFields: fields,
      selectedUserFieldKeys: [...next],
    })
  }

  return (
    <div
      className={['user-info-grid', isEditMode ? 'user-info-grid--edit' : '']
        .filter(Boolean)
        .join(' ')}
    >
      {fields.map(field => (
        <button
          key={field.key}
          type="button"
          className={[
            'user-info-grid__item',
            selected.has(field.key) ? 'user-info-grid__item--selected' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onToggle(field.key)}
          disabled={!isEditMode}
        >
          {field.label}
        </button>
      ))}
    </div>
  )
}
