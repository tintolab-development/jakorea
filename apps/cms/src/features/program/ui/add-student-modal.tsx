/**
 * 학생 등록 모달
 * 학교 상세 정보 모달 > 학생 명단 탭 > "학생 등록" 클릭 시 노출
 * 스펙: 모달 width 800px, 헤더 제외 body 영역 800×353px
 * 필수: 학생명, 성별, 학급 / 선택: 연락처, 이메일 / 성별 기본값: 남
 */

import { useEffect } from 'react'
import { Input, Radio } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { AppButton } from '@/shared/ui/app-button'
import {
  addStudentFormSchema,
  type AddStudentFormValues,
  DEFAULT_ADD_STUDENT_FORM_VALUES,
} from '../model/school-detail-add-student-schema'
import './add-student-modal.css'

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
    formState: { errors },
  } = useForm<AddStudentFormValues>({
    resolver: zodResolver(addStudentFormSchema),
    defaultValues: DEFAULT_ADD_STUDENT_FORM_VALUES,
  })

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
      <AppButton variant="cancel" size="large" onClick={onCancel}>
        취소
      </AppButton>
      <AppButton variant="primary" size="large" modalTeal onClick={() => handleSubmit(onSubmit)()}>
        추가
      </AppButton>
    </>
  )

  return (
    <TealHeaderModal
      open={open}
      onCancel={onCancel}
      title="학생 등록"
      width={800}
      footer={footer}
      className="add-student-modal"
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
          <div className="add-student-modal__row">
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
                <span className="add-student-modal__error">{errors.name.message}</span>
              )}
            </div>
            <div className="add-student-modal__field">
              <label className="add-student-modal__label">
                성별 <span className="add-student-modal__required" aria-hidden>*</span>
              </label>
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
          </div>
          <div className="add-student-modal__row">
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
                <span className="add-student-modal__error">{errors.contact.message}</span>
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
                <span className="add-student-modal__error">{errors.email.message}</span>
              )}
            </div>
          </div>
          <div className="add-student-modal__row add-student-modal__row--full">
            <div className="add-student-modal__field add-student-modal__field--full">
              <label className="add-student-modal__label">
                학급 <span className="add-student-modal__required" aria-hidden>*</span>
              </label>
              <Controller
                name="gradeClass"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="학급을 입력하세요"
                    className="add-student-modal__input add-student-modal__input--full"
                    status={errors.gradeClass ? 'error' : undefined}
                  />
                )}
              />
              {errors.gradeClass && (
                <span className="add-student-modal__error">{errors.gradeClass.message}</span>
              )}
            </div>
          </div>
        </form>
      </div>
    </TealHeaderModal>
  )
}
