import type { UserInfoParagraph } from '@/features/template/model/writing-form-draft.schema'
import { ParagraphChip } from '@/features/template/ui/shared/paragraph-chip'
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

/** 미리보기 전용 예시 값 — 실제 응답 연동 전까지 고정 문구 */
const USER_INFO_PREVIEW_SAMPLE_BY_KEY: Record<string, string> = {
  name: '홍길동',
  gender: '남',
  birthDate: '1990-01-01',
  phone: '010-0000-0000',
  email: 'hong@example.com',
  addressRegion: '서울특별시 강서구 화곡동',
  addressDetail: 'OO로 123, 101호',
  affiliation: 'OO초등학교',
  applicantType: '교원',
  programName: 'OO 프로그램',
  period: '2026. 01. 01 ~ 2026. 12. 31',
  institutionName: 'OO교육청',
  institutionRegion: '서울특별시',
  educationTarget: '초등학교',
  educationGrade: '3학년',
  teamName: 'OO팀',
  teamPartnerName: '김파트너',
}

function normalizeFields(paragraph: UserInfoParagraph): Array<{ key: string; label: string }> {
  return paragraph.userFields?.length ? paragraph.userFields : DEFAULT_USER_INFO_FIELDS
}

function previewSampleForKey(key: string): string {
  const v = USER_INFO_PREVIEW_SAMPLE_BY_KEY[key]
  if (v != null && v.trim() !== '') return v
  return '—'
}

type UserInfoFieldEntry = { key: string; label: string }

export type UserInfoPreviewTableSkin = 'surface' | 'a4Document'
export type UserInfoPreviewValues = Record<string, string>

/** 설문자 정보 등 — 카드 미리보기(`surface`) / A4 contentOnly(`a4Document`) */
export function UserInfoPreviewTable({
  selectedEntries,
  skin = 'surface',
  previewValues,
}: {
  selectedEntries: UserInfoFieldEntry[]
  skin?: UserInfoPreviewTableSkin
  previewValues?: UserInfoPreviewValues
}) {
  const n = selectedEntries.length
  const isA4 = skin === 'a4Document'
  const thCls = isA4 ? undefined : 'user-info-preview-table__th'
  const tdCls = isA4 ? undefined : 'user-info-preview-table__td'

  if (n === 0) {
    return (
      <p
        className={
          isA4
            ? 'form-document-preview-paragraph__body-text'
            : 'user-info-preview-table__empty'
        }
        role="status"
      >
        선택된 항목이 없습니다.
      </p>
    )
  }

  const useTwoTier = n >= 4

  if (!useTwoTier) {
    const table = (
      <table
        className={
          isA4
            ? 'form-document-short-essay-table form-document-short-essay-table--user-info'
            : 'user-info-preview-table user-info-preview-table--one-tier'
        }
        role="grid"
        aria-label="사용자 정보 미리보기"
      >
        <tbody>
          {selectedEntries.map(field => (
            <tr key={field.key}>
              <th className={thCls} scope="row">
                {field.label}
              </th>
              <td className={tdCls}>{previewValues?.[field.key] ?? previewSampleForKey(field.key)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )

    return isA4 ? table : <div className="user-info-preview-table-wrap">{table}</div>
  }

  const rows: Array<{ left: UserInfoFieldEntry; right?: UserInfoFieldEntry }> = []
  for (let i = 0; i < selectedEntries.length; i += 2) {
    rows.push({
      left: selectedEntries[i]!,
      right: selectedEntries[i + 1],
    })
  }

  const tableTwo = (
    <table
      className={
        isA4
          ? 'form-document-short-essay-table form-document-short-essay-table--user-info'
          : 'user-info-preview-table user-info-preview-table--two-tier'
      }
      role="grid"
      aria-label="사용자 정보 미리보기"
    >
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row.left.key}-${row.right?.key ?? index}`}>
            <th className={thCls} scope="row">
              {row.left.label}
            </th>
            <td className={tdCls}>
              {previewValues?.[row.left.key] ?? previewSampleForKey(row.left.key)}
            </td>
            {row.right != null ? (
              <>
                <th className={thCls} scope="row">
                  {row.right.label}
                </th>
                <td className={tdCls}>
                  {previewValues?.[row.right.key] ?? previewSampleForKey(row.right.key)}
                </td>
              </>
            ) : isA4 ? (
              <>
                <th aria-hidden />
                <td aria-hidden />
              </>
            ) : (
              <>
                <th className="user-info-preview-table__th user-info-preview-table__th--empty" />
                <td className="user-info-preview-table__td user-info-preview-table__td--empty" />
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )

  return isA4 ? tableTwo : <div className="user-info-preview-table-wrap">{tableTwo}</div>
}

/** A4 `FormDocumentPreviewParagraph`와 측정 레이어에서 동일 엔트리 집합을 쓰기 위함 */
export function getUserInfoPreviewSelectedEntries(paragraph: UserInfoParagraph): UserInfoFieldEntry[] {
  const fields = normalizeFields(paragraph)
  const selected = new Set(paragraph.selectedUserFieldKeys ?? [])
  return fields.filter(f => selected.has(f.key))
}

export type UserInfoLayout = 'chips' | 'previewTable'

/** 단일항목 사용자 정보형 — 작성: 칩 선택 / 미리보기: 세로 테이블 */
export function UserInfo({
  paragraph,
  onChange,
  isEditMode,
  layout = 'chips',
  previewValues,
}: {
  paragraph: UserInfoParagraph
  onChange?: (next: UserInfoParagraph) => void
  isEditMode: boolean
  layout?: UserInfoLayout
  previewValues?: UserInfoPreviewValues
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

  if (layout === 'previewTable') {
    return (
      <UserInfoPreviewTable
        selectedEntries={getUserInfoPreviewSelectedEntries(paragraph)}
        skin="surface"
        previewValues={previewValues}
      />
    )
  }

  return (
    <div
      className={['user-info-grid', isEditMode ? 'user-info-grid--edit' : '']
        .filter(Boolean)
        .join(' ')}
    >
      {fields.map(field => (
        <ParagraphChip
          key={field.key}
          className="user-info-grid__item"
          selected={selected.has(field.key)}
          onClick={() => onToggle(field.key)}
          disabled={!isEditMode}
        >
          {field.label}
        </ParagraphChip>
      ))}
    </div>
  )
}
