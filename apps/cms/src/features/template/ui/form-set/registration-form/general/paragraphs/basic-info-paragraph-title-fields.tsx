import { memo, useEffect, useMemo } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
  withDetailedProgramNoneOption,
} from '@/features/template/lib/template-form-select-options'
import { useDetailedProgramSelectOptions } from '@/features/detailed-program/hooks/use-detailed-program-options-query'
import {
  GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY,
  patchProgramRegistrationOverlay,
  useProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import {
  TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX,
  TRAINED_TEACHERS_REGISTRATION_DETAILED_PROGRAM_OPTION,
  TRAINED_TEACHERS_REGISTRATION_DETAILED_PROGRAM_VALUE,
  TRAINED_TEACHERS_REGISTRATION_REP_EN,
  TRAINED_TEACHERS_REGISTRATION_REP_KO,
} from '@/features/template/ui/form-set/registration-form/trained-teachers/paragraphs/basic-info-defaults'

type ControlledTitleProps = {
  programTitleKo?: string
  onProgramTitleKoChange?: (title: string) => void
  /** 교육받은 교사 등록 폼 — overlay 키·기본값 분리 */
  trainedTeachersDefaults?: boolean
  /**
   * 일반 일정형 — 세부 프로그램명 셀렉트를「해당없음」으로 고정.
   * 실적·조회에서는 일정명이 세부 프로그램명으로 반영된다.
   */
  lockDetailedProgramToNone?: boolean
}

function ProgramRegistrationBasicInfoTitleFieldsInner({
  programTitleKo: programTitleKoProp,
  onProgramTitleKoChange,
  trainedTeachersDefaults = false,
  lockDetailedProgramToNone = false,
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
  const detailedNameKey = trainedTeachersDefaults
    ? `${TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX}.detailedProgramName`
    : 'generalRegistration.basicInfo.detailedProgramName'

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

  const { options: remoteDetailedProgramOptions } = useDetailedProgramSelectOptions(true)

  useEffect(() => {
    if (!lockDetailedProgramToNone) return
    if (detailedProgramId === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE) return
    setDetailedProgramId(TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE)
    patchProgramRegistrationOverlay({ [detailedNameKey]: '해당없음' })
  }, [detailedNameKey, detailedProgramId, lockDetailedProgramToNone, setDetailedProgramId])

  useEffect(() => {
    if (trainedTeachersDefaults && detailedProgramId === TRAINED_TEACHERS_REGISTRATION_DETAILED_PROGRAM_VALUE) {
      patchProgramRegistrationOverlay({
        [detailedNameKey]: TRAINED_TEACHERS_REGISTRATION_DETAILED_PROGRAM_OPTION.label,
      })
    }
  }, [detailedNameKey, detailedProgramId, trainedTeachersDefaults])

  const detailedProgramOptions = useMemo(() => {
    const withNone = withDetailedProgramNoneOption(remoteDetailedProgramOptions)
    return trainedTeachersDefaults
      ? [TRAINED_TEACHERS_REGISTRATION_DETAILED_PROGRAM_OPTION, ...withNone]
      : withNone
  }, [remoteDetailedProgramOptions, trainedTeachersDefaults])

  const setDetailedProgramSelection = (nextId: string) => {
    setDetailedProgramId(nextId)
    if (!nextId) {
      patchProgramRegistrationOverlay({ [detailedNameKey]: '' })
      return
    }
    if (nextId === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE) {
      patchProgramRegistrationOverlay({ [detailedNameKey]: '해당없음' })
      return
    }
    const label =
      detailedProgramOptions.find(o => o.value === nextId)?.label?.trim() ||
      remoteDetailedProgramOptions.find(o => o.value === nextId)?.label?.trim() ||
      ''
    patchProgramRegistrationOverlay({ [detailedNameKey]: label })
  }

  const isTitleControlled = onProgramTitleKoChange != null
  const programTitleKo = isTitleControlled ? (programTitleKoProp ?? '') : localProgramTitleKo
  const setProgramTitleKo = (next: string) => {
    if (isTitleControlled) {
      onProgramTitleKoChange(next)
      return
    }
    setLocalProgramTitleKo(next)
  }

  const detailedProgramSelectValue = lockDetailedProgramToNone
    ? TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
    : detailedProgramId

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
                value={detailedProgramSelectValue}
                onChange={v => setDetailedProgramSelection(String(v ?? ''))}
                disabled={lockDetailedProgramToNone}
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
