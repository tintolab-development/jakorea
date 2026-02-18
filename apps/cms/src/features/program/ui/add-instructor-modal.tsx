/**
 * 강사진 추가 모달
 * 프로그램 진행 현황 > 강사 정보 탭에서 "강사 추가" 클릭 시 노출
 * 재사용 TealHeaderModal 사용, 800×320 스펙, 필드 순서: 강사명·연락처 | 이메일·학교 배정
 */

import { useEffect } from 'react'
import { Form, Input, Select } from 'antd'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { AppButton } from '@/shared/ui/app-button'
import type {
  ParticipatingInstructorRow,
  SettlementStatusKey,
} from '@/data/mock/participating-instructors'
import { INSTRUCTOR_SCHOOL_OPTIONS } from '@/data/mock/participating-instructors'
import './add-instructor-modal.css'

const SCHOOL_OPTIONS = INSTRUCTOR_SCHOOL_OPTIONS.map(name => ({ label: name, value: name }))

export interface AddInstructorFormValues {
  instructorName: string
  email: string
  contact: string
  schoolName?: string
}

interface AddInstructorModalProps {
  open: boolean
  onCancel: () => void
  onAdd: (values: AddInstructorFormValues) => void
}

export function AddInstructorModal({ open, onCancel, onAdd }: AddInstructorModalProps) {
  const [form] = Form.useForm<AddInstructorFormValues>()

  useEffect(() => {
    if (open) {
      form.resetFields()
    }
  }, [open, form])

  const handleSubmit = (values: AddInstructorFormValues) => {
    onAdd({
      instructorName: values.instructorName.trim(),
      email: values.email.trim(),
      contact: values.contact.trim(),
      schoolName: values.schoolName,
    })
    form.resetFields()
    onCancel()
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  const footer = (
    <>
      <AppButton variant="cancel" size="large" onClick={handleCancel}>
        취소
      </AppButton>
      <AppButton variant="primary" size="large" modalTeal onClick={() => form.submit()}>
        추가
      </AppButton>
    </>
  )

  return (
    <TealHeaderModal
      open={open}
      onCancel={handleCancel}
      title="강사진 추가"
      footer={footer}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        className="add-instructor-modal__form"
        onFinish={handleSubmit}
        initialValues={{ instructorName: '', email: '', contact: '', schoolName: undefined }}
        requiredMark={(labelNode, { required }) =>
          required ? (
            <>
              {labelNode}
              <span className="add-instructor-modal__required-asterisk" aria-hidden>
                {' '}
                *
              </span>
            </>
          ) : (
            labelNode
          )
        }
      >
        <div className="add-instructor-modal__fields">
          <div className="add-instructor-modal__row">
            <Form.Item
              name="instructorName"
              label="강사명"
              rules={[{ required: true, message: '강사명을 입력해주세요' }]}
              className="add-instructor-modal__field"
            >
              <Input placeholder="강사명을 입력하세요" size="large" allowClear />
            </Form.Item>
            <Form.Item
              name="contact"
              label="연락처"
              rules={[{ required: true, message: '연락처를 입력해주세요' }]}
              className="add-instructor-modal__field"
            >
              <Input placeholder="강사의 연락처를 입력하세요" size="large" allowClear />
            </Form.Item>
          </div>
          <div className="add-instructor-modal__row">
            <Form.Item
              name="email"
              label="이메일"
              rules={[
                { required: true, message: '이메일을 입력해주세요' },
                { type: 'email', message: '올바른 이메일 형식이 아닙니다' },
              ]}
              className="add-instructor-modal__field"
            >
              <Input placeholder="강사의 이메일을 입력하세요" size="large" allowClear />
            </Form.Item>
            <Form.Item name="schoolName" label="학교 배정" className="add-instructor-modal__field">
              <Select
                placeholder="배정할 학교를 선택해주세요"
                size="large"
                allowClear
                options={SCHOOL_OPTIONS}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          </div>
        </div>
      </Form>
    </TealHeaderModal>
  )
}

/** 폼 값으로 새 참여 강사 행 생성 (목록 추가용) */
export function buildInstructorRowFromForm(
  values: AddInstructorFormValues,
  nextNo: number,
  nextId: string
): ParticipatingInstructorRow {
  return {
    id: nextId,
    no: nextNo,
    instructorName: values.instructorName,
    schoolName: values.schoolName ?? INSTRUCTOR_SCHOOL_OPTIONS[0],
    educationGrade: '1학년',
    classCount: 0,
    studentCount: 0,
    lectureRound: '진행 전',
    settlementStatus: 'pending' as SettlementStatusKey,
    teacherName: '-',
  }
}
