import { useEffect, useRef, useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ContentModal, CmsButton, CmsModal } from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import {
  CATEGORY_NAME_INVALID_TITLE,
  CATEGORY_NAME_RULE_MESSAGE,
  isValidCategoryName,
  sanitizeCategoryNameInput,
} from './category-name'
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
  const [invalidNameOpen, setInvalidNameOpen] = useState(false)
  const composingRef = useRef(false)
  const viewRef = useRef({ mode, parentName, initialName })

  if (open) {
    viewRef.current = { mode, parentName, initialName }
  }

  const view = viewRef.current

  useEffect(() => {
    if (open) {
      setName(initialName)
      setInvalidNameOpen(false)
    }
  }, [open, initialName])

  const trimmed = name.trim()
  const canSubmit = Boolean(trimmed)
  const title = view.mode === 'add' ? '카테고리 추가' : '카테고리 수정'

  const applyName = (raw: string) => {
    setName(sanitizeCategoryNameInput(raw))
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    if (!isValidCategoryName(trimmed)) {
      setInvalidNameOpen(true)
      return
    }
    onSubmit(trimmed)
  }

  const parentInput = (
    <CmsInput inputSize="small" width="100%" value={view.parentName} disabled />
  )

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onCancel}
        title={title}
        description={CATEGORY_NAME_RULE_MESSAGE}
        size="compact"
        className="category-name-modal"
        footer={
          <>
            <CmsButton variant="secondary" size="h40" type="button" onClick={onCancel}>
              취소
            </CmsButton>
            <CmsButton
              variant="primary"
              size="h40"
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit} >
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
                  required
                  view={parentInput}
                  edit={parentInput}
                />
              </DetailInfoForm.Row>
            ) : null}
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="카테고리명"
                required
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
                    onPressEnter={handleSubmit}
                  />
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        </div>
      </ContentModal>
      <CmsModal
        open={invalidNameOpen}
        onClose={() => setInvalidNameOpen(false)}
        title={CATEGORY_NAME_INVALID_TITLE}
        content={CATEGORY_NAME_RULE_MESSAGE}
        buttons={[
          { label: '확인', onClick: () => setInvalidNameOpen(false), variant: 'secondary' },
        ]}
      />
    </>
  )
}
