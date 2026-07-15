/**
 * 일반 프로그램 기관 신청·참여 기관 상세 — 신청 양식(기본/안내) 수정 필드
 * `institution-basic-info-paragraph` / `institution-guidance-paragraph` / `basic-info-paragraph`와 동일 레이아웃
 */

import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { InstitutionAffiliatedTeacherOption } from '@/features/program/general/lib/institution-application-detail-edit-policy'
import { INSTITUTION_APPLICATION_GRADE_OPTIONS } from '@/features/program/general/lib/institution-application-detail-edit-policy'
import { CmsInput, CmsNumericInput, CmsRadio, CmsRadioGroup, CmsTextArea } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'

export const INSTITUTION_EDUCATION_FORMAT_OPTIONS = [
  { value: '온라인', label: '온라인' },
  { value: '오프라인', label: '오프라인' },
  { value: '온/오프라인', label: '온/오프라인' },
] as const

export interface InstitutionApplicationDetailEditFields {
  educationGrade: string
  classCount: string
  studentCount: string
  addressDetail: string
  educationFormat: string
  applicationReason: string
  otherRequests: string
  computerInRoom: string
  waitingRoomAvailable: boolean
  waitingRoomLocation: string
  mealProvided: boolean
  mealNotice: string
  parkingInfo: string
  teacherName: string
  teacherPhone: string
  teacherMobile: string
  teacherEmail: string
}

const inlineRowStyle = {
  flexWrap: 'nowrap' as const,
  alignItems: 'center' as const,
  minWidth: 0,
  width: '100%' as const,
}

const inlineChoiceStyle = { display: 'flex', flexWrap: 'wrap' as const, gap: 16 }

const nowrapSpanStyle = { whiteSpace: 'nowrap' as const, flexShrink: 0 as const }

const inlineRadioGroupStyle = {
  display: 'flex',
  flexWrap: 'nowrap' as const,
  gap: 8,
  flexShrink: 0,
}

const flexGrowInputStyle = { flex: '1 1 160px' as const, minWidth: 120 }

export function parseMealProvidedFromDisplay(mealText?: string, mealProvidedFlag?: boolean): boolean {
  if (mealProvidedFlag != null) return mealProvidedFlag
  const text = mealText?.trim()
  if (!text) return false
  if (text === '불가' || text.startsWith('불가') || text === '미제공') return false
  return text === '가능' || text.includes('제공') || text.includes('가능')
}

export function parseWaitingRoomAvailableFromLocation(location?: string): boolean {
  const text = location?.trim()
  if (!text) return false
  if (text === '없음' || text.startsWith('없음')) return false
  return true
}

export function buildInstitutionApplicationEditFieldsFromApplicantDetail(
  detail?: {
    addressDetail?: string
    educationType?: string
    applicationReason?: string
    otherRequests?: string
    computerInSpace?: string
    waitingPlaceGuide?: string
    waitingRoom?: string
    mealInfo?: string
    otherSpecialNotes?: string
    parkingInfo?: string
    teacherInfo?: string
  },
  institution?: {
    educationGrade?: string
    classCount?: number
    studentCount?: number
    teacherName?: string
    contact?: string
  }
): InstitutionApplicationDetailEditFields {
  const waitingText = detail?.waitingPlaceGuide?.trim() || detail?.waitingRoom?.trim() || ''
  const teacherFields = parseInstitutionTeacherInfoFromApplicantDetail(detail, institution)

  return {
    educationGrade: normalizeInstitutionApplicationGradeForApplicantEdit(institution?.educationGrade),
    classCount:
      institution?.classCount != null && institution.classCount > 0
        ? String(institution.classCount)
        : '',
    studentCount:
      institution?.studentCount != null && institution.studentCount > 0
        ? String(institution.studentCount)
        : '',
    addressDetail: detail?.addressDetail ?? '',
    educationFormat: detail?.educationType ?? '',
    applicationReason: detail?.applicationReason ?? '',
    otherRequests: detail?.otherRequests ?? '',
    computerInRoom: detail?.computerInSpace ?? '',
    waitingRoomAvailable: parseWaitingRoomAvailableFromLocation(waitingText),
    waitingRoomLocation: waitingText,
    mealProvided: parseMealProvidedFromDisplay(detail?.mealInfo),
    mealNotice: detail?.mealInfo?.includes('|')
      ? detail.mealInfo.split('|').slice(1).join('|').trim()
      : detail?.mealInfo === '가능'
        ? ''
        : (detail?.mealInfo ?? ''),
    parkingInfo: detail?.otherSpecialNotes?.trim() || detail?.parkingInfo?.trim() || '',
    ...teacherFields,
  }
}

function normalizeInstitutionApplicationGradeForApplicantEdit(grade?: string): string {
  if (!grade?.trim()) return ''
  const match = grade.trim().match(/^(\d+)/)
  return match ? match[1]! : grade.trim()
}

function parseInstitutionTeacherInfoFromApplicantDetail(
  detail?: { teacherInfo?: string },
  institution?: { teacherName?: string; contact?: string }
): Pick<
  InstitutionApplicationDetailEditFields,
  'teacherName' | 'teacherPhone' | 'teacherMobile' | 'teacherEmail'
> {
  const raw = detail?.teacherInfo?.trim()
  if (raw) {
    const parsed: {
      name?: string
      tel?: string
      mobile?: string
      email?: string
    } = {}

    for (const segment of raw.split('|').map(part => part.trim()).filter(Boolean)) {
      const nameMatch = segment.match(/^담당\s*교사\s*:\s*(.+)$/i)
      if (nameMatch) {
        parsed.name = nameMatch[1]?.trim()
        continue
      }
      const telMatch = segment.match(/^Tel\s*:\s*(.+)$/i)
      if (telMatch) {
        parsed.tel = telMatch[1]?.trim()
        continue
      }
      const mobileMatch = segment.match(/^M\s*:\s*(.+)$/i)
      if (mobileMatch) {
        parsed.mobile = mobileMatch[1]?.trim()
        continue
      }
      const emailMatch = segment.match(/^E-mail\s*:\s*(.+)$/i)
      if (emailMatch) {
        parsed.email = emailMatch[1]?.trim()
      }
    }

    return {
      teacherName: parsed.name ?? institution?.teacherName ?? '',
      teacherPhone: parsed.tel ?? institution?.contact ?? '',
      teacherMobile: parsed.mobile ?? '',
      teacherEmail: parsed.email ?? '',
    }
  }

  return {
    teacherName: institution?.teacherName ?? '',
    teacherPhone: institution?.contact ?? '',
    teacherMobile: '',
    teacherEmail: '',
  }
}

export function buildInstitutionApplicationEditFieldsFromParticipatingDetail(detail: {
  educationGrade?: string
  classCount?: number
  studentCount?: number
  addressDetail?: string
  educationFormat?: string
  applicationReason?: string
  otherRequests?: string
  computerInRoom?: string
  waitingRoomAvailable?: boolean
  waitingRoomLocation?: string
  mealProvided?: boolean
  mealNotice?: string
  parkingInfo?: string
  teacherName?: string
  teacherPhone?: string
  teacherMobile?: string
  teacherEmail?: string
}): InstitutionApplicationDetailEditFields {
  return {
    educationGrade: detail.educationGrade
      ? normalizeInstitutionApplicationGradeForApplicantEdit(detail.educationGrade)
      : '',
    classCount:
      detail.classCount != null && detail.classCount > 0 ? String(detail.classCount) : '',
    studentCount:
      detail.studentCount != null && detail.studentCount > 0 ? String(detail.studentCount) : '',
    addressDetail: detail.addressDetail ?? '',
    educationFormat: detail.educationFormat ?? '',
    applicationReason: detail.applicationReason ?? '',
    otherRequests: detail.otherRequests ?? '',
    computerInRoom: detail.computerInRoom ?? '',
    waitingRoomAvailable: detail.waitingRoomAvailable ?? false,
    waitingRoomLocation: detail.waitingRoomLocation ?? '',
    mealProvided: detail.mealProvided ?? false,
    mealNotice: detail.mealNotice ?? '',
    parkingInfo: detail.parkingInfo ?? '',
    teacherName: detail.teacherName ?? '',
    teacherPhone: detail.teacherPhone ?? '',
    teacherMobile: detail.teacherMobile ?? '',
    teacherEmail: detail.teacherEmail ?? '',
  }
}

function FieldStack({
  children,
  error,
}: {
  children: ReactNode
  error?: string
}) {
  return (
    <div className="institution-basic-info__field-stack">
      {children}
      {error ? <span className="institution-basic-info__field-error">{error}</span> : null}
    </div>
  )
}

export function InstitutionReadonlyInput({ value }: { value: string }) {
  return (
    <CmsInput inputSize="medium" width="100%" value={value} disabled readOnly />
  )
}

export function InstitutionGradeSelectEdit({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  return (
    <FieldStack error={error}>
      <CmsSelect
        className="institution-basic-info__full-width-control"
        inputSize="medium"
        withAllOption={false}
        placeholder="학년 선택"
        value={value || undefined}
        options={INSTITUTION_APPLICATION_GRADE_OPTIONS}
        onChange={next => onChange(String(next ?? ''))}
      />
    </FieldStack>
  )
}

export function InstitutionClassAndStudentCountEdit({
  classCount,
  studentCount,
  classCountOptions,
  onChange,
  errors,
}: {
  classCount: string
  studentCount: string
  classCountOptions: Array<{ value: string; label: string }>
  onChange: (patch: { classCount?: string; studentCount?: string }) => void
  errors?: Partial<Record<'classCount' | 'studentCount', string>>
}) {
  const firstError = errors?.classCount ?? errors?.studentCount

  return (
    <FieldStack error={firstError}>
      <div
        className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap"
        style={inlineRowStyle}
      >
        <CmsSelect
          inputSize="medium"
          withAllOption={false}
          disabled={classCountOptions.length === 0}
          placeholder="신청 학급 수"
          width={120}
          value={classCount || undefined}
          options={classCountOptions}
          onChange={value => onChange({ classCount: String(value ?? '') })}
        />
        <span style={nowrapSpanStyle}>개 학급</span>
        <DetailInfoForm.InputsSeparator />
        <CmsNumericInput
          inputSize="medium"
          mode="integer"
          min={1}
          placeholder="총 학생 수"
          width={120}
          value={studentCount}
          onValueChange={raw => onChange({ studentCount: raw })}
        />
        <span style={nowrapSpanStyle}>명</span>
      </div>
    </FieldStack>
  )
}

export function InstitutionAddressDetailEdit({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  return (
    <FieldStack error={error}>
      <CmsInput
        inputSize="medium"
        placeholder="교구재 등 택배 발송을 위한 정확한 주소를 입력해 주세요"
        width="100%"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </FieldStack>
  )
}

export function InstitutionEducationFormatRadios({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const resolved =
    INSTITUTION_EDUCATION_FORMAT_OPTIONS.find(o => o.value === value)?.value ??
    (value || undefined)

  return (
    <FieldStack error={error}>
      <CmsRadioGroup
        size="large"
        value={resolved}
        onChange={event => onChange(String(event.target.value))}
        style={inlineChoiceStyle}
      >
        {INSTITUTION_EDUCATION_FORMAT_OPTIONS.map(option => (
          <CmsRadio key={option.value} value={option.value}>
            {option.label}
          </CmsRadio>
        ))}
      </CmsRadioGroup>
    </FieldStack>
  )
}

export function InstitutionMultilineEdit({
  value,
  onChange,
  placeholder,
  rows = 1,
  error,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  rows?: number
  error?: string
}) {
  return (
    <FieldStack error={error}>
      <CmsTextArea
        inputSize="medium"
        rows={rows}
        width="100%"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </FieldStack>
  )
}

export function InstitutionComputerInRoomEdit({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  return (
    <FieldStack error={error}>
      <CmsInput
        inputSize="medium"
        placeholder="컴퓨터·USB 등 안내를 입력해 주세요"
        width="100%"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </FieldStack>
  )
}

export function InstitutionWaitingRoomEdit({
  available,
  location,
  onChange,
  error,
}: {
  available: boolean
  location: string
  onChange: (patch: { waitingRoomAvailable: boolean; waitingRoomLocation: string }) => void
  error?: string
}) {
  return (
    <FieldStack error={error}>
      <div
        className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap"
        style={inlineRowStyle}
      >
        <CmsRadioGroup
          value={available}
          onChange={event => {
            const next = event.target.value === true || event.target.value === 'true'
            onChange({
              waitingRoomAvailable: next,
              waitingRoomLocation: next ? location : '',
            })
          }}
          style={inlineRadioGroupStyle}
        >
          <CmsRadio value={true}>있음</CmsRadio>
          <CmsRadio value={false}>없음</CmsRadio>
        </CmsRadioGroup>
        <DetailInfoForm.InputsSeparator />
        <CmsInput
          inputSize="medium"
          placeholder="상세 위치를 입력해 주세요"
          width="100%"
          style={flexGrowInputStyle}
          value={available ? location : ''}
          disabled={!available}
          onChange={e =>
            onChange({ waitingRoomAvailable: true, waitingRoomLocation: e.target.value })
          }
        />
      </div>
    </FieldStack>
  )
}

export function InstitutionMealEdit({
  provided,
  notice,
  onChange,
  error,
}: {
  provided: boolean
  notice: string
  onChange: (patch: { mealProvided: boolean; mealNotice: string }) => void
  error?: string
}) {
  return (
    <FieldStack error={error}>
      <div
        className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap"
        style={inlineRowStyle}
      >
        <CmsRadioGroup
          value={provided}
          onChange={event => {
            const next = event.target.value === true || event.target.value === 'true'
            onChange({ mealProvided: next, mealNotice: next ? notice : '' })
          }}
          style={inlineRadioGroupStyle}
        >
          <CmsRadio value={true}>가능</CmsRadio>
          <CmsRadio value={false}>불가</CmsRadio>
        </CmsRadioGroup>
        <DetailInfoForm.InputsSeparator />
        <CmsInput
          inputSize="medium"
          placeholder="비고"
          width="100%"
          style={flexGrowInputStyle}
          value={provided ? notice : ''}
          disabled={!provided}
          onChange={e => onChange({ mealProvided: true, mealNotice: e.target.value })}
        />
      </div>
    </FieldStack>
  )
}

export function InstitutionTeacherEdit({
  name,
  phone,
  mobile,
  email,
  onChange,
  errors,
  teacherOptions,
}: {
  name: string
  phone: string
  mobile: string
  email: string
  onChange: (patch: Partial<InstitutionApplicationDetailEditFields>) => void
  errors?: Partial<Record<'teacherName' | 'teacherPhone' | 'teacherMobile' | 'teacherEmail', string>>
  teacherOptions?: InstitutionAffiliatedTeacherOption[]
}) {
  const firstError =
    errors?.teacherName ?? errors?.teacherPhone ?? errors?.teacherMobile ?? errors?.teacherEmail

  const resolvedTeacherValue =
    teacherOptions?.find(option => option.label === name)?.value ??
    (name ? `legacy:${name}` : undefined)

  return (
    <FieldStack error={firstError}>
      <div
        className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap"
        style={inlineRowStyle}
      >
        <span style={nowrapSpanStyle}>담당 교사</span>
        {teacherOptions ? (
          <CmsSelect
            inputSize="medium"
            width={140}
            withAllOption={false}
            placeholder="교사 선택"
            value={resolvedTeacherValue}
            options={teacherOptions.map(option => ({
              label: option.label,
              value: option.value,
            }))}
            onChange={value => {
              const selected = teacherOptions.find(option => option.value === value)
              if (!selected) return
              onChange({
                teacherName: selected.label,
                teacherMobile: selected.mobile,
                teacherEmail: selected.email,
              })
            }}
          />
        ) : (
          <CmsInput
            inputSize="medium"
            width={140}
            placeholder="담당 교사명"
            value={name}
            onChange={e => onChange({ teacherName: e.target.value })}
          />
        )}
        <DetailInfoForm.InputsSeparator />
        <span style={nowrapSpanStyle}>Tel</span>
        <CmsInput
          inputSize="medium"
          width={170}
          placeholder="담당 교사의 내선 번호(직통 번호)"
          value={phone}
          onChange={e => onChange({ teacherPhone: e.target.value })}
        />
        <DetailInfoForm.InputsSeparator />
        <span style={nowrapSpanStyle}>M</span>
        <CmsInput
          inputSize="medium"
          width={160}
          placeholder="휴대폰"
          value={mobile}
          onChange={e => onChange({ teacherMobile: e.target.value })}
        />
        <DetailInfoForm.InputsSeparator />
        <span style={nowrapSpanStyle}>E-mail</span>
        <CmsInput
          inputSize="medium"
          width={180}
          placeholder="이메일"
          value={email}
          onChange={e => onChange({ teacherEmail: e.target.value })}
        />
      </div>
    </FieldStack>
  )
}
