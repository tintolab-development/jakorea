/**
 * 학생 추가 등록 모달
 * 프로그램 상세 풀페이지 모달 > 프로그램 진행현황 > 참여기관 > 학생 추가 클릭 시 노출
 * 스펙: 제목 "학생 추가 등록", 설명 문구, 필수 학생명/성별/학급(Select), 선택 연락처/이메일, 취소/등록 버튼
 */

import { useEffect } from 'react'
import { Input, Radio, Select } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import {
  addStudentFormSchema,
  type AddStudentFormValues,
  DEFAULT_ADD_STUDENT_FORM_VALUES } from '../model/school-detail-add-student-schema'
import './add-student-modal.css'
import { fieldValidationHelp } from '@/shared/utils/error-handler'

export interface AddStudentModalProps {
  open: boolean
  onCancel: () => void
  onAdd: (values: AddStudentFormValues) => void
}

export function AddStudentModal({ open, onCancel, onAdd }: AddStudentModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors } } = useForm<AddStudentFormValues>({
    resolver: zodResolver(addStudentFormSchema),
    defaultValues: DEFAULT_ADD_STUDENT_FORM_VALUES })

  useEffect(() => {
    if (open) {
      reset(DEFAULT_ADD_STUDENT_FORM_VALUES)
    }
  }, [open, reset])

  const onSubmit = (values: AddStudentFormValues) => {
    onAdd(values)
    onCancel()
  }

  const footer = (
    <>
      <CmsButton variant="secondary" size="large" onClick={onCancel}>
        취소
      </CmsButton>
      <CmsButton variant="primary" size="large" onClick={() => handleSubmit(onSubmit)()}>
        등록
      </CmsButton>
    </>
  )

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="학생 추가 등록"
      width={800}
      footer={footer}
      className="add-student-modal"
      description="프로그램에 참여하는 학생 정보를 추가 등록합니다."
    >
      <div className="add-student-modal__body">
        <form
          className="add-student-modal__form"
          onSubmit={e => {
            e.preventDefault()
            handleSubmit(onSubmit)(e)
          }}
          noValidate
        >
          <div className="add-student-modal__field">
            <label className="add-student-modal__label">
              학생명 <span className="add-student-modal__required" aria-hidden>*</span>
            </label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="학생명을 입력하세요"
                  className="add-student-modal__input"
                  status={errors.name ? 'error' : undefined}
                />
              )}
            />
            {errors.name && (
              <span className="add-student-modal__error">{fieldValidationHelp(errors.name)}</span>
            )}
          </div>
          <div className="add-student-modal__field">
            <label className="add-student-modal__label">성별</label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Radio.Group
                  {...field}
                  options={[
                    { label: '남', value: 'male' },
                    { label: '여', value: 'female' },
                  ]}
                  className="add-student-modal__radio-group"
                />
              )}
            />
          </div>
          <div className="add-student-modal__field">
            <label className="add-student-modal__label">
              학급 <span className="add-student-modal__required" aria-hidden>*</span>
            </label>
            <Controller
              name="gradeClass"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  value={field.value || undefined}
                  placeholder="학급을 선택하세요"
                  className="add-student-modal__select add-student-modal__select--full"
                  status={errors.gradeClass ? 'error' : undefined}
                  options={[
                    { label: '1반', value: '1반' },
                    { label: '2반', value: '2반' },
                    { label: '3반', value: '3반' },
                    { label: '4반', value: '4반' },
                    { label: '5반', value: '5반' },
                    { label: '6반', value: '6반' },
                  ]}
                  allowClear
                />
              )}
            />
            {errors.gradeClass && (
              <span className="add-student-modal__error">{fieldValidationHelp(errors.gradeClass)}</span>
            )}
          </div>
          <div className="add-student-modal__field">
            <label className="add-student-modal__label">연락처</label>
            <Controller
              name="contact"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder="연락처를 입력하세요"
                  className="add-student-modal__input"
                  status={errors.contact ? 'error' : undefined}
                />
              )}
            />
            {errors.contact && (
              <span className="add-student-modal__error">{fieldValidationHelp(errors.contact)}</span>
            )}
          </div>
          <div className="add-student-modal__field">
            <label className="add-student-modal__label">이메일</label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder="이메일을 입력하세요"
                  className="add-student-modal__input"
                  status={errors.email ? 'error' : undefined}
                />
              )}
            />
            {errors.email && (
              <span className="add-student-modal__error">{fieldValidationHelp(errors.email)}</span>
            )}
          </div>
        </form>
      </div>
    </ContentModal>
  )
}
