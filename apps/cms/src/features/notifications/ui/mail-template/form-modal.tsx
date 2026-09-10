import { CloseOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import {
  CmsButton,
  CmsInput,
  CmsInputIconClick,
  CmsSelect,
  ConfirmModal,
  useCmsAlert,
} from '@/shared/ui'
import {
  MAIL_API_CHANNEL_TYPE,
  MAIL_NHN_SENDER_PROFILE_CONSOLE_URL,
} from '@/features/notifications/api/adapters/mail-channel'
import { getNotificationsApiErrorMessage } from '@/features/notifications/api/get-notifications-api-error'
import { shouldUseMailTemplatesRemoteApi } from '@/features/notifications/api/mail-template-service'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'
import { syncSenderProfilesRemote } from '@/features/notifications/api/notifications-api-client'
import {
  useMailSenderProfilesQuery,
  useMailTemplateVariablesQuery,
} from '@/features/notifications/hooks/use-mail-send-queries'
import {
  findHarvestedMailSenderKey,
  MAIL_SENDER_DISPLAY_NAME_READONLY_HINT,
  MAIL_SENDER_PROFILES_EMPTY_MESSAGE,
  MAIL_TEMPLATE_DEFAULT_SENDER_EMAIL,
} from '@/features/notifications/model/mail-template/sender-email'
import { groupMailTemplateVariablesFromCatalog } from '@/features/notifications/model/mail-template/variables'
import { MAIL_TEMPLATE_NAME_PLACEHOLDER } from '@/features/notifications/model/mail-template/template-name'
import type { MailTemplateItem } from '@/features/notifications/model/mail-template/types'
import type { MailPreviewAttachment } from '@/features/notifications/model/mail-template/preview'
import { ComposeFields } from './compose-fields'
import { PreviewModal } from './preview-modal'
import {
  useMailTemplateForm,
  type MailTemplateFormDraft,
  type MailTemplateFormMode,
} from './use-form'
import { VariablesPanel } from './variables-panel'
import './form-modal.css'

type SenderEmailOption = { label: string; value: string }

type BasicSettingsFieldsProps = {
  templateName: string
  senderNameSeed: string
  senderNameEpoch: number
  senderEmail: string
  senderOptions: SenderEmailOption[]
  senderLoading?: boolean
  /** remote Hub: harvest displayName SSOT — invent 입력 금지 */
  senderNameReadOnly?: boolean
  senderEmailDisabled?: boolean
  onTemplateNameChange: (value: string, options?: { composing?: boolean }) => void
  onSenderNameChange: (value: string) => void
  onSenderEmailChange: (value: string) => void
}

const BasicSettingsFields = memo(function BasicSettingsFields({
  templateName,
  senderNameSeed,
  senderNameEpoch,
  senderEmail,
  senderOptions,
  senderLoading = false,
  senderNameReadOnly = false,
  senderEmailDisabled = false,
  onTemplateNameChange,
  onSenderNameChange,
  onSenderEmailChange,
}: BasicSettingsFieldsProps) {
  const composingNameRef = useRef(false)
  const [senderName, setSenderNameLocal] = useState(senderNameSeed)

  useEffect(() => {
    setSenderNameLocal(senderNameSeed)
  }, [senderNameEpoch, senderNameSeed])

  return (
    <DetailInfoForm title="기본 설정" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="템플릿명"
          required
          fullRow
          view={templateName}
          edit={
            <CmsInput
              inputSize="large"
              width="100%"
              allowClear={false}
              placeholder={MAIL_TEMPLATE_NAME_PLACEHOLDER}
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
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="발신자명"
          view={senderName}
          edit={
            <CmsInput
              inputSize="large"
              width="100%"
              allowClear={false}
              readOnly={senderNameReadOnly}
              placeholder={
                senderNameReadOnly
                  ? '발신 메일 선택 시 프로필 표시명이 적용됩니다'
                  : '발신자명을 입력하세요'
              }
              value={senderName}
              onChange={event => {
                if (senderNameReadOnly) return
                const next = event.target.value
                setSenderNameLocal(next)
                onSenderNameChange(next)
              }}
            />
          }
        />
        <DetailInfoForm.Field
          label="발신 메일"
          required
          view={senderEmail}
          edit={
            <CmsSelect
              inputSize="large"
              width="100%"
              withAllOption={false}
              loading={senderLoading}
              disabled={senderEmailDisabled}
              placeholder={
                senderEmailDisabled
                  ? '발신 프로필 동기화 후 선택하세요'
                  : '발신 메일을 선택하세요'
              }
              options={senderOptions}
              value={senderEmail || undefined}
              onChange={value => onSenderEmailChange(String(value ?? ''))}
            />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
})

type PreviewDraft = MailTemplateFormDraft & {
  attachments: MailPreviewAttachment[]
  previewAt: string
}

type FormModalProps = {
  open: boolean
  mode: MailTemplateFormMode
  template: MailTemplateItem | null
  submitting?: boolean
  onClose: () => void
  onSubmit: (draft: MailTemplateFormDraft) => void
  onDelete?: () => void
}

export function FormModal({
  open,
  mode,
  template,
  submitting = false,
  onClose,
  onSubmit,
  onDelete,
}: FormModalProps) {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [previewDraft, setPreviewDraft] = useState<PreviewDraft | null>(null)
  const form = useMailTemplateForm(open, mode, template)
  const remote = shouldUseMailTemplatesRemoteApi()
  const senderProfilesQuery = useMailSenderProfilesQuery(open && remote)
  const syncSenderProfilesMutation = useMutation({
    mutationFn: () => syncSenderProfilesRemote({ channelType: MAIL_API_CHANNEL_TYPE }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: notificationsQueryKeys.mailSend.senderProfiles(),
      })
    },
  })
  const variablesQuery = useMailTemplateVariablesQuery({}, open && remote)
  const variableGroups = useMemo(
    () => groupMailTemplateVariablesFromCatalog(variablesQuery.data ?? []),
    [variablesQuery.data]
  )
  const harvestedSenderKeys = useMemo(
    () => (senderProfilesQuery.data ?? []).map(profile => profile.senderKey.trim()).filter(Boolean),
    [senderProfilesQuery.data]
  )
  const defaultHarvestKey = useMemo(
    () => findHarvestedMailSenderKey(MAIL_TEMPLATE_DEFAULT_SENDER_EMAIL, harvestedSenderKeys),
    [harvestedSenderKeys]
  )
  const senderProfilesReady =
    remote &&
    !senderProfilesQuery.isFetching &&
    !senderProfilesQuery.isLoading &&
    senderProfilesQuery.isFetched
  const senderListEmpty = senderProfilesReady && harvestedSenderKeys.length === 0
  const defaultMissingFromHarvest =
    senderProfilesReady && harvestedSenderKeys.length > 0 && !defaultHarvestKey
  /** create 세션당 harvest 기본 From 적용은 1회만 — 입력 중 setState 루프/버벅임 방지 */
  const didApplyDefaultSenderRef = useRef(false)

  const resolveHarvestDisplayName = useCallback(
    (email: string) => {
      const key = email.trim().toLowerCase()
      if (!key) return ''
      const matched = (senderProfilesQuery.data ?? []).find(
        profile => profile.senderKey.trim().toLowerCase() === key
      )
      return matched?.displayName.trim() ?? ''
    },
    [senderProfilesQuery.data]
  )

  const handleSenderEmailChange = useCallback(
    (value: string) => {
      form.setSenderEmail(value)
      if (!remote) return
      const displayName = resolveHarvestDisplayName(value)
      form.replaceSenderName(displayName)
    },
    [form.replaceSenderName, form.setSenderEmail, remote, resolveHarvestDisplayName]
  )

  const senderOptions = useMemo(() => {
    const fromApi = (senderProfilesQuery.data ?? []).map(profile => {
      const email = profile.senderKey.trim()
      // 발신 메일 필드는 주소만 표시. displayName은 「발신자명」필드 영역.
      return { label: email, value: email }
    })
    // edit: 기존 템플릿 From이 harvest에 없어도 표시용으로 유지
    // create: harvest에 없는 기본값을 orphan으로 넣지 않음 (BE NOT_HARVESTED 유도)
    if (
      mode === 'edit' &&
      form.senderEmail &&
      !fromApi.some(
        option =>
          option.value.toLowerCase() === form.senderEmail.trim().toLowerCase()
      )
    ) {
      return [{ label: form.senderEmail, value: form.senderEmail }, ...fromApi]
    }
    return fromApi
  }, [form.senderEmail, mode, senderProfilesQuery.data])

  useEffect(() => {
    if (!open || mode !== 'create') {
      didApplyDefaultSenderRef.current = false
      return
    }
    if (!remote || !senderProfilesReady || didApplyDefaultSenderRef.current) return
    didApplyDefaultSenderRef.current = true

    if (defaultHarvestKey) {
      form.setSenderEmail(defaultHarvestKey)
      form.replaceSenderName(resolveHarvestDisplayName(defaultHarvestKey))
      return
    }
    // harvest 0건이거나 기본 From 없음: FE 기본값 비움
    form.setSenderEmail('')
    form.replaceSenderName('')
  }, [
    defaultHarvestKey,
    form.replaceSenderName,
    form.setSenderEmail,
    mode,
    open,
    remote,
    resolveHarvestDisplayName,
    senderProfilesReady,
  ])

  /** Hub: 선택 From의 harvest displayName을 발신자명 SSOT로 반영 */
  useEffect(() => {
    if (!open || !remote || !senderProfilesReady) return
    const email = form.senderEmail.trim()
    if (!email) return
    const displayName = resolveHarvestDisplayName(email)
    if (!displayName) return
    if (form.senderNameSeed.trim() === displayName) return
    form.replaceSenderName(displayName)
  }, [
    form.replaceSenderName,
    form.senderEmail,
    form.senderNameSeed,
    open,
    remote,
    resolveHarvestDisplayName,
    senderProfilesReady,
  ])

  const handleSyncSenderProfiles = useCallback(async () => {
    if (!remote || syncSenderProfilesMutation.isPending) return
    try {
      await syncSenderProfilesMutation.mutateAsync()
      showAlert({
        title: '안내',
        content: '발신 프로필 동기화를 완료했습니다. 발신 메일을 다시 선택해 주세요.',
      })
    } catch (error) {
      showAlert({
        title: '연동 실패',
        content: getNotificationsApiErrorMessage(
          error,
          '발신 프로필 동기화에 실패했습니다. 다시 시도해 주세요.'
        ),
      })
    }
  }, [remote, showAlert, syncSenderProfilesMutation])

  const isEdit = mode === 'edit'
  const headerTitle = form.templateName.trim() || MAIL_TEMPLATE_NAME_PLACEHOLDER
  const [titleEditing, setTitleEditing] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitleEditing(mode === 'create')
  }, [open, mode])

  const handlePreview = () => {
    const draft = form.getDraft()
    setPreviewDraft({
      ...draft,
      attachments: form.getPreviewAttachments(),
      previewAt: new Date().toISOString(),
    })
    setPreviewOpen(true)
  }

  const handleSubmit = () => {
    if (remote && senderListEmpty) {
      showAlert({
        title: '안내',
        content: MAIL_SENDER_PROFILES_EMPTY_MESSAGE,
        confirmLabel: '발신 프로필 동기화',
        onConfirm: () => {
          void handleSyncSenderProfiles()
        },
      })
      return
    }
    const error = form.validateRequired(
      remote && harvestedSenderKeys.length > 0 ? { harvestedSenderKeys } : undefined
    )
    if (error) {
      showAlert({ title: '필수 입력 안내', content: error })
      return
    }
    onSubmit(form.getDraft())
  }

  const handleAttachmentAdd = useCallback(
    (files: File[]) => {
      const result = form.handleAttachmentAdd(files)
      if (!result.ok) {
        showAlert({ title: '안내', content: result.message })
      }
    },
    [form.handleAttachmentAdd, showAlert]
  )

  return (
    <>
      <TealHeaderModal
        open={open}
        onCancel={onClose}
        title={headerTitle}
        size="full"
        hideHeader
        className="mail-template-form-modal teal-header-modal--full"
      >
        <div className="mail-template-form-modal__shell">
          <header className="mail-template-form-modal__title-row">
            <div className="mail-template-form-modal__title-edit">
              <CmsInputIconClick
                value={form.templateName}
                editing={titleEditing}
                placeholder={MAIL_TEMPLATE_NAME_PLACEHOLDER}
                onChange={form.setTemplateName}
                onRequestEdit={() => setTitleEditing(true)}
                onCommitEdit={() => setTitleEditing(false)}
                inputAriaLabel={MAIL_TEMPLATE_NAME_PLACEHOLDER}
                editButtonAriaLabel="템플릿명 수정"
                containerClassName="mail-template-form-modal__title-edit-row"
                inputClassName="mail-template-form-modal__title-input mail-template-form-modal__title-input--editing"
                textClassName="mail-template-form-modal__title-text"
                editButtonClassName="mail-template-form-modal__title-edit-btn"
              />
            </div>
            <button
              type="button"
              className="mail-template-form-modal__title-close"
              onClick={onClose}
              aria-label="닫기"
            >
              <CloseOutlined />
            </button>
          </header>

          <div className="mail-template-form-modal__body">
            <div className="mail-template-form-modal__notice">
              <div className="mail-template-form-modal__notice-actions">
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
                      variant="secondary"
                      size="large"
                      width={140}
                      type="button"
                      disabled={submitting}
                      onClick={handlePreview}
                    >
                      미리보기
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
                      variant="secondary"
                      size="large"
                      width={140}
                      type="button"
                      disabled={submitting}
                      onClick={handlePreview}
                    >
                      미리보기
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
              </div>
            </div>

            <div className="mail-template-form-modal__layout">
              <div className="mail-template-form-modal__main">
                <section className="mail-template-form-modal__widget">
                  <div className="mail-template-form-modal__section-head">
                    <div className="mail-template-form-modal__section-title-row">
                      <h3 className="mail-template-form-modal__section-title">기본 설정</h3>
                      {remote && senderListEmpty ? (
                        <CmsButton
                          variant="secondary"
                          size="small"
                          type="button"
                          disabled={syncSenderProfilesMutation.isPending}
                          onClick={() => {
                            void handleSyncSenderProfiles()
                          }}
                        >
                          {syncSenderProfilesMutation.isPending
                            ? '동기화 중…'
                            : '발신 프로필 동기화'}
                        </CmsButton>
                      ) : null}
                    </div>
                    <p className="mail-template-form-modal__section-hint">
                      발신 메일은{' '}
                      <a
                        className="mail-template-form-modal__section-hint-link"
                        href={MAIL_NHN_SENDER_PROFILE_CONSOLE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        NHN Cloud의 [발신 정보 &gt; 발신 메일 관리] 메뉴
                      </a>
                      에서 사전 등록·동기화된 주소만 사용 가능합니다. 등록 시 기본값은{' '}
                      {MAIL_TEMPLATE_DEFAULT_SENDER_EMAIL} 입니다.
                      {remote
                        ? ` ${MAIL_SENDER_DISPLAY_NAME_READONLY_HINT}`
                        : ' 발신자명 미기재 시 수신자에게 메일 주소만 표시됩니다.'}
                      {senderListEmpty
                        ? ` ${MAIL_SENDER_PROFILES_EMPTY_MESSAGE}`
                        : null}
                      {defaultMissingFromHarvest
                        ? ` 기본 발신 메일(${MAIL_TEMPLATE_DEFAULT_SENDER_EMAIL})이 동기화 목록에 없습니다. NHN 등록 후 「발신 프로필 동기화」를 실행해 주세요.`
                        : null}
                    </p>
                  </div>
                  <BasicSettingsFields
                    templateName={form.templateName}
                    senderNameSeed={form.senderNameSeed}
                    senderNameEpoch={form.senderNameEpoch}
                    senderEmail={form.senderEmail}
                    senderOptions={senderOptions}
                    senderLoading={
                      senderProfilesQuery.isFetching || syncSenderProfilesMutation.isPending
                    }
                    senderNameReadOnly={remote}
                    senderEmailDisabled={Boolean(remote && senderListEmpty)}
                    onTemplateNameChange={form.setTemplateName}
                    onSenderNameChange={form.setSenderName}
                    onSenderEmailChange={handleSenderEmailChange}
                  />
                </section>

                <section className="mail-template-form-modal__widget">
                  <h3 className="mail-template-form-modal__section-title">템플릿 작성</h3>
                  <DetailInfoForm
                    title="템플릿 작성"
                    hideHeader
                    mode="edit"
                    className="mail-template-form-modal__compose"
                  >
                    <ComposeFields
                      editor={form.editor}
                      editorMinHeight={form.editorMinHeight}
                      subject={form.subject}
                      subjectMaxLength={form.subjectMaxLength}
                      subjectInputRef={form.subjectInputRef}
                      attachmentFileNames={form.attachmentFileNames}
                      onSubjectChange={form.handleSubjectChange}
                      onRememberSubjectRange={form.rememberSubjectRange}
                      onAttachmentAdd={handleAttachmentAdd}
                      onAttachmentRemove={form.handleAttachmentRemove}
                    />
                  </DetailInfoForm>
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

      <PreviewModal
        open={previewOpen}
        zIndex={1100}
        subject={previewDraft?.subject ?? ''}
        bodyHtml={previewDraft?.bodyHtml ?? ''}
        senderName={previewDraft?.senderName}
        senderEmail={previewDraft?.senderEmail}
        attachments={previewDraft?.attachments}
        previewAt={previewDraft?.previewAt}
        onClose={() => setPreviewOpen(false)}
      />
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
