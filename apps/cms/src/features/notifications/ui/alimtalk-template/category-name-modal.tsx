import { useEffect, useRef, useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import { isValidCategoryName, sanitizeCategoryNameInput } from './category-name'
import './category-name-modal.css'

type CategoryNameModalProps = {
  open: boolean
  mode: 'add' | 'edit'
  parentName?: string
  initialName: string
  onCancel: () => void
  onSubmit: (name: string) => void
}

export function CategoryNameModal({
  open,
  mode,
  parentName = 'Category',
  initialName,
  onCancel,
  onSubmit,
}: CategoryNameModalProps) {
  const [name, setName] = useState(initialName)
  const composingRef = useRef(false)
  const viewRef = useRef({ mode, parentName, initialName })

  if (open) {
    viewRef.current = { mode, parentName, initialName }
  }

  const view = viewRef.current

  useEffect(() => {
    if (open) setName(initialName)
  }, [open, initialName])

  const trimmed = name.trim()
  const restrictCharset = view.mode === 'add'
  const canSubmit = restrictCharset ? isValidCategoryName(trimmed) : Boolean(trimmed)
  const title = view.mode === 'add' ? '카테고리 추가' : '카테고리 수정'

  const applyName = (raw: string) => {
    setName(restrictCharset ? sanitizeCategoryNameInput(raw) : raw)
  }

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={title}
      description="카테고리명에는 한글, 영문 대소문자, 숫자, _, -만 입력 가능합니다."
      size="compact"
      footer={
        <>
          <CmsButton variant="secondary" size="h40" width={120} type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="h40"
            width={120}
            type="button"
            disabled={!canSubmit}
            onClick={() => onSubmit(trimmed)}
          >
            {view.mode === 'add' ? '카테고리 추가' : '수정'}
          </CmsButton>
        </>
      }
    >
      <div className="category-name-modal__content">
        <DetailInfoForm title="카테고리 정보" hideHeader mode="edit">
          {view.mode === 'add' ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="상위 카테고리"
                readOnlyDisplay
                view={<CmsInput inputSize="small" width="100%" value={view.parentName} disabled />}
              />
            </DetailInfoForm.Row>
          ) : null}
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="카테고리명"
              view={null}
              edit={
                <CmsInput
                  inputSize="small"
                  width="100%"
                  value={name}
                  placeholder="카테고리명을 입력해 주세요"
                  onCompositionStart={() => {
                    composingRef.current = true
                  }}
                  onCompositionEnd={event => {
                    composingRef.current = false
                    applyName(event.currentTarget.value)
                  }}
                  onChange={event => {
                    const next = event.target.value
                    if (composingRef.current) {
                      setName(next)
                      return
                    }
                    applyName(next)
                  }}
                  onPressEnter={() => {
                    if (canSubmit) onSubmit(trimmed)
                  }}
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </ContentModal>
  )
}
