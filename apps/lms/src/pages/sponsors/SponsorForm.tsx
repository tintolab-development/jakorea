/**
 * 스폰서 등록/수정 폼
 * Phase 1.3: M3 컴포넌트 사용
 */

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams, useNavigate } from 'react-router-dom'
import { useSponsorStore } from '../../store/sponsorStore'
import { sponsorSchema, type SponsorFormData } from '../../schemas/sponsorSchema'
import type { Sponsor } from '../../types/domain'
import { MdTextField } from '../../components/m3'
import { CustomButton } from '../../components/ui'
import './SponsorForm.css'

export default function SponsorForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const { fetchSponsorById, createSponsor, updateSponsor, isLoading } = useSponsorStore()

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SponsorFormData>({
    resolver: zodResolver(sponsorSchema),
    defaultValues: {
      name: '',
      description: '',
      contactInfo: '',
      securityMemo: '',
    },
  })

  // 편집 모드일 때 데이터 로드
  useEffect(() => {
    if (id) {
      fetchSponsorById(id).then(sponsor => {
        if (sponsor) {
          setValue('name', sponsor.name)
          setValue('description', sponsor.description ?? '')
          setValue('contactInfo', sponsor.contactInfo ?? '')
          setValue('securityMemo', sponsor.securityMemo ?? '')
        }
      })
    }
  }, [id, fetchSponsorById, setValue])

  const onSubmit = async (data: SponsorFormData) => {
    const submitData: Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'> = {
      name: data.name,
      description: data.description || undefined,
      contactInfo: data.contactInfo || undefined,
      securityMemo: data.securityMemo || undefined,
    }

    if (isEdit && id) {
      await updateSponsor(id, submitData)
    } else {
      await createSponsor(submitData)
    }
    navigate('/sponsors')
  }

  return (
    <div className="sponsor-form-page">
      <div className="page-header">
        <CustomButton variant="secondary" onClick={() => navigate('/sponsors')}>
          ← 목록
        </CustomButton>
      </div>

      <h1>{isEdit ? '스폰서 수정' : '스폰서 등록'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="sponsor-form">
        <div className="form-section">
          <h2>기본 정보</h2>
          <div className="form-grid">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <MdTextField
                  label="스폰서명 *"
                  value={field.value}
                  onChange={value => field.onChange(value)}
                  required
                  error={!!errors.name}
                  errorText={errors.name?.message}
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <MdTextField
                  label="설명"
                  value={field.value}
                  onChange={value => field.onChange(value)}
                  error={!!errors.description}
                  errorText={errors.description?.message}
                  helperText="스폰서에 대한 간단한 설명을 입력하세요"
                />
              )}
            />
          </div>
        </div>

        <div className="form-section">
          <h2>연락처 정보</h2>
          <div className="form-grid">
            <Controller
              name="contactInfo"
              control={control}
              render={({ field }) => (
                <MdTextField
                  label="연락처"
                  value={field.value}
                  onChange={value => field.onChange(value)}
                  error={!!errors.contactInfo}
                  errorText={errors.contactInfo?.message}
                  helperText="이메일, 전화번호 등 연락 가능한 정보를 입력하세요"
                />
              )}
            />
          </div>
        </div>

        <div className="form-section">
          <h2>보안 정보 (선택)</h2>
          <div className="form-grid">
            <Controller
              name="securityMemo"
              control={control}
              render={({ field }) => (
                <MdTextField
                  label="보안 메모"
                  value={field.value}
                  onChange={value => field.onChange(value)}
                  error={!!errors.securityMemo}
                  errorText={errors.securityMemo?.message}
                  helperText="보안 및 정책 관련 메모를 입력하세요"
                />
              )}
            />
          </div>
        </div>

        <div className="form-actions">
          <CustomButton variant="secondary" type="button" onClick={() => navigate('/sponsors')}>
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
