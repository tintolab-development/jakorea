import { useCallback, useMemo, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { ImpactStoryOption, ImpactStorySection } from '@/entities/main-content/model/types'
import { useSaveImpactStorySection } from '@/features/main-content/api/hooks'
import {
  mainContentSaveFailureAlert,
  readMainContentFieldErrors,
} from '@/features/main-content/lib/mutation-failure-alert'
import {
  hasFieldErrors,
  MAIN_CONTENT_LIMITS,
  type MainContentFieldErrors,
  validateImpactStorySection,
} from '@/features/main-content/lib/validate'
import { MainContentFieldControl } from '@/features/main-content/ui/field-control'
import { MainContentSectionCard } from '@/features/main-content/ui/section-card'
import { CmsInput, CmsSelect, CmsTextArea, useCmsAlert } from '@/shared/ui'

type Props = {
  data: ImpactStorySection
  options: ImpactStoryOption[]
}

export function ImpactStorySectionCard({ data, options }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveImpactStorySection()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<ImpactStorySection>(data)
  const [fieldErrors, setFieldErrors] = useState<MainContentFieldErrors>({})

  const selectOptions = useMemo(
    () => options.map(opt => ({ value: opt.id, label: opt.title })),
    [options],
  )
  const optionIds = useMemo(() => options.map(opt => opt.id), [options])

  const featuredId = isEditing ? draft.featuredContentId : data.featuredContentId
  const featuredTitle = useMemo(() => {
    return options.find(opt => opt.id === featuredId)?.title ?? '-'
  }, [featuredId, options])

  const handleEdit = useCallback(() => {
    setDraft(data)
    setFieldErrors({})
    setIsEditing(true)
  }, [data])

  const handleCancel = useCallback(() => {
    setDraft(data)
    setFieldErrors({})
    setIsEditing(false)
  }, [data])

  const handleSave = useCallback(async () => {
    const invalid = validateImpactStorySection(draft, optionIds)
    if (hasFieldErrors(invalid)) {
      setFieldErrors(invalid)
      return
    }
    try {
      await saveMutation.mutateAsync(draft)
      setFieldErrors({})
      setIsEditing(false)
    } catch (error) {
      const mapped = readMainContentFieldErrors(error)
      if (mapped) {
        setFieldErrors(mapped)
        return
      }
      showAlert(mainContentSaveFailureAlert(error, '임팩트 스토리'))
    }
  }, [draft, optionIds, saveMutation, showAlert])

  const mode = isEditing ? 'edit' : 'view'
  const titleText = isEditing ? draft.title : data.title
  const youtubeUrl = isEditing ? draft.youtubeUrl : data.youtubeUrl

  return (
    <MainContentSectionCard
      title="임팩트 스토리 관리"
      isEditing={isEditing}
      saving={saveMutation.isPending}
      onEdit={handleEdit}
      onCancel={handleCancel}
      onSave={() => {
        void handleSave()
      }}
    >
      <DetailInfoForm title="임팩트 스토리 관리" hideHeader mode={mode}>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="타이틀 텍스트"
            required
            view={<span className="main-content-preline">{titleText || '-'}</span>}
            edit={
              <MainContentFieldControl error={fieldErrors.title}>
                <CmsTextArea
                  className="cms-textarea--fixed-rows"
                  inputSize="medium"
                  width="100%"
                  rows={2}
                  maxLength={MAIN_CONTENT_LIMITS.impactTitle}
                  status={fieldErrors.title ? 'error' : undefined}
                  value={draft.title}
                  onChange={e => {
                    setFieldErrors(prev => ({ ...prev, title: '' }))
                    setDraft(prev => ({ ...prev, title: e.target.value }))
                  }}
                  placeholder="타이틀 텍스트를 입력해 주세요"
                />
              </MainContentFieldControl>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="메인 영상 유튜브 링크"
            required
            view={youtubeUrl || '-'}
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                value={draft.youtubeUrl}
                maxLength={MAIN_CONTENT_LIMITS.youtubeUrl}
                error={Boolean(fieldErrors.youtubeUrl)}
                message={fieldErrors.youtubeUrl}
                onChange={e => {
                  setFieldErrors(prev => ({ ...prev, youtubeUrl: '' }))
                  setDraft(prev => ({ ...prev, youtubeUrl: e.target.value }))
                }}
                placeholder="유튜브 링크를 입력하세요"
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="대표 콘텐츠 설정"
            required
            view={featuredTitle}
            edit={
              <CmsSelect
                inputSize="medium"
                width="100%"
                withAllOption={false}
                options={selectOptions}
                value={draft.featuredContentId}
                error={Boolean(fieldErrors.featuredStoryId)}
                message={fieldErrors.featuredStoryId}
                onChange={value => {
                  setFieldErrors(prev => ({ ...prev, featuredStoryId: '' }))
                  setDraft(prev => ({
                    ...prev,
                    featuredContentId: String(value ?? ''),
                  }))
                }}
                placeholder="대표 콘텐츠를 선택하세요"
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </MainContentSectionCard>
  )
}
