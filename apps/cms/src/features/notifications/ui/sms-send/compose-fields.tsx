import { memo, useDeferredValue, useEffect, useMemo, useState, type MutableRefObject } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput, CmsTextArea } from '@/shared/ui'
import { estimateSmsSendBodyBytes } from '@/features/notifications/model/sms-send/payload'
import { SmsVariableTextField } from '@/features/notifications/ui/sms-template/variable-text-field'
import './fullpage-modal.css'

type SmsSendComposeFieldsProps = {
  /** applyTemplate / open reset 시만 증가 — 타이핑으로는 올리지 않음 */
  composeVersion: number
  initialSubject: string
  initialBodyText: string
  showSubject: boolean
  bodyByteLimit: number
  subjectRef: MutableRefObject<string>
  bodyTextRef: MutableRefObject<string>
  /** 본문 변경 시 바이트 기준 메시지 유형 동기화 */
  onBodyTextChange?: (bodyText: string) => void
}

/**
 * 문자 작성 입력을 부모 리렌더와 분리.
 * 타이핑은 로컬 state + ref만 갱신하고, 수신자 테이블 등 형제는 다시 그리지 않는다.
 */
export const SmsSendComposeFields = memo(function SmsSendComposeFields({
  composeVersion,
  initialSubject,
  initialBodyText,
  showSubject,
  bodyByteLimit,
  subjectRef,
  bodyTextRef,
  onBodyTextChange,
}: SmsSendComposeFieldsProps) {
  const [subject, setSubject] = useState(initialSubject)
  const [bodyText, setBodyText] = useState(initialBodyText)

  useEffect(() => {
    setSubject(initialSubject)
    setBodyText(initialBodyText)
    subjectRef.current = initialSubject
    bodyTextRef.current = initialBodyText
  }, [bodyTextRef, composeVersion, initialBodyText, initialSubject, subjectRef])

  const deferredBody = useDeferredValue(bodyText)
  const bodyByteLength = useMemo(
    () => estimateSmsSendBodyBytes(deferredBody),
    [deferredBody]
  )

  useEffect(() => {
    onBodyTextChange?.(deferredBody)
  }, [deferredBody, onBodyTextChange])

  const commitBody = (next: string) => {
    setBodyText(next)
    bodyTextRef.current = next
  }

  return (
    <DetailInfoForm
      title="문자 작성"
      hideHeader
      mode="edit"
      className="mail-send-fullpage__compose"
    >
      {showSubject ? (
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="제목"
            required
            fullRow
            view={subject}
            edit={
              <CmsInput
                inputSize="large"
                width="100%"
                allowClear={false}
                maxLength={1000}
                placeholder="제목을 작성하세요"
                value={subject}
                onChange={event => {
                  const next = event.target.value
                  setSubject(next)
                  subjectRef.current = next
                }}
              />
            }
          />
        </DetailInfoForm.Row>
      ) : null}
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="내용"
          required
          fullRow
          view={bodyText}
          edit={
            <div className="sms-send-fullpage__body-field">
              <SmsVariableTextField value={bodyText} multiline onValueChange={commitBody}>
                <CmsTextArea
                  inputSize="large"
                  width="100%"
                  rows={12}
                  placeholder="내용을 작성하세요"
                  value={bodyText}
                  onChange={event => commitBody(event.target.value)}
                />
              </SmsVariableTextField>
              <div className="sms-send-fullpage__byte-row">
                <span>SMS는 90byte, LMS/MMS는 2000byte까지 작성할 수 있습니다.</span>
                <span
                  className={
                    bodyByteLength > bodyByteLimit
                      ? 'sms-send-fullpage__byte-count sms-send-fullpage__byte-count--danger'
                      : 'sms-send-fullpage__byte-count'
                  }
                >
                  {bodyByteLength}/{bodyByteLimit} byte
                </span>
              </div>
            </div>
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
})
