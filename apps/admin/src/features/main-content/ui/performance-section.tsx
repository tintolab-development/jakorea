import { useCallback, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { PerformanceMetric, PerformanceSection } from '@/entities/main-content/model/types'
import { useSavePerformanceSection } from '@/features/main-content/api/hooks'
import { MetricsNestedTable } from '@/features/main-content/ui/nested-tables'
import { MainContentSectionCard } from '@/features/main-content/ui/section-card'
import { CmsInput, CmsTextArea, useCmsAlert } from '@/shared/ui'

type Props = {
  data: PerformanceSection
}

export function PerformanceSectionCard({ data }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSavePerformanceSection()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<PerformanceSection>(data)

  const handleEdit = useCallback(() => {
    setDraft({
      ...data,
      metrics: data.metrics.map(m => ({ ...m })),
    })
    setIsEditing(true)
  }, [data])

  const handleCancel = useCallback(() => {
    setDraft(data)
    setIsEditing(false)
  }, [data])

  const handleSave = useCallback(async () => {
    try {
      await saveMutation.mutateAsync(draft)
      setIsEditing(false)
    } catch {
      showAlert({
        title: '저장 실패',
        content: '실적 및 성과 저장에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [draft, saveMutation, showAlert])

  const updateMetric = useCallback(
    (id: PerformanceMetric['id'], patch: Partial<Pick<PerformanceMetric, 'value' | 'unit'>>) => {
      setDraft(prev => ({
        ...prev,
        metrics: prev.metrics.map(m => (m.id === id ? { ...m, ...patch } : m)),
      }))
    },
    []
  )

  const mode = isEditing ? 'edit' : 'view'
  const metrics = isEditing ? draft.metrics : data.metrics
  const titleText = isEditing ? draft.title : data.title
  const bottomText = isEditing ? draft.bottomText : data.bottomText

  const metricsTable = (
    <MetricsNestedTable metrics={metrics} mode={mode} onChangeMetric={updateMetric} />
  )

  return (
    <MainContentSectionCard
      title="실적 및 성과 관리"
      isEditing={isEditing}
      saving={saveMutation.isPending}
      onEdit={handleEdit}
      onCancel={handleCancel}
      onSave={() => {
        void handleSave()
      }}
    >
      <DetailInfoForm title="실적 및 성과 관리" hideHeader mode={mode}>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="타이틀 문구"
            view={titleText || '-'}
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                value={draft.title}
                onChange={e => setDraft(prev => ({ ...prev, title: e.target.value }))}
                placeholder="타이틀 문구를 입력하세요"
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="실적 및 성과" view={metricsTable} edit={metricsTable} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="하단 문구"
            view={<span className="main-content-preline">{bottomText || '-'}</span>}
            edit={
              <CmsTextArea
                className="cms-textarea--fixed-rows"
                inputSize="medium"
                width="100%"
                rows={2}
                value={draft.bottomText}
                onChange={e => setDraft(prev => ({ ...prev, bottomText: e.target.value }))}
                placeholder="하단 문구를 입력하세요"
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </MainContentSectionCard>
  )
}
