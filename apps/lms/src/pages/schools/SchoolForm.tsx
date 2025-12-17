/**
 * 학교 등록/수정 폼
 * Phase 1.4: react-hook-form + zod 유효성 검사
 */

import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSchoolStore } from '../../store/schoolStore'
import type { School } from '../../types'
import { schoolSchema, type SchoolFormData } from '../../schemas/schoolSchema'
import { MdTextField, MdSelect, MdSelectOption } from '../../components/m3'
import { CustomButton } from '../../components/ui'
import './SchoolForm.css'

export default function SchoolForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const { fetchSchoolById, createSchool, updateSchool, regions, fetchOptions, isLoading } = useSchoolStore()

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: '',
      region: '',
      address: '',
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
    },
  })

  useEffect(() => {
    fetchOptions()
    if (id) {
      fetchSchoolById(id).then((school) => {
        if (school) {
          setValue('name', school.name)
          setValue('region', school.region)
          setValue('address', school.address ?? '')
          setValue('contactPerson', school.contactPerson)
          setValue('contactPhone', school.contactPhone ?? '')
          setValue('contactEmail', school.contactEmail ?? '')
        }
      })
    }
  }, [id, fetchSchoolById, fetchOptions, setValue])

  const onSubmit = async (data: SchoolFormData) => {
    const submitData: Omit<School, 'id' | 'createdAt' | 'updatedAt'> = {
      name: data.name,
      region: data.region,
      address: data.address || undefined,
      contactPerson: data.contactPerson,
      contactPhone: data.contactPhone || undefined,
      contactEmail: data.contactEmail || undefined,
    }

    if (isEdit && id) {
      await updateSchool(id, submitData)
    } else {
      await createSchool(submitData)
    }
    navigate('/schools')
  }

  return (
    <div className="school-form-page">
      <div className="page-header">
        <CustomButton variant="secondary" onClick={() => navigate('/schools')}>
          ← 목록
        </CustomButton>
      </div>

      <h1>{isEdit ? '학교 수정' : '학교 등록'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="school-form">
        <div className="form-section">
          <h2>기본 정보</h2>
          <div className="form-grid">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <div className="form-item">
                  <MdTextField
                    label="학교명 *"
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                    required
                    error={!!errors.name}
                    errorText={errors.name?.message}
                  />
                </div>
              )}
            />
            <Controller
              name="region"
              control={control}
              render={({ field }) => (
                <div className="form-item">
                  <MdSelect
                    label="지역 *"
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
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
                </div>
              )}
            />
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <div className="form-item full-width">
                  <MdTextField
                    label="주소"
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                    error={!!errors.address}
                    errorText={errors.address?.message}
                    helperText="학교 주소를 입력하세요"
                  />
                </div>
              )}
            />
          </div>
        </div>

        <div className="form-section">
          <h2>담당자 정보</h2>
          <div className="form-grid">
            <Controller
              name="contactPerson"
              control={control}
              render={({ field }) => (
                <div className="form-item">
                  <MdTextField
                    label="담당자 이름 *"
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                    required
                    error={!!errors.contactPerson}
                    errorText={errors.contactPerson?.message}
                  />
                </div>
              )}
            />
            <Controller
              name="contactPhone"
              control={control}
              render={({ field }) => (
                <div className="form-item">
                  <MdTextField
                    label="전화번호"
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                    placeholder="02-1234-5678"
                    error={!!errors.contactPhone}
                    errorText={errors.contactPhone?.message}
                  />
                </div>
              )}
            />
            <Controller
              name="contactEmail"
              control={control}
              render={({ field }) => (
                <div className="form-item full-width">
                  <MdTextField
                    label="이메일"
                    type="email"
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                    error={!!errors.contactEmail}
                    errorText={errors.contactEmail?.message}
                  />
                </div>
              )}
            />
          </div>
        </div>

        <div className="form-actions">
          <CustomButton variant="secondary" onClick={() => navigate('/schools')} disabled={isLoading}>
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

