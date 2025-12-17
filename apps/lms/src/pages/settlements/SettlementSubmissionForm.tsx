/**
 * 정산 제출 폼 페이지
 * Phase 6: 강사가 정산 정보를 제출하는 구글폼 스타일 폼
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSettlementStore } from '../../store/settlementStore'
import { useMatchingStore } from '../../store/matchingStore'
import { useProgramStore } from '../../store/programStore'
import { useInstructorStore } from '../../store/instructorStore'
import {
  settlementSubmissionSchema,
  type SettlementSubmissionFormData,
} from '../../schemas/settlementSubmissionSchema'
import type { SettlementItem } from '../../types/domain'
import { MdTextField, MdSelect, MdSelectOption, MdCard, MdCheckbox } from '../../components/m3'
import { CustomButton } from '../../components/ui'
import { MdFileUpload, type FileUploadItem } from '../../components/m3'
import '../../components/m3/MdSelect.css'
import './SettlementSubmissionForm.css'

export default function SettlementSubmissionForm() {
  const navigate = useNavigate()
  const { createSettlement, isLoading } = useSettlementStore()
  const matchingStore = useMatchingStore()
  const programStore = useProgramStore()
  const instructorStore = useInstructorStore()

  const [submitSuccess, setSubmitSuccess] = useState(false)

  // 프로그램 및 매칭 데이터 로드
  useEffect(() => {
    if (programStore.programs.length === 0) {
      programStore.fetchPrograms({ page: 1, pageSize: 100 })
    }
    if (matchingStore.matchings.length === 0) {
      matchingStore.fetchMatchings({ page: 1, pageSize: 100 })
    }
    if (instructorStore.instructors.length === 0) {
      instructorStore.fetchInstructors({ page: 1, pageSize: 100 })
    }
  }, [programStore, matchingStore, instructorStore])

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SettlementSubmissionFormData>({
    resolver: zodResolver(settlementSubmissionSchema),
    defaultValues: {
      matchingId: '',
      instructorFee: '',
      transportationFee: '',
      accommodationFee: '', // 숙박비는 옵셔널
      fuelFee: '',
      fuelProofFiles: [],
      otherFee: '',
      notes: '',
    },
  })

  // 숙박비 포함 여부 상태
  const [includeAccommodation, setIncludeAccommodation] = useState(false)

  // 숙박비 포함 체크박스 핸들러
  const handleAccommodationToggle = (checked: boolean) => {
    setIncludeAccommodation(checked)
    if (checked) {
      setValue('accommodationFee', 80000, { shouldValidate: true })
    } else {
      setValue('accommodationFee', '', { shouldValidate: true })
    }
  }

  const watchedMatchingId = watch('matchingId')
  const watchedInstructorFee = watch('instructorFee')
  const watchedTransportationFee = watch('transportationFee')
  const watchedAccommodationFee = watch('accommodationFee')
  const watchedFuelFee = watch('fuelFee')
  const watchedOtherFee = watch('otherFee')

  // 선택된 매칭 정보
  const selectedMatching = matchingStore.matchings.find((m) => m.id === watchedMatchingId)
  const selectedProgram = selectedMatching
    ? programStore.programs.find((p) => p.id === selectedMatching.programId)
    : null

  // 총액 계산
  const totalAmount = useMemo(() => {
    const instructorFee = typeof watchedInstructorFee === 'number' ? watchedInstructorFee : 0
    const transportationFee = typeof watchedTransportationFee === 'number' ? watchedTransportationFee : 0
    const accommodationFee = typeof watchedAccommodationFee === 'number' ? watchedAccommodationFee : 0
    const fuelFee = typeof watchedFuelFee === 'number' ? watchedFuelFee : 0
    const otherFee = typeof watchedOtherFee === 'number' ? watchedOtherFee : 0

    return instructorFee + transportationFee + accommodationFee + fuelFee + otherFee
  }, [watchedInstructorFee, watchedTransportationFee, watchedAccommodationFee, watchedFuelFee, watchedOtherFee])

  // 매칭 옵션 (프로그램명 + 강사명으로 표시)
  const matchingOptions = useMemo(() => {
    return matchingStore.matchings
      .map((matching) => {
        const program = programStore.programs.find((p) => p.id === matching.programId)
        const instructor = instructorStore.instructors.find((i) => i.id === matching.instructorId)
        // 데이터가 없으면 제외 (실제로는 항상 있어야 함)
        if (!program || !instructor) return null
        return {
          id: matching.id,
          label: `${program.title} - ${instructor.name}`,
          matching,
        }
      })
      .filter((option): option is NonNullable<typeof option> => option !== null)
  }, [matchingStore.matchings, programStore.programs, instructorStore.instructors])

  // 파일 업로드 핸들러
  const handleFileUpload = (files: FileUploadItem[]) => {
    setValue('fuelProofFiles', files, { shouldValidate: true })
  }

  // 숫자 입력 변환 헬퍼
  const parseNumber = (value: string | number | undefined): number | '' => {
    if (value === '' || value === undefined) return ''
    if (typeof value === 'number') return value
    const parsed = parseFloat(value)
    return isNaN(parsed) ? '' : parsed
  }

  // 숫자 필드 onChange 핸들러
  const handleNumberChange = (field: keyof SettlementSubmissionFormData, value: string) => {
    const numValue = value === '' ? '' : parseFloat(value)
    setValue(field, numValue as any, { shouldValidate: true })
  }

  // 폼 제출
  const onSubmit = async (data: SettlementSubmissionFormData) => {
    if (!selectedMatching) {
      alert('프로그램/강의를 선택해주세요')
      return
    }

    try {
      // SettlementItem 배열 생성
      const items: SettlementItem[] = []

      if (typeof data.instructorFee === 'number' && data.instructorFee > 0) {
        items.push({
          type: 'instructor_fee',
          description: '강사비',
          amount: data.instructorFee,
        })
      }

      if (typeof data.transportationFee === 'number' && data.transportationFee > 0) {
        items.push({
          type: 'transportation',
          description: '교통비',
          amount: data.transportationFee,
        })
      }

      // 숙박비는 항상 포함 (80,000원 고정)
      const accommodationAmount = typeof data.accommodationFee === 'number' && data.accommodationFee > 0 ? data.accommodationFee : 80000
      items.push({
        type: 'accommodation',
        description: '숙박비',
        amount: accommodationAmount,
      })

      if (typeof data.fuelFee === 'number' && data.fuelFee > 0) {
        items.push({
          type: 'transportation',
          description: '유류비',
          amount: data.fuelFee,
        })
      }

      if (typeof data.otherFee === 'number' && data.otherFee > 0) {
        items.push({
          type: 'other',
          description: '기타 비용',
          amount: data.otherFee,
        })
      }

      if (items.length === 0) {
        alert('최소 하나의 비용 항목을 입력해주세요')
        return
      }

      // 현재 날짜 기준으로 월별 기간 설정
      const now = new Date()
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      // Settlement 생성
      await createSettlement({
        programId: selectedMatching.programId,
        instructorId: selectedMatching.instructorId,
        matchingId: selectedMatching.id,
        period,
        items,
        totalAmount,
        status: 'pending',
        notes: data.notes || undefined,
      })

      setSubmitSuccess(true)
      setTimeout(() => {
        navigate('/settlements')
      }, 2000)
    } catch (error) {
      console.error('정산 제출 실패:', error)
      alert(error instanceof Error ? error.message : '정산 제출에 실패했습니다')
    }
  }

  if (submitSuccess) {
    return (
      <div className="settlement-submission-form">
        <div className="form-success">
          <MdCard variant="elevated" className="success-card">
            <div className="success-content">
              <h2>정산 정보가 성공적으로 제출되었습니다</h2>
              <p>관리자 검토 후 승인될 예정입니다.</p>
              <p className="redirect-message">잠시 후 정산 목록 페이지로 이동합니다...</p>
            </div>
          </MdCard>
        </div>
      </div>
    )
  }

  return (
    <div className="settlement-submission-form">
      <div className="form-header">
        <h1>정산 정보 제출</h1>
        <p className="form-description">강의 완료 후 정산 정보를 제출해주세요.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="settlement-form">
        {/* 섹션 1: 프로그램/강의 선택 */}
        <MdCard variant="elevated" className="form-section">
          <div className="section-content">
            <h2 className="section-title">프로그램/강의 선택</h2>

            <Controller
              name="matchingId"
              control={control}
              render={({ field }) => (
                <div className="form-field">
                  <MdSelect
                    label="프로그램/강의"
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value)
                      setValue('matchingId', value || '', { shouldValidate: true })
                    }}
                    error={!!errors.matchingId}
                    errorText={errors.matchingId?.message}
                  >
                    <MdSelectOption value="">
                      <div slot="headline">선택해주세요</div>
                    </MdSelectOption>
                    {matchingOptions.map((option) => (
                      <MdSelectOption key={option.id} value={option.id}>
                        <div slot="headline">{option.label}</div>
                      </MdSelectOption>
                    ))}
                  </MdSelect>
                </div>
              )}
            />

            {selectedProgram && (
              <div className="program-info">
                <h3>선택된 프로그램 정보</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>프로그램명</label>
                    <div>{selectedProgram.title}</div>
                  </div>
                  <div className="info-item">
                    <label>프로그램 유형</label>
                    <div>{selectedProgram.type === 'online' ? '온라인' : selectedProgram.type === 'offline' ? '오프라인' : '하이브리드'}</div>
                  </div>
                  <div className="info-item">
                    <label>프로그램 형식</label>
                    <div>
                      {selectedProgram.format === 'workshop'
                        ? '워크샵'
                        : selectedProgram.format === 'seminar'
                          ? '세미나'
                          : selectedProgram.format === 'course'
                            ? '코스'
                            : selectedProgram.format === 'lecture'
                              ? '강의'
                              : '기타'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </MdCard>

        {/* 섹션 2: 비용 입력 */}
        <MdCard variant="elevated" className="form-section">
          <div className="section-content">
            <h2 className="section-title">비용 입력</h2>

            <div className="form-fields-grid">
              <Controller
                name="instructorFee"
                control={control}
                render={({ field }) => (
                  <div className="form-field">
                    <MdTextField
                      label="강사비 (원)"
                      type="number"
                      value={field.value?.toString() || ''}
                      onChange={(value) => handleNumberChange('instructorFee', value)}
                      error={!!errors.instructorFee}
                      errorText={errors.instructorFee?.message}
                      helperText="강의에 대한 강사비를 입력해주세요"
                    />
                  </div>
                )}
              />

              <Controller
                name="transportationFee"
                control={control}
                render={({ field }) => (
                  <div className="form-field">
                    <MdTextField
                      label="교통비 (원)"
                      type="number"
                      value={field.value?.toString() || ''}
                      onChange={(value) => handleNumberChange('transportationFee', value)}
                      error={!!errors.transportationFee}
                      errorText={errors.transportationFee?.message}
                      helperText="교통비를 입력해주세요"
                    />
                  </div>
                )}
              />

              <div className="form-field full-width">
                <div className="accommodation-fee-section">
                  <MdCheckbox
                    checked={includeAccommodation}
                    onChange={handleAccommodationToggle}
                  />
                  <label className="accommodation-label" onClick={() => handleAccommodationToggle(!includeAccommodation)}>
                    숙박비 포함 (80,000원)
                  </label>
                </div>
                {includeAccommodation && (
                  <div className="accommodation-fee-display">
                    <MdTextField
                      label="숙박비 (원)"
                      type="number"
                      value="80000"
                      onChange={() => {}}
                      disabled={true}
                      helperText="숙박비는 80,000원으로 고정됩니다"
                    />
                  </div>
                )}
              </div>

              <Controller
                name="fuelFee"
                control={control}
                render={({ field }) => (
                  <div className="form-field">
                    <MdTextField
                      label="유류비 (원)"
                      type="number"
                      value={field.value?.toString() || ''}
                      onChange={(value) => handleNumberChange('fuelFee', value)}
                      error={!!errors.fuelFee}
                      errorText={errors.fuelFee?.message}
                      helperText="유류비를 입력해주세요 (증빙 파일 필수)"
                    />
                  </div>
                )}
              />

              <Controller
                name="fuelProofFiles"
                control={control}
                render={({ field }) => (
                  <div className="form-field full-width">
                    <MdFileUpload
                      label="유류비 증빙 파일"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple={true}
                      maxFiles={5}
                      maxSize={10 * 1024 * 1024}
                      files={field.value || []}
                      onChange={handleFileUpload}
                      required={
                        (() => {
                          const fuelFeeValue = parseNumber(watch('fuelFee'))
                          return typeof fuelFeeValue === 'number' && fuelFeeValue > 0
                        })()
                      }
                      error={!!errors.fuelProofFiles}
                      errorText={errors.fuelProofFiles?.message}
                      helperText="PDF, JPG, PNG 파일만 업로드 가능 (최대 10MB)"
                    />
                  </div>
                )}
              />

              <Controller
                name="otherFee"
                control={control}
                render={({ field }) => (
                  <div className="form-field">
                    <MdTextField
                      label="기타 비용 (원)"
                      type="number"
                      value={field.value?.toString() || ''}
                      onChange={(value) => handleNumberChange('otherFee', value)}
                      error={!!errors.otherFee}
                      errorText={errors.otherFee?.message}
                      helperText="기타 비용이 있다면 입력해주세요"
                    />
                  </div>
                )}
              />
            </div>
          </div>
        </MdCard>

        {/* 섹션 3: 총액 및 메모 */}
        <MdCard variant="elevated" className="form-section">
          <div className="section-content">
            <h2 className="section-title">총액 및 메모</h2>

            <div className="total-amount-section">
              <div className="total-amount-label">총 금액</div>
              <div className="total-amount-value">{new Intl.NumberFormat('ko-KR').format(totalAmount)}원</div>
            </div>

            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <div className="form-field full-width">
                  <MdTextField
                    label="메모 (선택사항)"
                    value={field.value || ''}
                    onChange={(value) => {
                      field.onChange(value)
                      setValue('notes', value, { shouldValidate: true })
                    }}
                    error={!!errors.notes}
                    errorText={errors.notes?.message}
                    helperText="추가로 전달할 사항이 있다면 입력해주세요"
                  />
                </div>
              )}
            />
          </div>
        </MdCard>

        {/* 제출 버튼 */}
        <div className="form-actions">
          <CustomButton variant="tertiary" type="button" onClick={() => navigate('/settlements')}>
            취소
          </CustomButton>
          <CustomButton variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? '제출 중...' : '제출'}
          </CustomButton>
        </div>
      </form>
    </div>
  )
}

