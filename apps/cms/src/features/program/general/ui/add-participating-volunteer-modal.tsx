/**
 * 참여 봉사자 추가 등록 모달
 * 참여 봉사자 탭 > 봉사자 등록 — 참여 강사 추가 등록 모달과 동일 ContentModal 레이아웃
 */

import { useEffect } from 'react'
import { Form } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, CmsSelect } from '@/shared/ui'
import { FieldSearchIcon } from '@/shared/ui/icons'
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
  /** 봉사자 선택 후 추가 등록 클릭 시 — 신청 폼 모달로 진행 */
  onProceedToRegistration: (memberId: string) => void
}

export function AddParticipatingVolunteerModal({
  open,
  onCancel,
  memberOptions,
  onNoMemberSelected,
  onProceedToRegistration,
}: AddParticipatingVolunteerModalProps) {
  const [form] = Form.useForm<AddParticipatingVolunteerModalFormValues>()

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
    onProceedToRegistration(memberId)
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
      className="add-participating-volunteer-modal"
      description={
        '프로그램에 추가할 봉사자를 선택해 주세요.\n등록된 회원 정보가 없는 경우, **[전체 회원]**에서 회원 정보를 먼저 등록해 주세요.'
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
            label={
              <span>
                봉사자 추가
                <span className="add-participating-volunteer-modal__required" aria-hidden>
                  *
                </span>
              </span>
            }
            className="add-participating-volunteer-modal__field"
          >
            <CmsSelect
              inputSize="large"
              width="100%"
              withAllOption={false}
              showSearch
              optionFilterProp="label"
              placeholder="추가 등록할 봉사자를 선택해 주세요"
              className="add-participating-volunteer-modal__member-select"
              prefix={
                <span className="cms-field__icon" aria-hidden>
                  <FieldSearchIcon />
                </span>
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
