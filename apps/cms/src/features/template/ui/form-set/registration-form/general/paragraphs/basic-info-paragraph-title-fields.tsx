import { memo, useEffect, useMemo } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsSelect } from '@/shared/ui/cms-select'
import { ProgramRegistrationOverlayTextField } from '@/features/template/ui/form-set/registration-form/shared/registration-overlay-fields'
import { useRegistrationCatalogReady } from '@/features/template/ui/form-set/registration-form/shared/use-registration-catalog-ready'
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
  TRAINED_TEACHERS_REGISTRATION_DETAILED_PROGRAM_VALUE,
} from '@/features/template/ui/form-set/registration-form/trained-teachers/paragraphs/basic-info-defaults'

type ControlledTitleProps = {
  /** 교육받은 교사 등록 폼 — overlay 키 분리. 신규는 빈 값+플레이스홀더, 수정은 overlay 복원 */
  trainedTeachersDefaults?: boolean
  /**
   * 일반 일정형 — 세부 프로그램명 셀렉트를「해당없음」으로 고정.
   * 실적·조회에서는 일정명이 세부 프로그램명으로 반영된다.
   */
  lockDetailedProgramToNone?: boolean
}

function ProgramRegistrationBasicInfoTitleFieldsInner({
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

  const [detailedProgramId, setDetailedProgramId] = useProgramRegistrationOverlayKv<string>(
    detailedIdKey,
    ''
  )

  const { catalogReady, onSelectOpenChange } = useRegistrationCatalogReady({
    overlayBasicInfoPrefix: trainedTeachersDefaults
      ? 'trainedTeachersRegistration.basicInfo'
      : 'generalRegistration.basicInfo',
  })
  const { options: remoteDetailedProgramOptions } = useDetailedProgramSelectOptions(catalogReady)

  useEffect(() => {
    if (!lockDetailedProgramToNone) return
    if (detailedProgramId === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE) return
    setDetailedProgramId(TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE)
    patchProgramRegistrationOverlay({ [detailedNameKey]: '해당없음' })
  }, [detailedNameKey, detailedProgramId, lockDetailedProgramToNone, setDetailedProgramId])

  useEffect(() => {
    if (lockDetailedProgramToNone) return
    const isStaleNone = detailedProgramId === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
    const isFakeTrainedTeachersId =
      trainedTeachersDefaults &&
      detailedProgramId === TRAINED_TEACHERS_REGISTRATION_DETAILED_PROGRAM_VALUE
    if (!isStaleNone && !isFakeTrainedTeachersId) return
    // 커리큘럼형은 BE가 세부 프로그램 마스터 id(숫자)를 요구한다.
    // 일정형에서 넘어온「해당없음」잔존값·1사1교용 가짜 id 는 비워서 재선택을 유도한다.
    setDetailedProgramId('')
    patchProgramRegistrationOverlay({ [detailedNameKey]: '' })
  }, [
    detailedNameKey,
    detailedProgramId,
    lockDetailedProgramToNone,
    setDetailedProgramId,
    trainedTeachersDefaults,
  ])

  // 「해당없음」은 일정형(잠금)에서만 유효 — 커리큘럼형·TT 옵션에는 노출하지 않는다.
  const detailedProgramOptions = useMemo(
    () =>
      lockDetailedProgramToNone
        ? withDetailedProgramNoneOption(remoteDetailedProgramOptions)
        : remoteDetailedProgramOptions,
    [lockDetailedProgramToNone, remoteDetailedProgramOptions]
  )

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

  const detailedProgramSelectValue = lockDetailedProgramToNone
    ? TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
    : detailedProgramId

  return (
    <>
      <DetailInfoForm.Row type="double">
        <ProgramRegistrationOverlayTextField
          label="대표 프로그램명 (국문)"
          validationKey="basicInfo.programTitleKo"
          overlayKey={titleKoKey}
          placeholder="대표 프로그램명을 입력해 주세요"
        />
        <ProgramRegistrationOverlayTextField
          label="대표 프로그램명 (영문)"
          validationKey="basicInfo.programTitleEn"
          overlayKey={titleEnKey}
          placeholder="대표 프로그램명을 입력해 주세요"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <ProgramRegistrationOverlayTextField
          label="공고용 프로그램명"
          validationKey="basicInfo.publicProgramTitle"
          overlayKey={publicTitleKey}
          placeholder="모집 시 노출될 프로그램명을 입력해 주세요"
        />
        <DetailInfoForm.Field
          label="세부 프로그램명"
          validationKey="basicInfo.detailedProgram"
          edit={
            <div className="detail-info-form-inputs-wrapper-no-gap">
              <CmsSelect
                withAllOption={false}
                inputSize="small"
                placeholder="세부 프로그램명을 선택해 주세요"
                width="100%"
                options={detailedProgramOptions}
                value={detailedProgramSelectValue}
                onChange={v => setDetailedProgramSelection(String(v ?? ''))}
                onOpenChange={onSelectOpenChange}
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
