/**
 * 일반 프로그램 등록 — 참여자 유형 <개인> 전용 「교육 진행 장소」.
 * BE 전용 필드 전까지 registrationOverlay(sidecar)에만 보존한다.
 * overlay 읽기/쓰기는 호출하는 단락(overlay-sync allowlist 대상)이 맡고, 여기서는 표시만 한다.
 */
import {
  REGISTRATION_WIZARD_EDUCATION_PLACE_BY_DETAIL_KEY,
  REGISTRATION_WIZARD_EDUCATION_PLACE_BY_SESSION_KEY,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-overlay-path-map'
import { RegistrationWizardDetailInfoForm as DetailInfoForm } from '@/features/program/shared/ui/registration/registration-wizard-detail-info-form'
import { AddressSearch } from '@/shared/ui/address-search'

export const EDUCATION_PLACE_LABEL = '교육 진행 장소'
export const EDUCATION_PLACE_PLACEHOLDER = '교육이 진행되는 장소를 입력해 주세요'

export type EducationPlaceRecordKind = 'curriculumSession' | 'scheduleDetail'

export const EMPTY_EDUCATION_PLACE_RECORD: Record<number, string> = {}

export function educationPlaceRecordKeyOf(kind: EducationPlaceRecordKind): string {
  return kind === 'curriculumSession'
    ? REGISTRATION_WIZARD_EDUCATION_PLACE_BY_SESSION_KEY
    : REGISTRATION_WIZARD_EDUCATION_PLACE_BY_DETAIL_KEY
}

export function educationPlaceValidationKey(kind: EducationPlaceRecordKind, index: number): string {
  return kind === 'curriculumSession'
    ? `curriculum.educationPlace[${index}]`
    : `scheduleCurriculum.educationPlace[${index}]`
}

/** 「교육이 진행되는 장소를 입력해 주세요」 트리거 — 클릭 시 주소 검색 팝업 */
export function ProgramRegistrationEducationPlaceInput({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
}) {
  return (
    <AddressSearch
      value={value}
      onChange={onChange}
      placeholder={EDUCATION_PLACE_PLACEHOLDER}
      inputSize="small"
      width="100%"
      disabled={disabled}
    />
  )
}

/** 일정 별 상이 — 커리큘럼 차시/일정형 세부 일정 블록 최하단 행 */
export function ProgramRegistrationEducationPlacePerScheduleRow({
  kind,
  index,
  value,
  onChange,
  disabled,
}: {
  kind: EducationPlaceRecordKind
  index: number
  value: string
  onChange: (index: number, next: string) => void
  disabled?: boolean
}) {
  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label={EDUCATION_PLACE_LABEL}
        required
        validationKey={educationPlaceValidationKey(kind, index)}
        fullRow
        edit={
          <ProgramRegistrationEducationPlaceInput
            value={value}
            onChange={next => onChange(index, next)}
            disabled={disabled}
          />
        }
        view={value.trim() ? value : '-'}
      />
    </DetailInfoForm.Row>
  )
}
