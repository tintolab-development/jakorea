import { useEffect, useRef, useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
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
  const viewRef = useRef({ mode, parentName, initialName })

  if (open) {
    viewRef.current = { mode, parentName, initialName }
  }

  const view = viewRef.current

  useEffect(() => {
    if (open) setName(initialName)
  }, [open, initialName])

  const trimmed = name.trim()
  const title = view.mode === 'add' ? '카테고리 추가' : '카테고리 수정'

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={title}
      size="compact"
      className={['category-name-modal', view.mode === 'add' ? 'category-name-modal--add' : ''].filter(Boolean).join(' ')}
      footer={
        <>
          <CmsButton variant="secondary" size="large" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            className={view.mode === 'add' ? 'cms-button--footer-auto' : undefined}
            disabled={!trimmed}
            onClick={() => onSubmit(trimmed)}
          >
            {view.mode === 'add' ? '카테고리 추가' : '수정'}
          </CmsButton>
        </>
      }
    >
      <DetailInfoForm title="카테고리 정보" hideHeader mode="edit">
        {view.mode === 'add' ? (
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="상위 카테고리"
              readOnlyDisplay
              view={
                <CmsInput
                  inputSize="large"
                  width="100%"
                  value={view.parentName}
                  disabled
                />
              }
            />
          </DetailInfoForm.Row>
        ) : null}
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="카테고리명"
            view={null}
            edit={
              <CmsInput
                inputSize="large"
                width="100%"
                value={name}
                placeholder="카테고리명을 입력해 주세요"
                onChange={event => setName(event.target.value)}
                onPressEnter={() => {
                  if (trimmed) onSubmit(trimmed)
                }}
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ContentModal>
  )
}
