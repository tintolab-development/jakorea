import { memo, useMemo } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import { withDetailedProgramNoneOption } from '@/features/template/lib/template-form-select-options'
import { mockDetailedProgramManagementListRows } from '@/data/mock/detailed-program-management-list'
import {
  GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY,
  useProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import {
  TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX,
  TRAINED_TEACHERS_REGISTRATION_DETAILED_PROGRAM_OPTION,
  TRAINED_TEACHERS_REGISTRATION_DETAILED_PROGRAM_VALUE,
  TRAINED_TEACHERS_REGISTRATION_REP_EN,
  TRAINED_TEACHERS_REGISTRATION_REP_KO,
} from '@/features/template/ui/form-set/registration-form/trained-teachers/paragraphs/basic-info-defaults'

const DETAILED_PROGRAM_OPTIONS = withDetailedProgramNoneOption(
  mockDetailedProgramManagementListRows.map(row => ({
    value: row.id,
    label: row.name,
  }))
)

type ControlledTitleProps = {
  programTitleKo?: string
  onProgramTitleKoChange?: (title: string) => void
  /** 교육받은 교사 등록 폼 — overlay 키·기본값 분리 */
  trainedTeachersDefaults?: boolean
}

function ProgramRegistrationBasicInfoTitleFieldsInner({
  programTitleKo: programTitleKoProp,
  onProgramTitleKoChange,
  trainedTeachersDefaults = false,
}: ControlledTitleProps) {
  const titleKoKey = trainedTeachersDefaults
    ? `${TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX}.programTitleKo`
    : GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY
  const titleEnKey = trainedTeachersDefaults
    ? `${TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX}.programTitleEn`
    : 'generalRegistration.basicInfo.programTitleEn'
  const publicTitleKey = trainedTeachersDefaults
    ? `${TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX}.publicProgramTitle`
    : 'generalRegistration.basicInfo.publicProgramTitle'
  const detailedIdKey = trainedTeachersDefaults
    ? `${TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX}.detailedProgramId`
    : 'generalRegistration.basicInfo.detailedProgramId'

  const [localProgramTitleKo, setLocalProgramTitleKo] = useProgramRegistrationOverlayKv(
    titleKoKey,
    trainedTeachersDefaults ? TRAINED_TEACHERS_REGISTRATION_REP_KO : ''
  )
  const [programTitleEn, setProgramTitleEn] = useProgramRegistrationOverlayKv(
    titleEnKey,
    trainedTeachersDefaults ? TRAINED_TEACHERS_REGISTRATION_REP_EN : ''
  )
  const [publicProgramTitle, setPublicProgramTitle] = useProgramRegistrationOverlayKv(
    publicTitleKey,
    ''
  )
  const [detailedProgramId, setDetailedProgramId] = useProgramRegistrationOverlayKv<string>(
    detailedIdKey,
    trainedTeachersDefaults ? TRAINED_TEACHERS_REGISTRATION_DETAILED_PROGRAM_VALUE : ''
  )

  const detailedProgramOptions = useMemo(
    () =>
      trainedTeachersDefaults
        ? [TRAINED_TEACHERS_REGISTRATION_DETAILED_PROGRAM_OPTION, ...DETAILED_PROGRAM_OPTIONS]
        : DETAILED_PROGRAM_OPTIONS,
    [trainedTeachersDefaults]
  )

  const isTitleControlled = onProgramTitleKoChange != null
  const programTitleKo = isTitleControlled ? (programTitleKoProp ?? '') : localProgramTitleKo
  const setProgramTitleKo = (next: string) => {
    if (isTitleControlled) {
      onProgramTitleKoChange(next)
      return
    }
    setLocalProgramTitleKo(next)
  }

  return (
    <>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="대표 프로그램명 (국문)"
          edit={
            <CmsInput
              inputSize="medium"
              placeholder="대표 프로그램명을 입력하세요"
              width="100%"
              value={programTitleKo}
              onChange={e => setProgramTitleKo(e.target.value)}
            />
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="대표 프로그램명 (영문)"
          edit={
            <CmsInput
              inputSize="medium"
              placeholder="상세 프로그램명을 입력하세요"
              width="100%"
              value={programTitleEn}
              onChange={e => setProgramTitleEn(e.target.value)}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="공고용 프로그램명"
          edit={
            <CmsInput
              inputSize="medium"
              placeholder="모집 시 노출될 프로그램명을 입력하세요"
              width="100%"
              value={publicProgramTitle}
              onChange={e => setPublicProgramTitle(e.target.value)}
            />
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="세부 프로그램명"
          edit={
            <div className="detail-info-form-inputs-wrapper-no-gap">
              <CmsSelect
                withAllOption={false}
                inputSize="medium"
                placeholder="세부 프로그램명을 선택하세요"
                width="100%"
                options={detailedProgramOptions}
                value={detailedProgramId}
                onChange={v => setDetailedProgramId(String(v ?? ''))}
              />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </>
  )
}

export const ProgramRegistrationBasicInfoTitleFields = memo(
  ProgramRegistrationBasicInfoTitleFieldsInner
)
