import {
  DEFAULT_USER_INFO_FIELD_CATALOG,
  type UserInfoParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { ParagraphChip } from '@/features/template/ui/shared/paragraph-chip'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsPhoneInput } from '@/shared/ui/cms-phone-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import './user-info.css'

const DEFAULT_USER_INFO_FIELDS = DEFAULT_USER_INFO_FIELD_CATALOG

/** 미리보기 전용 예시 값 — 실제 응답 연동 전까지 고정 문구 */
const USER_INFO_PREVIEW_SAMPLE_BY_KEY: Record<string, string> = {
  name: '이름예시',
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

/** 설문자 정보 「성별」 — 셀렉트 선택지, 서버 값은 MALE/FEMALE (2026-11-13 요청) */
export const USER_INFO_GENDER_FIELD_KEY = 'gender'
export const USER_INFO_GENDER_OPTIONS = [
  { label: '남자', value: 'MALE' },
  { label: '여자', value: 'FEMALE' },
] as const

/** 예전 직접 입력값(남·남자·여·여자)도 MALE/FEMALE로 읽는다. 그 밖의 값은 그대로 */
export function normalizeUserInfoGenderValue(value: string | null | undefined): string {
  const v = (value ?? '').trim()
  if (v === '') return ''
  const upper = v.toUpperCase()
  if (upper === 'MALE' || v === '남' || v === '남자') return 'MALE'
  if (upper === 'FEMALE' || v === '여' || v === '여자') return 'FEMALE'
  return v
}

/** 화면 표시 — MALE/FEMALE → 남자/여자 */
export function userInfoAnswerDisplayValue(key: string, value: string): string {
  if (key !== USER_INFO_GENDER_FIELD_KEY) return value
  const normalized = normalizeUserInfoGenderValue(value)
  return USER_INFO_GENDER_OPTIONS.find(o => o.value === normalized)?.label ?? value
}

/** 설문자 정보 연락처 키 — 입력 시 하이픈 자동·최대 11자리(`CmsPhoneInput`) */
const USER_INFO_PHONE_FIELD_KEY = 'phone'

/** 설문자 정보 답변 입력 — 성별은 셀렉트, 연락처는 전화번호 입력, 나머지는 텍스트 입력 */
function UserInfoAnswerControl({
  field,
  value,
  onChange,
}: {
  field: { key: string; label: string }
  value: string
  onChange: (key: string, value: string) => void
}) {
  if (field.key === USER_INFO_GENDER_FIELD_KEY) {
    const normalized = normalizeUserInfoGenderValue(value)
    return (
      <CmsSelect
        inputSize="small"
        width="100%"
        withAllOption={false}
        placeholder={`${field.label}을 선택해 주세요`}
        options={USER_INFO_GENDER_OPTIONS.map(o => ({ label: o.label, value: o.value }))}
        value={normalized === '' ? undefined : normalized}
        onChange={next => onChange(field.key, String(next ?? ''))}
      />
    )
  }
  if (field.key === USER_INFO_PHONE_FIELD_KEY) {
    return (
      <CmsPhoneInput
        inputSize="small"
        value={value}
        onChange={event => onChange(field.key, event.target.value)}
        placeholder="010-1234-5678"
        width="100%"
      />
    )
  }
  return (
    <CmsInput
      inputSize="small"
      value={value}
      onChange={event => onChange(field.key, event.target.value)}
      placeholder={`${field.label}을 입력해 주세요`}
      width="100%"
    />
  )
}

export type UserInfoPreviewTableSkin = 'surface' | 'a4Document'
export type UserInfoPreviewValues = Record<string, string>

/** 설문자 정보 등 — 카드 미리보기(`surface`) / A4 contentOnly(`a4Document`) */
function renderUserInfoPreviewValue(
  field: UserInfoFieldEntry,
  previewValues: UserInfoPreviewValues | undefined,
  onFieldAnswerChange?: (key: string, value: string) => void
) {
  if (onFieldAnswerChange) {
    return (
      <UserInfoAnswerControl
        field={field}
        value={previewValues?.[field.key] ?? ''}
        onChange={onFieldAnswerChange}
      />
    )
  }
  const answered = previewValues?.[field.key]
  return answered != null ? userInfoAnswerDisplayValue(field.key, answered) : previewSampleForKey(field.key)
}

export function UserInfoPreviewTable({
  selectedEntries,
  skin = 'surface',
  previewValues,
  forceTwoColumnRow = false,
  onFieldAnswerChange,
}: {
  selectedEntries: UserInfoFieldEntry[]
  skin?: UserInfoPreviewTableSkin
  previewValues?: UserInfoPreviewValues
  /** 선택 항목 2개일 때도 한 행에 라벨·값 두 쌍 (UJAT 교육일지 봉사자 정보 미리보기) */
  forceTwoColumnRow?: boolean
  onFieldAnswerChange?: (key: string, value: string) => void
}) {
  const n = selectedEntries.length
  const isA4 = skin === 'a4Document'
  const thCls = isA4 ? undefined : 'user-info-preview-table__th'
  const tdCls = isA4 ? undefined : 'user-info-preview-table__td'

  if (n === 0) {
    return (
      <p
        className={
          isA4 ? 'form-document-preview-paragraph__body-text' : 'user-info-preview-table__empty'
        }
        role="status"
      >
        선택된 항목이 없습니다.
      </p>
    )
  }

  const useTwoTier = forceTwoColumnRow ? n >= 2 : n >= 4

  if (!useTwoTier) {
    const table = (
      <table
        className={
          isA4
            ? 'form-document-short-essay-table form-document-short-essay-table--user-info form-document-short-essay-table--one-tier'
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
              <td className={tdCls}>
                {renderUserInfoPreviewValue(field, previewValues, onFieldAnswerChange)}
              </td>
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
          ? 'form-document-short-essay-table form-document-short-essay-table--user-info form-document-short-essay-table--two-tier'
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
              {renderUserInfoPreviewValue(row.left, previewValues, onFieldAnswerChange)}
            </td>
            {row.right != null ? (
              <>
                <th className={thCls} scope="row">
                  {row.right.label}
                </th>
                <td className={tdCls}>
                  {renderUserInfoPreviewValue(row.right, previewValues, onFieldAnswerChange)}
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
export function getUserInfoPreviewSelectedEntries(
  paragraph: UserInfoParagraph
): UserInfoFieldEntry[] {
  const fields = normalizeFields(paragraph)
  const selected = new Set(paragraph.selectedUserFieldKeys ?? [])
  return fields.filter(f => selected.has(f.key))
}

/**
 * 설문자 정보 미리보기 — 공통 상세 정보 폼(DetailInfoForm) 규격.
 * 값이 없으면 「설문자 {항목명}」 예시 문구로 통일한다(2026-11-13 요청).
 * 항목 4개 이상이면 한 행에 두 항목씩. 강의평가(`pairAll`)는 시안 1141:268259대로 항상 한 행에 두 항목.
 * `onFieldAnswerChange`가 있으면(강의평가 작성) 값 칸에 입력 — 제출 검증·응답 `answers`에 들어가는 값이다.
 */
export const SURVEY_RESPONDENT_PREVIEW_VALUE_PREFIX = '설문자'

function SurveyRespondentDetailInfoPreview({
  selectedEntries,
  previewValues,
  pairAll = false,
  onFieldAnswerChange,
}: {
  selectedEntries: UserInfoFieldEntry[]
  previewValues?: UserInfoPreviewValues
  pairAll?: boolean
  onFieldAnswerChange?: (key: string, value: string) => void
}) {
  if (selectedEntries.length === 0) {
    return (
      <p className="user-info-preview-table__empty" role="status">
        선택된 항목이 없습니다.
      </p>
    )
  }
  const valueFor = (field: UserInfoFieldEntry) => {
    const v = previewValues?.[field.key]?.trim()
    return v
      ? userInfoAnswerDisplayValue(field.key, v)
      : `${SURVEY_RESPONDENT_PREVIEW_VALUE_PREFIX} ${field.label}`
  }
  const editable = onFieldAnswerChange != null
  const paired = pairAll ? selectedEntries.length >= 2 : selectedEntries.length >= 4
  const rows: UserInfoFieldEntry[][] = []
  for (let i = 0; i < selectedEntries.length; i += paired ? 2 : 1) {
    rows.push(selectedEntries.slice(i, i + (paired ? 2 : 1)))
  }
  return (
    <DetailInfoForm
      title="설문자 정보"
      hideHeader
      mode={editable ? 'edit' : 'view'}
      className="user-info-respondent-detail-info"
    >
      {rows.map(row => (
        <DetailInfoForm.Row
          key={row.map(f => f.key).join('-')}
          type={row.length === 2 ? 'double' : 'single'}
        >
          {row.map(field => (
            <DetailInfoForm.Field
              key={field.key}
              label={field.label}
              view={<span className="user-info-respondent-preview__value">{valueFor(field)}</span>}
              edit={
                editable ? (
                  <UserInfoAnswerControl
                    field={field}
                    value={previewValues?.[field.key] ?? ''}
                    onChange={onFieldAnswerChange}
                  />
                ) : undefined
              }
              fullRow={row.length === 1}
            />
          ))}
        </DetailInfoForm.Row>
      ))}
    </DetailInfoForm>
  )
}

export type UserInfoLayout = 'chips' | 'previewTable'

/** 단일항목 사용자 정보형 — 작성: 칩 선택 / 미리보기: 세로 테이블 */
export function UserInfo({
  paragraph,
  onChange,
  isEditMode,
  layout = 'chips',
  previewValues,
  forceTwoColumnRow = false,
  answerEditable = false,
  surveyRespondentPreview = false,
  lectureEvalRespondentDetailInfo = false,
}: {
  paragraph: UserInfoParagraph
  onChange?: (next: UserInfoParagraph) => void
  isEditMode: boolean
  layout?: UserInfoLayout
  previewValues?: UserInfoPreviewValues
  forceTwoColumnRow?: boolean
  answerEditable?: boolean
  /** 설문 단락의 설문자 정보 — 미리보기를 DetailInfoForm 규격·「설문자 OO」 예시 값으로 */
  surveyRespondentPreview?: boolean
  /** 강의평가 작성·미리보기 — 한 행 두 항목, 작성 시 DetailInfoForm 값 칸에 입력 */
  lectureEvalRespondentDetailInfo?: boolean
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

  if (layout === 'previewTable' && surveyRespondentPreview && lectureEvalRespondentDetailInfo) {
    return (
      <SurveyRespondentDetailInfoPreview
        selectedEntries={getUserInfoPreviewSelectedEntries(paragraph)}
        previewValues={previewValues ?? paragraph.fieldAnswers}
        pairAll
        onFieldAnswerChange={
          answerEditable && onChange
            ? (key, value) =>
                onChange({
                  ...paragraph,
                  fieldAnswers: { ...(paragraph.fieldAnswers ?? {}), [key]: value },
                })
            : undefined
        }
      />
    )
  }

  if (layout === 'previewTable' && surveyRespondentPreview && !answerEditable) {
    return (
      <SurveyRespondentDetailInfoPreview
        selectedEntries={getUserInfoPreviewSelectedEntries(paragraph)}
        previewValues={previewValues ?? paragraph.fieldAnswers}
      />
    )
  }

  if (layout === 'previewTable') {
    return (
      <UserInfoPreviewTable
        selectedEntries={getUserInfoPreviewSelectedEntries(paragraph)}
        skin="surface"
        previewValues={previewValues ?? paragraph.fieldAnswers}
        forceTwoColumnRow={forceTwoColumnRow}
        onFieldAnswerChange={
          answerEditable && onChange
            ? (key, value) =>
                onChange({
                  ...paragraph,
                  fieldAnswers: { ...(paragraph.fieldAnswers ?? {}), [key]: value },
                })
            : undefined
        }
      />
    )
  }

  return (
    <div
      className={[
        'user-info-grid',
        isEditMode ? 'user-info-grid--edit' : '',
        !isEditMode ? 'user-info-grid--non-interactive' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {fields.map(field => (
        <ParagraphChip
          key={field.key}
          className="user-info-grid__item"
          selected={selected.has(field.key)}
          onClick={() => {
            if (!isEditMode) return
            onToggle(field.key)
          }}
        >
          {field.label}
        </ParagraphChip>
      ))}
    </div>
  )
}
