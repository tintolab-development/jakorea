import { memo, useDeferredValue, useEffect, useMemo, useState, type MutableRefObject } from 'react'
import type { SmsMessageType } from '@/features/notifications/api/adapters/sms-channel'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput, CmsTextArea, FileSelectField, useCmsAlert } from '@/shared/ui'
import { SMS_MMS_ATTACHMENT_GUIDE_LINES } from '@/features/notifications/model/sms-template/attachments'
import {
  collectSmsComposeFieldIssues,
  estimateSmsSendBodyBytes,
  estimateSmsTextBytes,
  SMS_SUBJECT_BYTE_LIMIT,
  smsBodyByteLimit,
  smsComposeBlocksSend,
  smsComposeInlineMessage,
} from '@/features/notifications/model/sms-send/text-bytes'
import { listSmsSendPlaceholderKeys } from '@/features/notifications/model/sms-send/validate-send'
import { SmsVariableTextField } from '@/features/notifications/ui/sms-template/variable-text-field'
import './fullpage-modal.css'

type SmsSendComposeFieldsProps = {
  /** applyTemplate / open reset 시만 증가 — 타이핑으로는 올리지 않음 */
  composeVersion: number
  initialSubject: string
  initialBodyText: string
  messageType: SmsMessageType
  attachmentFileNames: string[]
  subjectRef: MutableRefObject<string>
  bodyTextRef: MutableRefObject<string>
  onRememberSubjectRange?: (el: HTMLInputElement | null) => void
  onRememberBodyRange?: (el: HTMLTextAreaElement | null) => void
  onRemoveAttachment?: (index: number) => void
  onAddAttachments?: (files: File[]) => Promise<{ ok: boolean; message?: string }>
  onBlockingChange?: (blocking: boolean) => void
  /** #{키} 집합이 바뀔 때만 호출. 일반 타이핑으로 부모를 다시 그리지 않는다. */
  onUsedVariableKeysChange?: (keys: string[]) => void
}

/**
 * 문자 작성 입력을 부모 리렌더와 분리.
 * 타이핑은 로컬 state + ref만 갱신하고, 수신자 테이블 등 형제는 다시 그리지 않는다.
 * 발송 차단 여부만 오류 상태가 바뀔 때 부모에 알린다.
 */
export const SmsSendComposeFields = memo(function SmsSendComposeFields({
  composeVersion,
  initialSubject,
  initialBodyText,
  messageType,
  attachmentFileNames,
  subjectRef,
  bodyTextRef,
  onRememberSubjectRange,
  onRememberBodyRange,
  onRemoveAttachment,
  onAddAttachments,
  onBlockingChange,
  onUsedVariableKeysChange,
}: SmsSendComposeFieldsProps) {
  const { showAlert } = useCmsAlert()
  const [subject, setSubject] = useState(initialSubject)
  const [bodyText, setBodyText] = useState(initialBodyText)

  useEffect(() => {
    setSubject(initialSubject)
    setBodyText(initialBodyText)
    subjectRef.current = initialSubject
    bodyTextRef.current = initialBodyText
  }, [bodyTextRef, composeVersion, initialBodyText, initialSubject, subjectRef])

  const deferredBody = useDeferredValue(bodyText)
  const deferredSubject = useDeferredValue(subject)
  const bodyByteLimit = smsBodyByteLimit(messageType)
  const bodyByteLength = useMemo(() => estimateSmsSendBodyBytes(deferredBody), [deferredBody])
  const subjectByteLength = useMemo(() => estimateSmsTextBytes(deferredSubject), [deferredSubject])

  const issues = useMemo(
    () =>
      collectSmsComposeFieldIssues({
        messageType,
        subject: deferredSubject,
        bodyText: deferredBody,
        attachmentCount: attachmentFileNames.length,
      }),
    [attachmentFileNames.length, deferredBody, deferredSubject, messageType]
  )

  useEffect(() => {
    onBlockingChange?.(smsComposeBlocksSend(issues))
  }, [issues, onBlockingChange])

  const usedVariableKeySig = useMemo(
    () =>
      listSmsSendPlaceholderKeys({
        messageType,
        subject,
        bodyText,
      }).join('\0'),
    [bodyText, messageType, subject]
  )

  useEffect(() => {
    onUsedVariableKeysChange?.(usedVariableKeySig ? usedVariableKeySig.split('\0') : [])
  }, [onUsedVariableKeysChange, usedVariableKeySig])

  const commitBody = (next: string) => {
    setBodyText(next)
    bodyTextRef.current = next
  }

  const showSubject = messageType !== 'SMS' || subject.trim().length > 0
  const showAttachments = messageType === 'MMS' || attachmentFileNames.length > 0
  const attachmentsEnabled = messageType === 'MMS'
  const subjectRequired = messageType !== 'SMS'

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
            required={subjectRequired}
            fullRow
            view={subject}
            edit={
              <div className="sms-send-fullpage__subject-field">
                <SmsVariableTextField
                  value={subject}
                  onValueChange={next => {
                    setSubject(next)
                    subjectRef.current = next
                  }}
                >
                  <CmsInput
                    className="sms-send-fullpage__subject-input"
                    inputSize="small"
                    width="100%"
                    allowClear={false}
                    error={Boolean(smsComposeInlineMessage(issues.subjectError))}
                    value={subject}
                    onChange={event => {
                      const next = event.target.value
                      setSubject(next)
                      subjectRef.current = next
                    }}
                    onFocus={event => onRememberSubjectRange?.(event.currentTarget)}
                    onBlur={event => onRememberSubjectRange?.(event.currentTarget)}
                    onSelect={event => onRememberSubjectRange?.(event.currentTarget)}
                    onClick={event => onRememberSubjectRange?.(event.currentTarget)}
                    onKeyUp={event => onRememberSubjectRange?.(event.currentTarget)}
                  />
                </SmsVariableTextField>
                <div className="sms-send-fullpage__byte-row">
                  <span
                    className={
                      subjectByteLength > SMS_SUBJECT_BYTE_LIMIT
                        ? 'sms-send-fullpage__byte-count sms-send-fullpage__byte-count--danger'
                        : 'sms-send-fullpage__byte-count'
                    }
                  >
                    {subjectByteLength}
                  </span>
                  <span className="sms-send-fullpage__byte-label">
                    / {SMS_SUBJECT_BYTE_LIMIT}byte
                  </span>
                </div>
              </div>
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
                  inputSize="small"
                  width="100%"
                  rows={12}
                  error={Boolean(smsComposeInlineMessage(issues.bodyError))}
                  value={bodyText}
                  onChange={event => commitBody(event.target.value)}
                  onFocus={event => onRememberBodyRange?.(event.currentTarget)}
                  onBlur={event => onRememberBodyRange?.(event.currentTarget)}
                  onSelect={event => onRememberBodyRange?.(event.currentTarget)}
                  onClick={event => onRememberBodyRange?.(event.currentTarget)}
                  onKeyUp={event => onRememberBodyRange?.(event.currentTarget)}
                />
              </SmsVariableTextField>
              <div className="sms-send-fullpage__byte-row">
                <span className="sms-send-fullpage__byte-label">문자내용</span>
                <span className="sms-send-fullpage__byte-meter">
                  <span
                    className={
                      bodyByteLength > bodyByteLimit
                        ? 'sms-send-fullpage__byte-count sms-send-fullpage__byte-count--danger'
                        : 'sms-send-fullpage__byte-count'
                    }
                  >
                    {bodyByteLength}
                  </span>
                  <span className="sms-send-fullpage__byte-label">/ {bodyByteLimit}byte</span>
                </span>
              </div>
            </div>
          }
        />
      </DetailInfoForm.Row>
      {showAttachments ? (
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="첨부파일"
            fullRow
            view=""
            edit={
              <div
                className={
                  issues.attachmentError
                    ? 'sms-send-fullpage__attachments sms-send-fullpage__attachments--error'
                    : 'sms-send-fullpage__attachments'
                }
              >
                <FileSelectField
                  multiple
                  accept=".jpg,.jpeg"
                  disabled={!attachmentsEnabled}
                  fileNames={attachmentFileNames}
                  guideLines={[...SMS_MMS_ATTACHMENT_GUIDE_LINES]}
                  onFilesChange={files => {
                    void (async () => {
                      const result = await onAddAttachments?.(files)
                      if (result && !result.ok && result.message) {
                        showAlert({ title: '안내', content: result.message })
                      }
                    })()
                  }}
                  onRemoveFile={onRemoveAttachment}
                />
                {issues.attachmentError ? (
                  <p className="cms-field__message cms-field__message--error">
                    {issues.attachmentError}
                  </p>
                ) : null}
              </div>
            }
          />
        </DetailInfoForm.Row>
      ) : null}
    </DetailInfoForm>
  )
})
