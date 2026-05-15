import { useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

const HAS_OPTIONS = [
  { value: 'yes', label: '있음' },
  { value: 'no', label: '없음' },
] as const

const POSSIBLE_OPTIONS = [
  { value: 'possible', label: '가능' },
  { value: 'impossible', label: '불가' },
] as const

const SEX_OFFENSE_SUBMIT_OPTIONS = [
  { value: 'online', label: '온라인 제출' },
  { value: 'direct', label: '직접 제출' },
] as const

const inlineRowStyle = {
  flexWrap: 'nowrap' as const,
  alignItems: 'center' as const,
  minWidth: 0,
  width: '100%' as const,
}

const nowrapSpanStyle = { whiteSpace: 'nowrap' as const, flexShrink: 0 as const }

/** 1사1교 프로그램 참여자 신청 폼 — 안내 사항 */
export function EconomyProgramApplicationGuidanceParagraph() {
  const [computerRoom, setComputerRoom] = useState<string>('yes')
  const [usbUsable, setUsbUsable] = useState<string>('no')
  const [tabletUse, setTabletUse] = useState<string>('possible')
  const [waitingRoom, setWaitingRoom] = useState<string>('yes')
  const [parking, setParking] = useState<string>('yes')
  const [meal, setMeal] = useState<string>('possible')
  const [sexOffenseSubmit, setSexOffenseSubmit] = useState<string>('online')

  return (
    <DetailInfoForm
      title="안내 사항"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="강의 공간 내 컴퓨터 여부"
          edit={
            <div
              className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap"
              style={inlineRowStyle}
            >
              <CmsRadioGroup
                value={computerRoom}
                onChange={event => setComputerRoom(event.target.value)}
                style={{ display: 'flex', flexWrap: 'nowrap', gap: 8, flexShrink: 0 }}
              >
                {HAS_OPTIONS.map(option => (
                  <CmsRadio key={option.value} value={option.value}>
                    {option.label}
                  </CmsRadio>
                ))}
              </CmsRadioGroup>
              <DetailInfoForm.InputsSeparator />
              <CmsRadioGroup
                value={usbUsable}
                onChange={event => setUsbUsable(event.target.value)}
                style={{ display: 'flex', flexWrap: 'nowrap', gap: 8, flexShrink: 0 }}
              >
                <CmsRadio value="yes">USB 사용 가능</CmsRadio>
                <CmsRadio value="no">USB 사용 불가</CmsRadio>
              </CmsRadioGroup>
            </div>
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="학생 개별 태블릿 사용 여부"
          edit={
            <div
              className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap"
              style={inlineRowStyle}
            >
              <CmsRadioGroup
                value={tabletUse}
                onChange={event => setTabletUse(event.target.value)}
                style={{ display: 'flex', flexWrap: 'nowrap', gap: 8, flexShrink: 0 }}
              >
                {POSSIBLE_OPTIONS.map(option => (
                  <CmsRadio key={option.value} value={option.value}>
                    {option.label}
                  </CmsRadio>
                ))}
              </CmsRadioGroup>
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                inputSize="medium"
                placeholder="비고"
                width="100%"
                style={{ flex: '1 1 160px', minWidth: 120 }}
              />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="대기실 여부 및 위치"
          edit={
            <div
              className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap"
              style={inlineRowStyle}
            >
              <CmsRadioGroup
                value={waitingRoom}
                onChange={event => setWaitingRoom(event.target.value)}
                style={{ display: 'flex', flexWrap: 'nowrap', gap: 8, flexShrink: 0 }}
              >
                {HAS_OPTIONS.map(option => (
                  <CmsRadio key={option.value} value={option.value}>
                    {option.label}
                  </CmsRadio>
                ))}
              </CmsRadioGroup>
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                inputSize="medium"
                placeholder="상세 위치를 입력해 주세요"
                width="100%"
                style={{ flex: '1 1 180px', minWidth: 120 }}
              />
            </div>
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="주차 공간 여부 및 위치"
          edit={
            <div
              className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap"
              style={inlineRowStyle}
            >
              <CmsRadioGroup
                value={parking}
                onChange={event => setParking(event.target.value)}
                style={{ display: 'flex', flexWrap: 'nowrap', gap: 8, flexShrink: 0 }}
              >
                {HAS_OPTIONS.map(option => (
                  <CmsRadio key={option.value} value={option.value}>
                    {option.label}
                  </CmsRadio>
                ))}
              </CmsRadioGroup>
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                inputSize="medium"
                placeholder="상세 위치를 입력해 주세요"
                width="100%"
                style={{ flex: '1 1 180px', minWidth: 120 }}
              />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="식사 가능 여부 및 안내"
          fullRow
          edit={
            <div
              className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap"
              style={inlineRowStyle}
            >
              <CmsRadioGroup
                value={meal}
                onChange={event => setMeal(event.target.value)}
                style={{ display: 'flex', flexWrap: 'nowrap', gap: 8, flexShrink: 0 }}
              >
                {POSSIBLE_OPTIONS.map(option => (
                  <CmsRadio key={option.value} value={option.value}>
                    {option.label}
                  </CmsRadio>
                ))}
              </CmsRadioGroup>
              <DetailInfoForm.InputsSeparator />
              <CmsInput inputSize="medium" placeholder="비고" width="100%" />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="성범죄 경력 조회서 요청"
          fullRow
          edit={
            <div
              className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap"
              style={{
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                minWidth: 0,
              }}
            >
              <CmsRadioGroup
                value={sexOffenseSubmit}
                onChange={event => setSexOffenseSubmit(event.target.value)}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 8, flexShrink: 0 }}
              >
                {SEX_OFFENSE_SUBMIT_OPTIONS.map(option => (
                  <CmsRadio key={option.value} value={option.value}>
                    {option.label}
                  </CmsRadio>
                ))}
              </CmsRadioGroup>
              <DetailInfoForm.InputsSeparator />
              <span style={nowrapSpanStyle}>ID</span>
              <CmsInput
                inputSize="medium"
                placeholder="성범죄 경력조회용 기관 아이디"
                width={240}
              />
              <span style={nowrapSpanStyle}>검증번호</span>
              <CmsInput inputSize="medium" placeholder="검증번호" width={160} />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
