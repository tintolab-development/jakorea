import { CloseOutlined } from '@ant-design/icons'
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
import {
  SMS_NHN_SENDER_NUMBER_CONSOLE_URL,
} from '@/features/notifications/api/adapters/sms-channel'
import { shouldUseSmsTemplatesRemoteApi } from '@/features/notifications/api/sms-template-service'
import { useSmsSenderProfilesQuery, useSmsTemplateVariablesQuery } from '@/features/notifications/hooks/use-sms-send-queries'
import { groupMailTemplateVariablesFromCatalog } from '@/features/notifications/model/mail-template/variables'
import { SMS_MMS_ATTACHMENT_GUIDE_LINES } from '@/features/notifications/model/sms-template/attachments'
import { SMS_TEMPLATE_NAME_PLACEHOLDER } from '@/features/notifications/model/sms-template/template-name'
import type { SmsCategory, SmsTemplateItem } from '@/features/notifications/model/sms-template/types'
import { VariablesPanel } from '@/features/notifications/ui/mail-template/variables-panel'
import {
  useSmsTemplateForm,
  type SmsTemplateFormDraft,
  type SmsTemplateFormMode,
} from './use-form'
import { SmsVariableTextField } from './variable-text-field'
import './form-modal.css'

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
          required
          view={templateName}
          edit={
            <CmsInput
              inputSize="large"
              width="100%"
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
          required
          view={senderPhone}
          edit={
            <CmsSelect
              inputSize="large"
              width="100%"
              withAllOption={false}
              loading={senderLoading}
              placeholder="발신 번호를 선택하세요"
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
    () => groupMailTemplateVariablesFromCatalog(variablesQuery.data ?? []),
    [variablesQuery.data]
  )
  const isEdit = mode === 'edit'
  const headerTitle = form.templateName.trim() || SMS_TEMPLATE_NAME_PLACEHOLDER
  const [titleEditing, setTitleEditing] = useState(false)

  const senderOptions = useMemo(() => {
    const fromApi = (senderProfilesQuery.data ?? []).map(profile => {
      // senderKey = NHN 발신번호 문자열 그대로 (하이픈 정규화 금지)
      const phone = profile.senderKey.trim()
      const label = profile.displayName.trim() || phone
      return { label, value: phone }
    })
    // edit: harvest에 없어도 표시용 orphan 유지. create: orphan 넣지 않음 (BE NOT_HARVESTED 유도)
    if (
      mode === 'edit' &&
      form.senderPhone &&
      !fromApi.some(option => option.value === form.senderPhone)
    ) {
      return [{ label: form.senderPhone, value: form.senderPhone }, ...fromApi]
    }
    return fromApi
  }, [form.senderPhone, mode, senderProfilesQuery.data])

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

  function handleAttachmentAdd(files: File[]) {
    const result = form.handleAttachmentAdd(files)
    if (!result.ok) {
      showAlert({ title: '안내', content: result.message })
    }
  }

  const previewSubjectPlaceholder = form.subject.trim() || '제목을 작성하세요'
  const previewBodyPlaceholder = form.bodyText.trim() || '내용을 작성하세요'

  return (
    <>
      <TealHeaderModal
        open={open}
        onCancel={onClose}
        title={headerTitle}
        size="full"
        hideHeader
        className="sms-template-form-modal teal-header-modal--full"
      >
        <div className="sms-template-form-modal__shell">
          <header className="sms-template-form-modal__title-row">
            <div className="sms-template-form-modal__title-edit">
              <CmsInputIconClick
                value={form.templateName}
                editing={titleEditing}
                placeholder={SMS_TEMPLATE_NAME_PLACEHOLDER}
                onChange={form.setTemplateName}
                onRequestEdit={() => setTitleEditing(true)}
                onCommitEdit={() => setTitleEditing(false)}
                inputAriaLabel={SMS_TEMPLATE_NAME_PLACEHOLDER}
                editButtonAriaLabel="템플릿명 수정"
                containerClassName="sms-template-form-modal__title-edit-row"
                inputClassName="sms-template-form-modal__title-input sms-template-form-modal__title-input--editing"
                textClassName="sms-template-form-modal__title-text"
                editButtonClassName="sms-template-form-modal__title-edit-btn"
              />
            </div>
            <div className="sms-template-form-modal__title-actions">
              {isEdit ? (
                <>
                  <CmsButton variant="cancel" size="large" width={140} type="button" onClick={onClose}>
                    닫기
                  </CmsButton>
                  <CmsButton
                    variant="delete"
                    size="large"
                    width={140}
                    type="button"
                    disabled={submitting}
                    onClick={() => setDeleteOpen(true)}
                  >
                    템플릿 삭제
                  </CmsButton>
                  <CmsButton
                    variant="primary"
                    size="large"
                    width={140}
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmit}
                  >
                    수정
                  </CmsButton>
                </>
              ) : (
                <>
                  <CmsButton variant="cancel" size="large" width={140} type="button" onClick={onClose}>
                    취소
                  </CmsButton>
                  <CmsButton
                    variant="primary"
                    size="large"
                    width={140}
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmit}
                  >
                    등록
                  </CmsButton>
                </>
              )}
              <button
                type="button"
                className="sms-template-form-modal__title-close"
                onClick={onClose}
                aria-label="닫기"
              >
                <CloseOutlined />
              </button>
            </div>
          </header>

          <div className="sms-template-form-modal__body">
            <div className="sms-template-form-modal__layout">
              <div className="sms-template-form-modal__main">
                <section className="sms-template-form-modal__widget">
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
                        ? ' 목록이 비어 있으면 문자 템플릿 화면에서 「동기화」를 먼저 실행해 주세요.'
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

                <section className="sms-template-form-modal__widget sms-template-form-modal__widget--compose">
                  <div className="sms-template-form-modal__section-head">
                    <h3 className="sms-template-form-modal__section-title">템플릿 작성</h3>
                  </div>
                  <div className="sms-template-form-modal__compose-row">
                    <DetailInfoForm
                      title="템플릿 작성"
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
                              value={form.messageType}
                              onChange={event =>
                                form.handleMessageTypeChange(String(event.target.value))
                              }
                            >
                              <CmsRadio value="SMS">SMS</CmsRadio>
                              <CmsRadio value="LMS">LMS</CmsRadio>
                              <CmsRadio value="MMS">MMS</CmsRadio>
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
                                  maxLength={form.subjectMaxLength}
                                  onValueChange={form.setSubject}
                                >
                                  <CmsInput
                                    ref={form.subjectInputRef}
                                    inputSize="large"
                                    width="100%"
                                    allowClear={false}
                                    maxLength={form.subjectMaxLength}
                                    placeholder="제목을 작성하세요"
                                    value={form.subject}
                                    onChange={event => form.setSubject(event.target.value)}
                                    onFocus={event => form.rememberSubjectRange(event.currentTarget)}
                                    onBlur={event => form.rememberSubjectRange(event.currentTarget)}
                                    onSelect={event => form.rememberSubjectRange(event.currentTarget)}
                                    onClick={event => form.rememberSubjectRange(event.currentTarget)}
                                    onKeyUp={event => form.rememberSubjectRange(event.currentTarget)}
                                  />
                                </SmsVariableTextField>
                                <span className="sms-template-form-modal__subject-count">
                                  {form.subject.length}/{form.subjectMaxLength}
                                </span>
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
                                  inputSize="large"
                                  width="100%"
                                  rows={8}
                                  placeholder="내용을 작성하세요"
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
                                <span
                                  className={
                                    form.bodyByteLength > form.bodyByteLimit
                                      ? 'sms-template-form-modal__byte-count sms-template-form-modal__byte-count--danger'
                                      : 'sms-template-form-modal__byte-count'
                                  }
                                >
                                  {form.bodyByteLength} / {form.bodyByteLimit}byte
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
                              <FileSelectField
                                className="sms-template-form-modal__file-field"
                                multiple
                                accept=".jpg,.jpeg"
                                buttonLabel="파일 추가"
                                fileNames={form.attachmentsEnabled ? form.attachmentFileNames : []}
                                guideLines={[...SMS_MMS_ATTACHMENT_GUIDE_LINES]}
                                onFilesChange={handleAttachmentAdd}
                                onRemoveFile={form.handleAttachmentRemove}
                              />
                            }
                          />
                        </DetailInfoForm.Row>
                      ) : null}
                    </DetailInfoForm>

                    <SmsPhonePreview
                      className="sms-template-form-modal__phone"
                      senderPhone={form.senderPhone}
                      subject={previewSubjectPlaceholder}
                      bodyText={previewBodyPlaceholder}
                      showSubject={form.showSubject}
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
