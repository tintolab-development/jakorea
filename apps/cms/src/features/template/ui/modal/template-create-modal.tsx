import { useCallback, useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import { MESSAGES } from '@/shared/constants/messages'
import { duplicateWritingTemplate } from '@/features/template/api/duplicate-writing-template'
import { getWritingTemplateRowsByCategory } from '@/features/template/lib/writing-template-create-helpers'
import type {
  TemplateCreateKind,
  TemplateCreateSelection,
  WritingTemplateCategory,
} from '@/features/template/model/template-create.types'
import './template-create-modal.css'

export interface TemplateCreateModalProps {
  open: boolean
  onCancel: () => void
  onDirectRegister: (target: 'survey' | 'agreement' | 'horizontal_table') => void
  onDuplicateSuccess: (newTemplateId: string) => void
}

function resolveSelection(
  kind: TemplateCreateKind,
  selectValue: string | null
): TemplateCreateSelection | null {
  if (selectValue == null || selectValue === '') return null
  if (kind === 'direct') {
    if (
      selectValue === 'survey' ||
      selectValue === 'agreement' ||
      selectValue === 'horizontal_table'
    ) {
      return { source: 'direct', target: selectValue }
    }
    return null
  }
  if (kind === 'application' || kind === 'survey' || kind === 'agreement') {
    return { source: 'template', templateId: selectValue, category: kind }
  }
  return null
}

export function TemplateCreateModal({
  open,
  onCancel,
  onDirectRegister,
  onDuplicateSuccess,
}: TemplateCreateModalProps) {
  const [kind, setKind] = useState<TemplateCreateKind>('application')
  const [selectValue, setSelectValue] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setKind('application')
    setSelectValue(null)
    setSubmitting(false)
  }, [open])

  const selectOptions = useMemo(() => {
    if (kind === 'direct') {
      return [
        { label: '설문 양식', value: 'survey' as const },
        { label: '동의 양식', value: 'agreement' as const },
      ]
    }
    const category = kind as WritingTemplateCategory
    return getWritingTemplateRowsByCategory(category).map(row => ({
      label: row.templateName,
      value: row.id,
    }))
  }, [kind])

  const selection = useMemo(() => resolveSelection(kind, selectValue), [kind, selectValue])
  const canSubmit = selection != null

  const handleKindChange = (next: TemplateCreateKind) => {
    setKind(next)
    setSelectValue(null)
  }

  const handleCancel = useCallback(() => {
    onCancel()
  }, [onCancel])

  const handleRegister = useCallback(async () => {
    const resolved = resolveSelection(kind, selectValue)
    if (resolved == null) return

    if (resolved.source === 'direct') {
      onDirectRegister(resolved.target)
      return
    }

    setSubmitting(true)
    try {
      const { newTemplateId } = await duplicateWritingTemplate({
        sourceTemplateId: resolved.templateId,
        category: resolved.category,
      })
      message.success(MESSAGES.success.templateCopied)
      onDuplicateSuccess(newTemplateId)
    } catch {
      message.error('복제에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }, [kind, onDirectRegister, onDuplicateSuccess, selectValue])

  const footer = (
    <div className="template-create-modal__footer-inner">
      <CmsButton
        variant="secondary"
        size="large"
        type="button"
        onClick={handleCancel}
        disabled={submitting}
      >
        취소
      </CmsButton>
      <CmsButton
        variant="primary"
        size="large"
        type="button"
        disabled={!canSubmit || submitting}
        loading={submitting}
        onClick={() => {
          void handleRegister()
        }}
      >
        등록
      </CmsButton>
    </div>
  )

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="템플릿 신규 등록"
      width={600}
      footer={footer}
      className="template-create-modal"
      description={
        <div className="template-create-modal__description-block">
          <p>신규 템플릿을 등록하시겠습니까?</p>
          <p>등록하시려는 템플릿의 유형을 선택해 주세요.</p>
        </div>
      }
    >
      <div className="template-create-modal__field">
        <span className="template-create-modal__label">템플릿 유형</span>
        <CmsRadioGroup
          className="template-create-modal__radios"
          value={kind}
          onChange={e => handleKindChange(e.target.value as TemplateCreateKind)}
        >
          <CmsRadio value="application">신청 양식</CmsRadio>
          <CmsRadio value="survey">설문 양식</CmsRadio>
          <CmsRadio value="agreement">동의 양식</CmsRadio>
          <CmsRadio value="direct">직접 등록</CmsRadio>
        </CmsRadioGroup>
      </div>

      <CmsSelect
        width={'100%'}
        placeholder="기본 구조로 사용할 양식을 선택해 주세요"
        options={selectOptions}
        value={selectValue ?? undefined}
        onChange={v => setSelectValue(v ?? null)}
      />
    </ContentModal>
  )
}
