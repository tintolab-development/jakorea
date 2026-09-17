import { useCallback, useEffect, useMemo } from 'react'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import type { TemplateRow } from '@/features/template/model/template.schema'
import { useWritingFormSections } from '@/features/template/hooks/use-writing-form-sections'
import {
  resolveAgreementWritingFormConfig,
  createDirectAgreementWritingFormConfig,
  stripAgreementWritingFormStructureLocks,
} from '@/features/template/model/template-registry/agreement-template-config-registry'
import {
  isDuplicateWritingTemplateCode,
  isUserCreatedWritingFormTemplateRow,
  isWritingFormTemplateStructureLocked,
} from '@/features/template/lib/form-template-delete-policy'
import {
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
} from '@/features/template/model/template-registry/template-registry'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import {
  buildRightNavigationConfig,
  buildTemplateConfig,
} from '@/features/template/lib/build-template-config'
import { useTemplateModal } from '@/features/template/hooks/use-template-modal'
import { useFormTemplateDeleteAction } from '@/features/template/hooks/use-form-template-delete-action'
import { useWritingUserPreviewUrlAuxiliarySync } from '@/features/template/hooks/use-writing-user-preview-url-auxiliary-sync'
import { TemplateListCard } from '@/features/template/ui/template-management/template-list-card'
import { TemplateTable } from '@/features/template/ui/template-management/template-table'
import { TemplatePreviewModal } from '@/features/template/ui/template-management/template-preview-modal'
import { CrimeRecordConsentDocumentFullpageModal } from '@/features/template/ui/template-management/crime-record-consent-document-fullpage-modal'
import {
  AgreementWritingFormShell,
} from '@/features/template/ui/form-set/editors/new-agreement-form'
import NewAgreementForm from '@/features/template/ui/form-set/editors/new-agreement-form'
import NewHorizontalTableForm from '@/features/template/ui/form-set/editors/new-horizontal-table-form'
import NewSurveyForm from '@/features/template/ui/form-set/editors/new-survey-form'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import './template-form-tab.css'

type TemplateFormTabQuery = {
  mode?: string
  type?: string
  id?: string
  userPreview?: string
  /** 신규 등록(복제·직접) 직후 편집 — catalog code여도 단락 편집 허용 */
  userTemplate?: string
}

export default function TemplateFormTab() {
  const { params, setParams } = useQueryParams<TemplateFormTabQuery>()
  const {
    sections: writingSections,
    isLoading: isWritingSectionsLoading,
    isMockCatalog,
    isError: isWritingSectionsError,
  } = useWritingFormSections()
  const isPreviewOpen = params.mode === 'edit'
  const { closeWritingUserPreview, isWritingUserPreviewOpen } = useTemplateWritingPreview()

  const buildBaseLeftContentConfig = useCallback(
    (selectedTemplate: Parameters<typeof buildTemplateConfig>[0]['selectedTemplate']) =>
      buildTemplateConfig({
        selectedTemplate,
        orderedLeftContentConfig: [],
      }).baseLeftContentConfig,
    []
  )

  const {
    selectedTemplate,
    orderedLeftContentConfig,
    activeCardId,
    setActiveCardId,
    openTemplatePreview,
    closeTemplatePreview,
    applyOrderedCards,
  } = useTemplateModal({
    buildBaseLeftContentConfig,
  })

  const templateId = selectedTemplate?.id
  const registryEntry = useMemo(() => lookupTemplateRegistry(templateId), [templateId])

  const handleOpenTemplatePreview = useCallback(
    (row: TemplateRow) => {
      const userEditable = isUserCreatedWritingFormTemplateRow(row)
      setParams(
        {
          mode: 'edit',
          id: row.id,
          type: undefined,
          userPreview: undefined,
          userTemplate: userEditable ? '1' : undefined,
        },
        { replace: false }
      )
    },
    [setParams]
  )

  const handleCloseTemplatePreview = useCallback(() => {
    setParams({
      mode: undefined,
      id: undefined,
      type: undefined,
      userPreview: undefined,
      userTemplate: undefined,
    })
  }, [setParams])

  useEffect(() => {
    if (params.mode !== 'edit' || params.id == null || params.id === '') {
      closeTemplatePreview()
      return
    }
    const normalizedId = params.id.trim()
    const row = findWritingTemplateRowByDefinitionId(normalizedId, writingSections)
    if (row) {
      openTemplatePreview(row)
      return
    }
    // 신규 create/copy 직후 목록 반영 전에도 에디터 진입 가능하도록 임시 row 사용
    openTemplatePreview({
      id: normalizedId,
      templateName: normalizedId,
      variant: 'default',
      key: `pending-${normalizedId}`,
      no: 0,
      creator: '-',
      createdAt: '-',
      updatedAt: '-',
      systemTemplate:
        params.userTemplate === '1' ||
        isDuplicateWritingTemplateCode(normalizedId) ||
        isUserCreatedWritingFormTemplateRow({
          id: normalizedId,
          creator: params.userTemplate === '1' ? '사용자 생성' : undefined,
        })
          ? false
          : undefined,
    })
  }, [
    params.mode,
    params.id,
    params.userTemplate,
    closeTemplatePreview,
    openTemplatePreview,
    writingSections,
  ])

  const rightNavigationConfig = useMemo(
    () => buildRightNavigationConfig(orderedLeftContentConfig),
    [orderedLeftContentConfig]
  )

  const {
    showDeleteButton,
    deleteLoading,
    requestDelete,
    deleteConfirmModal,
  } = useFormTemplateDeleteAction({
    templateRow: selectedTemplate,
    onDeleted: handleCloseTemplatePreview,
  })

  const genericModalState = useMemo(
    () => ({
      orderedLeftContentConfig,
      activeCardId,
      setActiveCardId,
      applyOrderedCards,
      rightNavigationConfig,
    }),
    [
      orderedLeftContentConfig,
      activeCardId,
      setActiveCardId,
      applyOrderedCards,
      rightNavigationConfig,
    ]
  )

  const previewControllerBase = useMemo(
    () => ({
      params,
      setParams,
      isPreviewOpen,
      selectedTemplate,
      registryEntry,
      isWritingUserPreviewOpen,
    }),
    [params, setParams, isPreviewOpen, selectedTemplate, registryEntry, isWritingUserPreviewOpen]
  )

  const isCrimeConsentDetail =
    isPreviewOpen &&
    lookupTemplateRegistry(params.id?.trim() || templateId)?.usesCrimeConsentModal === true

  const forceUserEditable = useMemo(() => {
    if (params.userTemplate === '1') return true
    const templateCode = params.id?.trim()
    if (templateCode != null && templateCode !== '') {
      if (isDuplicateWritingTemplateCode(templateCode)) return true
      const row =
        selectedTemplate?.id === templateCode
          ? selectedTemplate
          : findWritingTemplateRowByDefinitionId(templateCode, writingSections)
      if (isUserCreatedWritingFormTemplateRow(row)) return true
    }
    return isUserCreatedWritingFormTemplateRow(selectedTemplate ?? null)
  }, [params.userTemplate, params.id, selectedTemplate, writingSections])

  const agreementWritingFormConfig = useMemo(() => {
    if (params.mode !== 'edit' || params.id == null || params.id.trim() === '') return null
    const templateCode = params.id.trim()
    // 성범죄 동의서는 정적 문서 모달 전용 — 동의 셸/직접등록 fallback 금지
    if (lookupTemplateRegistry(templateCode)?.usesCrimeConsentModal === true) return null

    const row =
      selectedTemplate?.id === templateCode
        ? selectedTemplate
        : findWritingTemplateRowByDefinitionId(templateCode, writingSections)
    const isAgreementCategory =
      params.type === 'agreement' ||
      writingSections.some(
        section =>
          section.key === 'agreement' && section.rows.some(r => r.id === templateCode)
      )

    const catalog = resolveAgreementWritingFormConfig(templateCode)
    const raw =
      catalog ??
      (isAgreementCategory
        ? createDirectAgreementWritingFormConfig(row?.templateName ?? '동의 양식 신규 폼')
        : null)
    if (raw == null) return null

    const locked = isWritingFormTemplateStructureLocked({
      templateCode,
      systemTemplate: row?.systemTemplate,
      forceUserEditable,
    })
    return locked ? raw : stripAgreementWritingFormStructureLocks(raw)
  }, [
    forceUserEditable,
    params.id,
    params.mode,
    params.type,
    selectedTemplate,
    writingSections,
  ])

  const suppressInactiveUserPreviewStrip = useMemo(() => {
    if (params.mode !== 'edit' || params.id == null || params.id.trim() === '') return false
    const entry = lookupTemplateRegistry(params.id.trim())
    return entry?.suppressUserPreviewStrip === true
  }, [params.mode, params.id])

  useWritingUserPreviewUrlAuxiliarySync(
    params,
    setParams,
    isWritingUserPreviewOpen,
    closeWritingUserPreview,
    { suppressInactiveUserPreviewStrip }
  )

  if (params.mode === 'new' && params.type === 'survey') {
    return <NewSurveyForm />
  }
  if (params.mode === 'new' && params.type === 'agreement') {
    return <NewAgreementForm />
  }
  if (params.mode === 'new' && params.type === 'horizontal_table') {
    return <NewHorizontalTableForm />
  }

  if (isCrimeConsentDetail) {
    return (
      <>
        {deleteConfirmModal}
        <CrimeRecordConsentDocumentFullpageModal
          open
          onClose={handleCloseTemplatePreview}
        />
      </>
    )
  }

  if (agreementWritingFormConfig != null) {
    return (
      <>
        {deleteConfirmModal}
        <AgreementWritingFormShell
          {...agreementWritingFormConfig}
          templateCode={params.id?.trim()}
          systemTemplate={
            forceUserEditable && selectedTemplate?.systemTemplate !== true
              ? false
              : selectedTemplate?.systemTemplate
          }
          forceUserEditable={forceUserEditable}
          onTemplateDraftSaveConfirmed={handleCloseTemplatePreview}
          onClose={handleCloseTemplatePreview}
          showDeleteButton={showDeleteButton}
          onDelete={requestDelete}
          deleteLoading={deleteLoading}
        />
      </>
    )
  }

  return (
    <>
      {deleteConfirmModal}
      <div className="template-form-tab__content">
        {isMockCatalog ? (
          <p className="template-form-tab__catalog-notice" role="status">
            mock 카탈로그 — 백엔드 API가 연결되지 않아 FE 시드 목록을 표시합니다.
          </p>
        ) : null}
        {isWritingSectionsError ? (
          <p className="template-form-tab__catalog-error" role="alert">
            작성 양식 목록을 불러오지 못했습니다. 네트워크·권한을 확인한 뒤 새로고침해 주세요.
          </p>
        ) : null}
        {isWritingSectionsLoading ? (
          <p className="template-form-tab__loading">양식 목록을 불러오는 중입니다.</p>
        ) : (
          writingSections.map(section => (
            <TemplateListCard
              key={section.key}
              title={section.title}
              description={section.description}
            >
              <TemplateTable rows={section.rows} onPreview={handleOpenTemplatePreview} />
            </TemplateListCard>
          ))
        )}
      </div>

      <TemplatePreviewModal
        open={isPreviewOpen && selectedTemplate != null}
        onClose={handleCloseTemplatePreview}
        title={resolvePreviewHeaderTitle(registryEntry, selectedTemplate?.templateName)}
        showDeleteButton={showDeleteButton}
        onDelete={requestDelete}
        deleteLoading={deleteLoading}
        registryEntry={registryEntry}
        templateId={templateId}
        templateName={selectedTemplate?.templateName}
        systemTemplate={selectedTemplate?.systemTemplate}
        forceUserEditable={forceUserEditable}
        onTemplateDraftSaveConfirmed={handleCloseTemplatePreview}
        generic={genericModalState}
        previewControllerBase={previewControllerBase}
      />
    </>
  )
}
