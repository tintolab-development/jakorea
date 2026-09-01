import { useCallback, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type {
  BoardMemberCreateInput,
  BoardRoleGroup,
} from '@/entities/board-members/model/types'
import {
  BOARD_ROLE_GROUP_LABELS,
  BOARD_ROLE_GROUP_ORDER,
} from '@/entities/board-members/model/types'
import {
  CmsButton,
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  CmsSelect,
  ContentModal,
  useCmsAlert,
} from '@/shared/ui'

import './board-member-form-modal.css'

function coerceRadioBoolean(raw: unknown): boolean {
  if (raw === true || raw === 1) return true
  if (raw === false || raw === 0) return false
  if (typeof raw === 'string') {
    const s = raw.toLowerCase()
    if (s === 'true' || s === '1') return true
    if (s === 'false' || s === '0') return false
  }
  return Boolean(raw)
}

const ROLE_OPTIONS = BOARD_ROLE_GROUP_ORDER.map(key => ({
  value: key,
  label: BOARD_ROLE_GROUP_LABELS[key],
}))

function BoardMemberFormBody({
  confirmLoading,
  onCancel,
  onSubmit,
}: {
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (values: BoardMemberCreateInput) => void
}) {
  const { showAlert } = useCmsAlert()
  const [isPublic, setIsPublic] = useState(true)
  const [roleGroup, setRoleGroup] = useState<BoardRoleGroup | undefined>(undefined)
  const [nameKo, setNameKo] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [position, setPosition] = useState('')
  const [affiliation, setAffiliation] = useState('')

  const handleSubmit = useCallback(() => {
    if (!roleGroup) {
      showAlert({
        title: '필수 항목 미입력',
        content: '이사회 직책을 선택해 주세요.',
      })
      return
    }
    if (!nameKo.trim()) {
      showAlert({
        title: '필수 항목 미입력',
        content: '한글 성명을 입력해 주세요.',
      })
      return
    }
    if (!nameEn.trim()) {
      showAlert({
        title: '필수 항목 미입력',
        content: '영문 성명을 입력해 주세요.',
      })
      return
    }
    if (!position.trim()) {
      showAlert({
        title: '필수 항목 미입력',
        content: '직위를 입력해 주세요.',
      })
      return
    }
    if (!affiliation.trim()) {
      showAlert({
        title: '필수 항목 미입력',
        content: '소속 및 직책을 입력해 주세요.',
      })
      return
    }
    onSubmit({
      roleGroup,
      isPublic,
      nameKo: nameKo.trim(),
      nameEn: nameEn.trim(),
      position: position.trim(),
      affiliation: affiliation.trim(),
    })
  }, [affiliation, isPublic, nameEn, nameKo, onSubmit, position, roleGroup, showAlert])

  return (
    <ContentModal
      open
      onCancel={onCancel}
      title="구성원 등록"
      width={800}
      className="board-member-form-modal"
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="large"
            type="button"
            onClick={onCancel}
            disabled={confirmLoading}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            loading={confirmLoading}
            disabled={confirmLoading}
            onClick={handleSubmit}
          >
            구성원 등록
          </CmsButton>
        </>
      }
    >
      <DetailInfoForm
        title="구성원 등록"
        hideHeader
        mode="edit"
        className="board-member-form-modal__form"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="공개 여부"
            required
            view={null}
            edit={
              <CmsRadioGroup
                value={isPublic}
                onChange={e => setIsPublic(coerceRadioBoolean(e.target.value))}
              >
                <CmsRadio value={true}>공개</CmsRadio>
                <CmsRadio value={false}>비공개</CmsRadio>
              </CmsRadioGroup>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="이사회 직책"
            required
            view={null}
            edit={
              <CmsSelect
                inputSize="large"
                width="100%"
                placeholder="이사회 직책을 선택하세요"
                options={ROLE_OPTIONS}
                value={roleGroup}
                onChange={value => setRoleGroup(value as BoardRoleGroup)}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="한글 성명"
            required
            view={null}
            edit={
              <CmsInput
                inputSize="large"
                width="100%"
                placeholder="한글 성명을 입력하세요"
                value={nameKo}
                onChange={e => setNameKo(e.target.value)}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="영문 성명"
            required
            view={null}
            edit={
              <CmsInput
                inputSize="large"
                width="100%"
                placeholder="영문 성명을 입력하세요"
                value={nameEn}
                onChange={e => setNameEn(e.target.value)}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="직위"
            required
            view={null}
            edit={
              <CmsInput
                inputSize="large"
                width="100%"
                placeholder="직위를 입력하세요"
                value={position}
                onChange={e => setPosition(e.target.value)}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="소속 및 직책"
            required
            view={null}
            edit={
              <CmsInput
                inputSize="large"
                width="100%"
                placeholder="소속 및 직책을 입력하세요"
                value={affiliation}
                onChange={e => setAffiliation(e.target.value)}
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ContentModal>
  )
}

export function BoardMemberFormModal({
  open,
  confirmLoading,
  onCancel,
  onSubmit,
}: {
  open: boolean
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (values: BoardMemberCreateInput) => void
}) {
  if (!open) return null

  return (
    <BoardMemberFormBody
      key={`create-${String(open)}`}
      confirmLoading={confirmLoading}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />
  )
}
