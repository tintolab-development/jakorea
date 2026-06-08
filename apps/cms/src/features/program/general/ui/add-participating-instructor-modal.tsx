/**
 * 참여 강사 추가 등록 모달
 * 참여 강사 탭 > 강사 등록 — UJAT 봉사자 추가 등록 모달과 동일 ContentModal 레이아웃
 */

import { useEffect } from 'react'
import { Form } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, CmsSelect } from '@/shared/ui'
import type { ParticipatingInstructorMemberCandidate } from '@/features/program/general/lib/participating-instructor-member-candidates'
import './add-participating-instructor-modal.css'

type AddParticipatingInstructorModalFormValues = {
  memberId?: string
}

export interface AddParticipatingInstructorModalProps {
  open: boolean
  onCancel: () => void
  memberOptions: ParticipatingInstructorMemberCandidate[]
  onNoMemberSelected: () => void
  /** 강사 선택 후 추가 등록 클릭 시 — 개인정보 동의 모달로 진행 */
  onProceedToConsent: (memberId: string) => void
}

export function AddParticipatingInstructorModal({
  open,
  onCancel,
  memberOptions,
  onNoMemberSelected,
  onProceedToConsent,
}: AddParticipatingInstructorModalProps) {
  const [form] = Form.useForm<AddParticipatingInstructorModalFormValues>()

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
    onProceedToConsent(memberId)
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
      title="강사 추가 등록"
      width={560}
      footer={footer}
      className="add-participating-instructor-modal"
      description={
        '추가할 강사를 선택해 주세요.\n등록된 강사 정보가 없는 경우, **[강사 회원]**에서 강사 정보를 먼저 등록해 주세요.'
      }
    >
      <div className="add-participating-instructor-modal__body">
        <Form<AddParticipatingInstructorModalFormValues>
          form={form}
          layout="vertical"
          className="add-participating-instructor-modal__form"
          requiredMark={false}
        >
          <Form.Item
            name="memberId"
            label="강사 추가"
            className="add-participating-instructor-modal__field"
          >
            <CmsSelect
              inputSize="large"
              width="100%"
              withAllOption={false}
              placeholder="추가 등록할 강사를 선택해 주세요"
              options={memberOptions.map(member => ({
                value: member.memberId,
                label: member.instructorName,
              }))}
              notFoundContent={
                memberOptions.length === 0 ? '추가 등록 가능한 강사가 없습니다' : undefined
              }
              getPopupContainer={() => document.body}
            />
          </Form.Item>
        </Form>
      </div>
    </ContentModal>
  )
}
