import { useCallback, useEffect, useMemo } from 'react'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import type { TemplateRow } from '@/features/template/model/template.schema'
import { useWritingFormSections } from '@/features/template/hooks/use-writing-form-sections'
import { resolveAgreementWritingFormConfig } from '@/features/template/model/template-registry/agreement-template-config-registry'
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
}

export default function TemplateFormTab() {
  const { params, setParams } = useQueryParams<TemplateFormTabQuery>()
  const { sections: writingSections, isLoading: isWritingSectionsLoading } = useWritingFormSections()
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
      setParams(
        { mode: 'edit', id: row.id, type: undefined, userPreview: undefined },
        { replace: false }
      )
    },
    [setParams]
  )

  const handleCloseTemplatePreview = useCallback(() => {
    setParams({ mode: undefined, id: undefined, type: undefined, userPreview: undefined })
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
    })
  }, [params.mode, params.id, closeTemplatePreview, openTemplatePreview, writingSections])

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
    isPreviewOpen && registryEntry?.usesCrimeConsentModal === true

  const agreementWritingFormConfig = useMemo(
    () =>
      params.mode === 'edit' ? resolveAgreementWritingFormConfig(params.id) : null,
    [params.mode, params.id]
  )

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

  if (agreementWritingFormConfig != null) {
    return (
      <>
        {deleteConfirmModal}
        <AgreementWritingFormShell
          {...agreementWritingFormConfig}
          templateCode={params.id?.trim()}
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

      <CrimeRecordConsentDocumentFullpageModal
        open={isCrimeConsentDetail}
        onClose={handleCloseTemplatePreview}
      />

      <TemplatePreviewModal
        open={isPreviewOpen && !isCrimeConsentDetail && selectedTemplate != null}
        onClose={handleCloseTemplatePreview}
        title={resolvePreviewHeaderTitle(registryEntry, selectedTemplate?.templateName)}
        showDeleteButton={showDeleteButton}
        onDelete={requestDelete}
        deleteLoading={deleteLoading}
        registryEntry={registryEntry}
        templateId={templateId}
        templateName={selectedTemplate?.templateName}
        onTemplateDraftSaveConfirmed={handleCloseTemplatePreview}
        generic={genericModalState}
        previewControllerBase={previewControllerBase}
      />
    </>
  )
}
