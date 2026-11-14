import { ModalCloseIcon } from '@/shared/ui/icons'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import {
  CmsButton,
  CmsInput,
  CmsInputIconClick,
  CmsRadio,
  CmsSelect,
  CmsTextArea,
  ConfirmModal,
  FileSelectField,
  SmsPhonePreview,
  useCmsAlert,
} from '@/shared/ui'
import { SMS_NHN_SENDER_NUMBER_CONSOLE_URL } from '@/features/notifications/api/adapters/sms-channel'
import { shouldUseSmsTemplatesRemoteApi } from '@/features/notifications/api/sms-template-service'
import {
  useSmsSenderProfilesQuery,
  useSmsTemplateVariablesQuery,
} from '@/features/notifications/hooks/use-sms-send-queries'
import { groupMailTemplateVariablesFromCatalog } from '@/features/notifications/model/mail-template/variables'
import {
  collectSmsComposeFieldIssues,
  estimateSmsTextBytes,
  SMS_SUBJECT_BYTE_LIMIT,
  smsComposeInlineMessage,
} from '@/features/notifications/model/sms-send/text-bytes'
import { SMS_MMS_ATTACHMENT_GUIDE_LINES } from '@/features/notifications/model/sms-template/attachments'
import { buildSmsSenderPhoneOptions } from '@/features/notifications/model/sms-template/sender-phone'
import { SMS_TEMPLATE_NAME_PLACEHOLDER } from '@/features/notifications/model/sms-template/template-name'
import type {
  SmsCategory,
  SmsTemplateItem,
} from '@/features/notifications/model/sms-template/types'
import { VariablesPanel } from '@/features/notifications/ui/mail-template/variables-panel'
import { useSmsTemplateForm, type SmsTemplateFormDraft, type SmsTemplateFormMode } from './use-form'
import { SmsVariableTextField } from './variable-text-field'
import '@/features/notifications/ui/shared/notification-fullpage-modal.css'
import './form-modal.css'

/** 시안: 템플릿명 입력 450px · 발신 번호 select 152px (QA 2026-11-13) */
const SMS_TEMPLATE_NAME_INPUT_WIDTH = 450
const SMS_SENDER_SELECT_WIDTH = 152
const SMS_SUBJECT_PLACEHOLDER = '제목을 작성해 주세요'
const SMS_BODY_PLACEHOLDER = '내용을 입력해 주세요'
const SMS_PREVIEW_BODY_PLACEHOLDER = '내용을 작성해 주세요'

type BasicSettingsFieldsProps = {
  templateName: string
  senderPhone: string
  senderOptions: Array<{ label: string; value: string }>
  senderLoading?: boolean
  onTemplateNameChange: (value: string, options?: { composing?: boolean }) => void
  onSenderPhoneChange: (value: string) => void
}

const BasicSettingsFields = memo(function BasicSettingsFields({
  templateName,
  senderPhone,
  senderOptions,
  senderLoading = false,
  onTemplateNameChange,
  onSenderPhoneChange,
}: BasicSettingsFieldsProps) {
  const composingNameRef = useRef(false)

  return (
    <DetailInfoForm title="기본 설정" hideHeader mode="edit">
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="템플릿명"
          view={templateName}
          edit={
            <CmsInput
              inputSize="small"
              width={SMS_TEMPLATE_NAME_INPUT_WIDTH}
              allowClear={false}
              placeholder={SMS_TEMPLATE_NAME_PLACEHOLDER}
              value={templateName}
              onCompositionStart={() => {
                composingNameRef.current = true
              }}
              onCompositionEnd={event => {
                composingNameRef.current = false
                onTemplateNameChange(event.currentTarget.value)
              }}
              onChange={event => {
                const next = event.target.value
                const native = event.nativeEvent as InputEvent
                if (composingNameRef.current || native.isComposing) {
                  onTemplateNameChange(next, { composing: true })
                  return
                }
                onTemplateNameChange(next)
              }}
            />
          }
        />
        <DetailInfoForm.Field
          label="발신 번호"
          view={senderPhone}
          edit={
            <CmsSelect
              inputSize="small"
              width={SMS_SENDER_SELECT_WIDTH}
              withAllOption={false}
              loading={senderLoading}
              placeholder="발신 번호를 선택해 주세요"
              options={senderOptions}
              value={senderPhone || undefined}
              onChange={value => onSenderPhoneChange(String(value ?? ''))}
            />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
})

type FormModalProps = {
  open: boolean
  mode: SmsTemplateFormMode
  template: SmsTemplateItem | null
  categories: SmsCategory[]
  initialCategoryId?: string | null
  submitting?: boolean
  onClose: () => void
  onSubmit: (draft: SmsTemplateFormDraft) => void
  onDelete?: () => void
}

export function FormModal({
  open,
  mode,
  template,
  categories: _categories,
  initialCategoryId,
  submitting = false,
  onClose,
  onSubmit,
  onDelete,
}: FormModalProps) {
  const { showAlert } = useCmsAlert()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const form = useSmsTemplateForm(open, mode, template, initialCategoryId)
  const remote = shouldUseSmsTemplatesRemoteApi()
  const senderProfilesQuery = useSmsSenderProfilesQuery(open)
  const variablesQuery = useSmsTemplateVariablesQuery({}, open && remote)
  const variableGroups = useMemo(
    () => groupMailTemplateVariablesFromCatalog(variablesQuery.data?.variables ?? []),
    [variablesQuery.data?.variables]
  )
  const isEdit = mode === 'edit'
  const headerTitle = form.templateName.trim() || SMS_TEMPLATE_NAME_PLACEHOLDER
  const [titleEditing, setTitleEditing] = useState(false)

  // edit: harvest에 없어도 표시용 orphan 유지. create: orphan 넣지 않음 (BE NOT_HARVESTED 유도)
  const senderOptions = useMemo(
    () =>
      buildSmsSenderPhoneOptions(
        senderProfilesQuery.data,
        mode === 'edit' ? form.senderPhone : undefined
      ),
    [form.senderPhone, mode, senderProfilesQuery.data]
  )

  const harvestedSenderKeys = useMemo(
    () => (senderProfilesQuery.data ?? []).map(profile => profile.senderKey.trim()).filter(Boolean),
    [senderProfilesQuery.data]
  )

  const senderListEmpty =
    remote &&
    !senderProfilesQuery.isFetching &&
    !senderProfilesQuery.isLoading &&
    harvestedSenderKeys.length === 0 &&
    !form.senderPhone

  useEffect(() => {
    if (!open) return
    setTitleEditing(mode === 'create')
  }, [open, mode])

  function handleSubmit() {
    const error = form.validateRequired(
      remote && harvestedSenderKeys.length > 0 ? { harvestedSenderKeys } : undefined
    )
    if (error) {
      showAlert({ title: '필수 입력 안내', content: error })
      return
    }
    onSubmit(form.getDraft())
  }

  async function handleAttachmentAdd(files: File[]) {
    const result = await form.handleAttachmentAdd(files)
    if (!result.ok) {
      showAlert({ title: '안내', content: result.message })
    }
  }

  // 미선택이면 시안처럼 LMS/MMS 기준(제목 행·2000byte)으로 인라인 상태를 본다.
  const composeIssues = collectSmsComposeFieldIssues({
    messageType: form.messageType || 'LMS',
    subject: form.subject,
    bodyText: form.bodyText,
    attachmentCount: form.attachmentFileNames.length,
  })
  const subjectByteLength = estimateSmsTextBytes(form.subject)
  /** 시안(16127:606947): 제목·본문 byte 초과(빨간 카운터)면 저장/등록 비활성 */
  const byteLimitExceeded =
    (form.showSubject && subjectByteLength > SMS_SUBJECT_BYTE_LIMIT) ||
    form.bodyByteLength > form.bodyByteLimit

  return (
    <>
      <TealHeaderModal
        open={open}
        onCancel={onClose}
        title={headerTitle}
        size="full"
        hideHeader
        className="notification-fullpage-modal sms-template-form-modal teal-header-modal--full"
      >
        <div className="notification-fullpage-modal__shell">
          <header className="notification-fullpage-modal__title-row">
            <div className="notification-fullpage-modal__title-edit">
              <CmsInputIconClick
                value={form.templateName}
                editing={titleEditing}
                placeholder={SMS_TEMPLATE_NAME_PLACEHOLDER}
                onChange={form.setTemplateName}
                onRequestEdit={() => setTitleEditing(true)}
                onCommitEdit={() => setTitleEditing(false)}
                inputAriaLabel={SMS_TEMPLATE_NAME_PLACEHOLDER}
                editButtonAriaLabel="템플릿명 수정"
                containerClassName="notification-fullpage-modal__title-edit-row"
                inputClassName="notification-fullpage-modal__title-input notification-fullpage-modal__title-input--editing"
                textClassName="notification-fullpage-modal__title-text"
                editButtonClassName="notification-fullpage-modal__title-edit-btn"
              />
            </div>
            <button
              type="button"
              className="notification-fullpage-modal__title-close"
              onClick={onClose}
              aria-label="닫기"
            >
              <ModalCloseIcon />
            </button>
          </header>

          <div className="notification-fullpage-modal__body">
            <div className="notification-fullpage-modal__notice">
              <div className="notification-fullpage-modal__notice-actions">
                {isEdit ? (
                  <>
                    <CmsButton
                      variant="cancel"
                      size="large"
                      type="button"
                      onClick={onClose} >
                      취소
                    </CmsButton>
                    <CmsButton
                      variant="delete"
                      size="large"
                      type="button"
                      disabled={submitting}
                      onClick={() => setDeleteOpen(true)} >
                      삭제
                    </CmsButton>
                    <CmsButton
                      variant="primary"
                      size="large"
                      type="button"
                      disabled={submitting || byteLimitExceeded}
                      onClick={handleSubmit} >
                      저장
                    </CmsButton>
                  </>
                ) : (
                  <>
                    <CmsButton
                      variant="cancel"
                      size="large"
                      type="button"
                      onClick={onClose} >
                      취소
                    </CmsButton>
                    <CmsButton
                      variant="primary"
                      size="large"
                      type="button"
                      disabled={submitting || byteLimitExceeded}
                      onClick={handleSubmit} >
                      등록
                    </CmsButton>
                  </>
                )}
              </div>
            </div>

            <div className="notification-fullpage-modal__layout">
              <div className="notification-fullpage-modal__main">
                <section className="notification-fullpage-modal__widget">
                  <div className="sms-template-form-modal__section-head">
                    <h3 className="info-section-title detail-info-form__title sms-template-form-modal__section-title">
                      기본 설정
                      <span className="sms-template-form-modal__required" aria-hidden>
                        *
                      </span>
                    </h3>
                    <p className="info-section-desc sms-template-form-modal__section-hint">
                      발신 번호는{' '}
                      <a
                        className="sms-template-form-modal__section-hint-link"
                        href={SMS_NHN_SENDER_NUMBER_CONSOLE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        NHN Cloud의 [발신 정보 &gt; 발신 번호 관리] 메뉴
                      </a>
                      에서 사전 등록된 번호만 사용 가능합니다.
                      {senderListEmpty
                        ? ' 목록이 비어 있으면 NHN Cloud에 발신 번호가 등록돼 있는지 확인한 뒤 문자 관리 화면을 다시 열어 주세요.'
                        : null}
                    </p>
                  </div>
                  <BasicSettingsFields
                    templateName={form.templateName}
                    senderPhone={form.senderPhone}
                    senderOptions={senderOptions}
                    senderLoading={senderProfilesQuery.isFetching}
                    onTemplateNameChange={form.setTemplateName}
                    onSenderPhoneChange={form.setSenderPhone}
                  />
                </section>

                <section className="notification-fullpage-modal__widget sms-template-form-modal__widget--compose">
                  <div className="sms-template-form-modal__section-head">
                    <h3 className="sms-template-form-modal__section-title">문자 작성</h3>
                  </div>
                  <div className="sms-template-form-modal__compose-row">
                    <DetailInfoForm
                      title="문자 작성"
                      hideHeader
                      mode="edit"
                      className="sms-template-form-modal__compose"
                    >
                      <DetailInfoForm.Row type="single">
                        <DetailInfoForm.Field
                          label="발송 유형"
                          required
                          fullRow
                          view={form.messageType}
                          edit={
                            <CmsRadio.Group
                              size="medium"
                              value={form.messageType || undefined}
                              onChange={event =>
                                form.handleMessageTypeChange(String(event.target.value))
                              }
                            >
                              <CmsRadio size="medium" value="SMS">
                                SMS
                              </CmsRadio>
                              <CmsRadio size="medium" value="LMS">
                                LMS
                              </CmsRadio>
                              <CmsRadio size="medium" value="MMS">
                                MMS
                              </CmsRadio>
                            </CmsRadio.Group>
                          }
                        />
                      </DetailInfoForm.Row>
                      {form.showSubject ? (
                        <DetailInfoForm.Row type="single">
                          <DetailInfoForm.Field
                            label="제목"
                            required={form.messageType !== 'SMS'}
                            fullRow
                            view={form.subject}
                            edit={
                              <div className="sms-template-form-modal__subject-field">
                                <SmsVariableTextField
                                  value={form.subject}
                                  onValueChange={form.setSubject}
                                >
                                  <CmsInput
                                    ref={form.subjectInputRef}
                                    inputSize="small"
                                    width="100%"
                                    allowClear={false}
                                    placeholder={SMS_SUBJECT_PLACEHOLDER}
                                    error={Boolean(
                                      smsComposeInlineMessage(composeIssues.subjectError)
                                    )}
                                    value={form.subject}
                                    onChange={event => form.setSubject(event.target.value)}
                                    onFocus={event =>
                                      form.rememberSubjectRange(event.currentTarget)
                                    }
                                    onBlur={event => form.rememberSubjectRange(event.currentTarget)}
                                    onSelect={event =>
                                      form.rememberSubjectRange(event.currentTarget)
                                    }
                                    onClick={event =>
                                      form.rememberSubjectRange(event.currentTarget)
                                    }
                                    onKeyUp={event =>
                                      form.rememberSubjectRange(event.currentTarget)
                                    }
                                  />
                                </SmsVariableTextField>
                                <div className="sms-template-form-modal__byte-row sms-template-form-modal__byte-row--subject">
                                  <span
                                    className={
                                      subjectByteLength > SMS_SUBJECT_BYTE_LIMIT
                                        ? 'sms-template-form-modal__byte-count sms-template-form-modal__byte-count--danger'
                                        : 'sms-template-form-modal__byte-count'
                                    }
                                  >
                                    {subjectByteLength}
                                  </span>
                                  <span className="sms-template-form-modal__byte-label">
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
                          view={form.bodyText}
                          edit={
                            <div className="sms-template-form-modal__body-field">
                              <SmsVariableTextField
                                value={form.bodyText}
                                multiline
                                onValueChange={form.setBodyText}
                              >
                                <CmsTextArea
                                  ref={form.bodyTextRef}
                                  inputSize="small"
                                  width="100%"
                                  rows={8}
                                  placeholder={SMS_BODY_PLACEHOLDER}
                                  error={Boolean(smsComposeInlineMessage(composeIssues.bodyError))}
                                  value={form.bodyText}
                                  onChange={event => form.setBodyText(event.target.value)}
                                  onFocus={event => form.rememberBodyRange(event.currentTarget)}
                                  onBlur={event => form.rememberBodyRange(event.currentTarget)}
                                  onSelect={event => form.rememberBodyRange(event.currentTarget)}
                                  onClick={event => form.rememberBodyRange(event.currentTarget)}
                                  onKeyUp={event => form.rememberBodyRange(event.currentTarget)}
                                />
                              </SmsVariableTextField>
                              <div className="sms-template-form-modal__byte-row">
                                <span className="sms-template-form-modal__byte-label">
                                  {form.bodyCounterLabel}
                                </span>
                                <span className="sms-template-form-modal__byte-meter">
                                  <span
                                    className={
                                      form.bodyByteLength > form.bodyByteLimit
                                        ? 'sms-template-form-modal__byte-count sms-template-form-modal__byte-count--danger'
                                        : 'sms-template-form-modal__byte-count'
                                    }
                                  >
                                    {form.bodyByteLength}
                                  </span>
                                  <span className="sms-template-form-modal__byte-label">
                                    / {form.bodyByteLimit}byte
                                  </span>
                                </span>
                              </div>
                            </div>
                          }
                        />
                      </DetailInfoForm.Row>
                      {form.showAttachments ? (
                        <DetailInfoForm.Row type="single">
                          <DetailInfoForm.Field
                            label="첨부파일"
                            fullRow
                            view=""
                            edit={
                              <div
                                className={
                                  composeIssues.attachmentError
                                    ? 'sms-template-form-modal__file-wrap sms-template-form-modal__file-wrap--error'
                                    : 'sms-template-form-modal__file-wrap'
                                }
                              >
                                <FileSelectField
                                  className="sms-template-form-modal__file-field"
                                  multiple
                                  accept=".jpg,.jpeg"
                                  fileNames={form.attachmentFileNames}
                                  guideLines={[...SMS_MMS_ATTACHMENT_GUIDE_LINES]}
                                  onFilesChange={files => {
                                    void handleAttachmentAdd(files)
                                  }}
                                  onRemoveFile={form.handleAttachmentRemove}
                                />
                                {composeIssues.attachmentError ? (
                                  <p className="cms-field__message cms-field__message--error">
                                    {composeIssues.attachmentError}
                                  </p>
                                ) : null}
                              </div>
                            }
                          />
                        </DetailInfoForm.Row>
                      ) : null}
                    </DetailInfoForm>

                    <SmsPhonePreview
                      className="sms-template-form-modal__phone"
                      senderPhone={form.senderPhone}
                      subject={form.subject}
                      bodyText={form.bodyText}
                      showSubject={form.showSubject}
                      subjectPlaceholder={SMS_SUBJECT_PLACEHOLDER}
                      bodyPlaceholder={SMS_PREVIEW_BODY_PLACEHOLDER}
                    />
                  </div>
                </section>
              </div>
              <VariablesPanel
                onInsert={form.insertVariable}
                groups={variableGroups.length > 0 ? variableGroups : undefined}
                respectCatalogEnabled={false}
              />
            </div>
          </div>
        </div>
      </TealHeaderModal>

      <ConfirmModal
        open={deleteOpen}
        title="템플릿 삭제"
        content="템플릿을 삭제하시겠습니까?"
        warningMessage="삭제된 항목은 복구할 수 없습니다."
        danger
        confirmText="삭제"
        zIndex={1200}
        onConfirm={() => {
          setDeleteOpen(false)
          onDelete?.()
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  )
}
