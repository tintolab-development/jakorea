/**
 * 봉사자 추가 등록 모달
 * 참여 봉사자 탭 > 봉사자 등록 — Figma Popup/Search/w600 (10014:41200)
 * 일반 프로그램 참여 봉사자 추가 등록 모달과 동일 ContentModal 레이아웃
 */

import { useEffect } from 'react'
import { Form } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, CmsSelect } from '@/shared/ui'
import { FieldSearchIcon } from '@/shared/ui/icons'
import type { UjatEducationProgressVolunteerMemberCandidate } from './types'
import './add-volunteer-modal.css'

type AddVolunteerModalFormValues = {
  memberId?: string
}

export interface UjatAddVolunteerModalProps {
  open: boolean
  onCancel: () => void
  memberOptions: UjatEducationProgressVolunteerMemberCandidate[]
  onNoMemberSelected: () => void
  onAdd: (memberId: string) => void
}

export function UjatAddVolunteerModal({
  open,
  onCancel,
  memberOptions,
  onNoMemberSelected,
  onAdd,
}: UjatAddVolunteerModalProps) {
  const [form] = Form.useForm<AddVolunteerModalFormValues>()

  useEffect(() => {
    if (!open) return
    form.resetFields()
  }, [open, form])

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  const handleSubmit = () => {
    const memberId = form.getFieldValue('memberId')
    if (!memberId) {
      onNoMemberSelected()
      return
    }
    onAdd(memberId)
    form.resetFields()
    onCancel()
  }

  const footer = (
    <>
      <CmsButton variant="secondary" size="large" onClick={handleCancel}>
        취소
      </CmsButton>
      <CmsButton variant="primary" size="large" onClick={handleSubmit}>
        추가 등록
      </CmsButton>
    </>
  )

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="봉사자 추가 등록"
      width={600}
      footer={footer}
      className="ujat-add-volunteer-modal"
      description={
        '프로그램에 추가할 봉사자를 선택해 주세요.\n등록된 회원 정보가 없는 경우, **[전체 회원]**에서 회원 정보를 먼저 등록해 주세요.'
      }
    >
      <div className="ujat-add-volunteer-modal__body">
        <Form<AddVolunteerModalFormValues>
          form={form}
          layout="vertical"
          className="ujat-add-volunteer-modal__form"
          requiredMark={false}
        >
          <Form.Item
            name="memberId"
            label={
              <span>
                봉사자 추가
                <span className="ujat-add-volunteer-modal__required" aria-hidden>
                  *
                </span>
              </span>
            }
            className="ujat-add-volunteer-modal__field"
          >
            <CmsSelect
              inputSize="large"
              width="100%"
              withAllOption={false}
              showSearch
              optionFilterProp="label"
              placeholder="추가 등록할 봉사자를 선택해 주세요"
              suffixIcon={
                <span className="cms-field__icon" aria-hidden>
                  <FieldSearchIcon />
                </span>
              }
              options={memberOptions.map(m => ({
                value: m.memberId,
                label: m.volunteerName,
              }))}
              notFoundContent={
                memberOptions.length === 0 ? '추가 등록 가능한 봉사자가 없습니다' : undefined
              }
              getPopupContainer={() => document.body}
            />
          </Form.Item>
        </Form>
      </div>
    </ContentModal>
  )
}
