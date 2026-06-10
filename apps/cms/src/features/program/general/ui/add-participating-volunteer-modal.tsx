/**
 * 참여 봉사자 추가 등록 모달
 * 참여 봉사자 탭 > 봉사자 등록 — 참여 강사 추가 등록 모달과 동일 ContentModal 레이아웃
 */

import { useEffect } from 'react'
import { Form } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, CmsSelect } from '@/shared/ui'
import type { ParticipatingVolunteerMemberCandidate } from '@/features/program/general/lib/participating-volunteer-member-candidates'
import './add-participating-volunteer-modal.css'

type AddParticipatingVolunteerModalFormValues = {
  memberId?: string
}

export interface AddParticipatingVolunteerModalProps {
  open: boolean
  onCancel: () => void
  memberOptions: ParticipatingVolunteerMemberCandidate[]
  onNoMemberSelected: () => void
  onAdd: (memberId: string) => void
  /** 모달 제목·필드 라벨 분기 (임직원 자원봉사자 등록) */
  variant?: 'volunteer' | 'employee'
}

export function AddParticipatingVolunteerModal({
  open,
  onCancel,
  memberOptions,
  onNoMemberSelected,
  onAdd,
  variant = 'volunteer',
}: AddParticipatingVolunteerModalProps) {
  const [form] = Form.useForm<AddParticipatingVolunteerModalFormValues>()
  const isEmployee = variant === 'employee'

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
      title={isEmployee ? '임직원 자원봉사자 추가 등록' : '봉사자 추가 등록'}
      width={560}
      footer={footer}
      className="add-participating-volunteer-modal"
      description={
        isEmployee
          ? '추가할 임직원 회원을 선택해 주세요.\n등록된 회원 정보가 없는 경우, **[회원 관리]**에서 회원 정보를 먼저 등록해 주세요.'
          : '추가할 회원을 선택해 주세요.\n등록된 회원 정보가 없는 경우, **[회원 관리]**에서 회원 정보를 먼저 등록해 주세요.'
      }
    >
      <div className="add-participating-volunteer-modal__body">
        <Form<AddParticipatingVolunteerModalFormValues>
          form={form}
          layout="vertical"
          className="add-participating-volunteer-modal__form"
          requiredMark={false}
        >
          <Form.Item
            name="memberId"
            label={isEmployee ? '임직원 자원봉사자 추가' : '봉사자 추가'}
            className="add-participating-volunteer-modal__field"
          >
            <CmsSelect
              inputSize="large"
              width="100%"
              withAllOption={false}
              placeholder={
                isEmployee
                  ? '추가 등록할 임직원을 선택해 주세요'
                  : '추가 등록할 봉사자를 선택해 주세요'
              }
              options={memberOptions.map(member => ({
                value: member.memberId,
                label: member.volunteerName,
              }))}
              notFoundContent={
                memberOptions.length === 0 ? '추가 등록 가능한 회원이 없습니다' : undefined
              }
              getPopupContainer={() => document.body}
            />
          </Form.Item>
        </Form>
      </div>
    </ContentModal>
  )
}
