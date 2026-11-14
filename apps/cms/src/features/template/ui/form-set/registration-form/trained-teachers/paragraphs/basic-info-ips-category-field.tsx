import { RegistrationWizardDetailInfoForm as DetailInfoForm } from '@/features/program/shared/ui/registration/registration-wizard-detail-info-form'
import { CmsSelect } from '@/shared/ui/cms-select'
import { PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import { useTrainedTeachersRegistrationField } from '@/features/template/ui/form-set/registration-form/trained-teachers/trained-teachers-registration-form-rhf'
import { TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX } from '@/features/template/ui/form-set/registration-form/trained-teachers/paragraphs/basic-info-defaults'

/**
 * 교육받은 교사 등록 폼 기본 정보 「IPS 유형」 overlay 키 — 1사1교 `economyRegistration.basicInfo.ipsCategory`와 같은 값
 * (`prepare` | `succeed` | `inspire`). 프로그램 `ips`는 이미 「프로그램 유형 설정」 IPS(일정 공통)에서 채우므로
 * 이 키는 저장 빌더에 연결하지 않는다(RHF sidecar로만 남음) — 서버 필드 분리는 BE 요청.
 */
export const TRAINED_TEACHERS_BASIC_INFO_IPS_CATEGORY_KEY =
  `${TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX}.ipsCategory` as const

/** 시안 5767:196354 — 셀렉트 초기값 「Prepare」 */
const TEMPLATE_IPS_CATEGORY_DEFAULT = 'prepare'

/** 시안 5767:196354 — 교육 과정·IP Owned·IPS 유형 셀렉트 ≈200 */
const TEMPLATE_IPS_CATEGORY_SELECT_WIDTH = 200

/** 템플릿 관리 화면 전용 — 교육받은 교사 등록 폼 기본 정보 하단 「IPS 유형」 (시안 5767:196354) */
export function TrainedTeachersBasicInfoIpsCategoryField() {
  const [ipsCategory, setIpsCategory] = useTrainedTeachersRegistrationField<string>(
    TRAINED_TEACHERS_BASIC_INFO_IPS_CATEGORY_KEY,
    TEMPLATE_IPS_CATEGORY_DEFAULT
  )
  return (
    <DetailInfoForm.Field
      label="IPS 유형"
      fullRow
      edit={
        <CmsSelect
          withAllOption={false}
          inputSize="small"
          placeholder="IPS 유형을 선택해 주세요"
          width={TEMPLATE_IPS_CATEGORY_SELECT_WIDTH}
          options={[...PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS]}
          value={ipsCategory || undefined}
          onChange={v => setIpsCategory(String(v ?? ''))}
        />
      }
      view="-"
    />
  )
}
