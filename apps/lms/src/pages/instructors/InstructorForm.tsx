/**
 * 강사 등록/수정 폼
 * M3 컴포넌트 사용, UI/UX 개선
 */

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams, useNavigate } from 'react-router-dom'
import { useInstructorStore } from '../../store/instructorStore'
import { instructorSchema, type InstructorFormData } from '../../schemas/instructorSchema'
import type { Instructor } from '../../types/domain'
import { MdTextField, MdSelect, MdSelectOption, MdChipSet } from '../../components/m3'
import { CustomButton } from '../../components/ui'
import './InstructorForm.css'

export default function InstructorForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const { fetchInstructorById, createInstructor, updateInstructor, regions, specialties, fetchOptions, isLoading } =
    useInstructorStore()

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<InstructorFormData>({
    resolver: zodResolver(instructorSchema),
    defaultValues: {
      name: '',
      contactPhone: '',
      contactEmail: '',
      region: '',
      specialty: [],
      availableTime: '',
      experience: '',
      rating: undefined,
      bankAccount: '',
    },
  })


  // 편집 모드일 때 데이터 로드
  useEffect(() => {
    fetchOptions()
    if (id) {
      fetchInstructorById(id).then((instructor) => {
        if (instructor) {
          setValue('name', instructor.name)
          setValue('contactPhone', instructor.contactPhone ?? '')
          setValue('contactEmail', instructor.contactEmail ?? '')
          setValue('region', instructor.region)
          setValue('specialty', instructor.specialty)
          setValue('availableTime', instructor.availableTime ?? '')
          setValue('experience', instructor.experience ?? '')
          setValue('rating', instructor.rating ?? undefined)
          setValue('bankAccount', instructor.bankAccount ?? '')
        }
      })
    }
  }, [id, fetchInstructorById, fetchOptions, setValue])

  const onSubmit = async (data: InstructorFormData) => {
    const submitData: Omit<Instructor, 'id' | 'createdAt' | 'updatedAt'> = {
      name: data.name,
      contactPhone: data.contactPhone || undefined,
      contactEmail: data.contactEmail || undefined,
      region: data.region,
      specialty: data.specialty,
      availableTime: data.availableTime || undefined,
      experience: data.experience || undefined,
      rating: data.rating ?? undefined,
      bankAccount: data.bankAccount || undefined,
    }

    if (isEdit && id) {
      await updateInstructor(id, submitData)
    } else {
      await createInstructor(submitData)
    }
    navigate('/instructors')
  }

  return (
    <div className="instructor-form-page">
      <div className="page-header">
        <CustomButton variant="secondary" onClick={() => navigate('/instructors')}>
          ← 목록
        </CustomButton>
      </div>

      <h1>{isEdit ? '강사 수정' : '강사 등록'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="instructor-form">
        <div className="form-section">
          <h2>기본 정보</h2>
          <div className="form-grid">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <MdTextField
                  label="이름"
                  value={field.value}
                  onChange={field.onChange}
                  required
                  error={!!errors.name}
                  errorText={errors.name?.message}
                />
              )}
            />
            <div className="form-item">
              <Controller
                name="region"
                control={control}
                render={({ field }) => (
                  <MdSelect
                    label="지역"
                    value={field.value}
                    onChange={field.onChange}
                    required
                    error={!!errors.region}
                    errorText={errors.region?.message}
                  >
                    <MdSelectOption value="">
                      <div slot="headline">선택해주세요</div>
                    </MdSelectOption>
                    {regions.map((region) => (
                      <MdSelectOption key={region} value={region}>
                        <div slot="headline">{region}</div>
                      </MdSelectOption>
                    ))}
                  </MdSelect>
                )}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>연락처</h2>
          <div className="form-grid">
            <Controller
              name="contactPhone"
              control={control}
              render={({ field }) => (
                <MdTextField
                  label="전화번호"
                  type="tel"
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="010-XXXX-XXXX"
                  error={!!errors.contactPhone}
                  errorText={errors.contactPhone?.message}
                />
              )}
            />
            <Controller
              name="contactEmail"
              control={control}
              render={({ field }) => (
                <MdTextField
                  label="이메일"
                  type="email"
                  value={field.value || ''}
                  onChange={field.onChange}
                  error={!!errors.contactEmail}
                  errorText={errors.contactEmail?.message}
                />
              )}
            />
          </div>
        </div>

        <div className="form-section">
          <h2>전문분야</h2>
          <div className="form-item">
            <Controller
              name="specialty"
              control={control}
              render={({ field }) => (
                <MdChipSet
                  label="전문분야 (복수 선택 가능) *"
                  options={specialties}
                  selected={field.value || []}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.specialty && <div className="error-message">{errors.specialty.message}</div>}
          </div>
        </div>

        <div className="form-section">
          <h2>추가 정보</h2>
          <div className="form-grid">
            <Controller
              name="availableTime"
              control={control}
              render={({ field }) => (
                <MdTextField
                  label="가능 시간"
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="예: 평일 오전, 주말 가능"
                />
              )}
            />
            <Controller
              name="rating"
              control={control}
              render={({ field }) => (
                <MdTextField
                  label="평가 (0-5)"
                  type="number"
                  value={field.value?.toString() || ''}
                  onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                  error={!!errors.rating}
                  errorText={errors.rating?.message}
                />
              )}
            />
            <div className="form-item full-width">
              <label>경력</label>
              <Controller
                name="experience"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={3}
                    placeholder="경력 및 이력 정보를 입력해주세요"
                    className={errors.experience ? 'error' : ''}
                  />
                )}
              />
              {errors.experience && <div className="error-message">{errors.experience.message}</div>}
            </div>
            <Controller
              name="bankAccount"
              control={control}
              render={({ field }) => (
                <MdTextField
                  label="계좌번호"
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="계좌번호 (마스킹된 형태로 저장)"
                />
              )}
            />
          </div>
        </div>

        <div className="form-actions">
          <CustomButton variant="secondary" type="button" onClick={() => navigate('/instructors')}>
            취소
          </CustomButton>
          <CustomButton variant="primary" type="submit" loading={isLoading}>
            {isEdit ? '수정' : '등록'}
          </CustomButton>
        </div>
      </form>
    </div>
  )
}
