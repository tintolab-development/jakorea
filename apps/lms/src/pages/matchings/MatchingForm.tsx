/**
 * 매칭 등록/수정 폼
 * Phase 3.2: react-hook-form + zod, 강사 후보 제안 UI 포함
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMatchingStore } from '../../store/matchingStore'
import { useProgramStore } from '../../store/programStore'
import { useInstructorStore } from '../../store/instructorStore'
import { matchingSchema, type MatchingFormData } from '../../schemas/matchingSchema'
import type { Matching } from '../../types/domain'
import { MdTextField, MdSelect, MdSelectOption, MdCard } from '../../components/m3'
import { CustomButton } from '../../components/ui'
import './MatchingForm.css'

export default function MatchingForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const { fetchMatchingById, createMatching, updateMatching, isLoading, suggestInstructorCandidates, candidateInstructors } =
    useMatchingStore()
  const programStore = useProgramStore()
  const instructorStore = useInstructorStore()

  const [showCandidates, setShowCandidates] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<MatchingFormData>({
    resolver: zodResolver(matchingSchema),
    defaultValues: {
      programId: '',
      roundId: '',
      instructorId: '',
      scheduleId: '',
      status: 'pending',
      cancellationReason: '',
    },
  })

  const watchedProgramId = watch('programId')
  const watchedRoundId = watch('roundId')

  // 프로그램 목록 로드
  useEffect(() => {
    if (programStore.programs.length === 0) {
      programStore.fetchPrograms({ page: 1, pageSize: 100 })
    }
  }, [programStore])

  // 강사 목록 로드
  useEffect(() => {
    if (instructorStore.instructors.length === 0) {
      instructorStore.fetchInstructors({ page: 1, pageSize: 100 })
    }
  }, [instructorStore])

  // 선택된 프로그램의 회차 목록
  const selectedProgram = programStore.programs.find(p => p.id === watchedProgramId)
  const rounds = selectedProgram?.rounds || []

  // 편집 모드일 때 데이터 로드
  useEffect(() => {
    if (id) {
      fetchMatchingById(id).then(matching => {
        if (matching) {
          setValue('programId', matching.programId)
          setValue('roundId', matching.roundId || '')
          setValue('instructorId', matching.instructorId)
          setValue('scheduleId', matching.scheduleId || '')
          setValue('status', matching.status)
          setValue('cancellationReason', matching.cancellationReason || '')
        }
      })
    }
  }, [id, fetchMatchingById, setValue])

  // 프로그램/회차 변경 시 강사 후보 제안
  useEffect(() => {
    if (watchedProgramId) {
      suggestInstructorCandidates(watchedProgramId, watchedRoundId || undefined)
      setShowCandidates(true)
    }
  }, [watchedProgramId, watchedRoundId, suggestInstructorCandidates])

  // 강사 후보 선택 핸들러
  const handleCandidateSelect = (instructorId: string) => {
    setValue('instructorId', instructorId)
    setShowCandidates(false)
  }

  const onSubmit = async (data: MatchingFormData) => {
    const submitData: Omit<Matching, 'id' | 'createdAt' | 'updatedAt' | 'matchedAt' | 'history'> = {
      programId: data.programId,
      roundId: data.roundId || undefined,
      instructorId: data.instructorId,
      scheduleId: data.scheduleId || undefined,
      status: data.status,
      cancelledAt: data.status === 'cancelled' ? new Date().toISOString() : undefined,
      cancellationReason: data.cancellationReason || undefined,
    }

    if (isEdit && id) {
      await updateMatching(id, submitData)
    } else {
      await createMatching(submitData)
    }

    navigate('/matchings')
  }

  return (
    <div className="matching-form-page">
      <div className="page-header">
        <CustomButton variant="tertiary" onClick={() => navigate('/matchings')}>
          ← 목록으로
        </CustomButton>
      </div>

      <h1>{isEdit ? '매칭 수정' : '매칭 등록'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="matching-form">
        {/* 기본 정보 섹션 */}
        <div className="form-section">
          <h2>기본 정보</h2>
          <div className="form-grid">
            <Controller
              name="programId"
              control={control}
              render={({ field }) => (
                <div className="form-item">
                  <MdSelect
                    label="프로그램 *"
                    value={field.value}
                    onChange={value => field.onChange(value)}
                    required
                    error={!!errors.programId}
                    errorText={errors.programId?.message}
                  >
                    <MdSelectOption value="">
                      <div slot="headline">선택해주세요</div>
                    </MdSelectOption>
                    {programStore.programs.map(program => (
                      <MdSelectOption key={program.id} value={program.id}>
                        <div slot="headline">{program.title}</div>
                      </MdSelectOption>
                    ))}
                  </MdSelect>
                </div>
              )}
            />
            {rounds.length > 0 && (
              <Controller
                name="roundId"
                control={control}
                render={({ field }) => (
                  <div className="form-item">
                    <MdSelect
                      label="회차"
                      value={field.value}
                      onChange={value => field.onChange(value)}
                      error={!!errors.roundId}
                      errorText={errors.roundId?.message}
                    >
                      <MdSelectOption value="">
                        <div slot="headline">선택 안함</div>
                      </MdSelectOption>
                      {rounds.map(round => (
                        <MdSelectOption key={round.id} value={round.id}>
                          <div slot="headline">{round.roundNumber}회차</div>
                        </MdSelectOption>
                      ))}
                    </MdSelect>
                  </div>
                )}
              />
            )}
            <Controller
              name="instructorId"
              control={control}
              render={({ field }) => (
                <div className="form-item full-width">
                  <MdSelect
                    label="강사 *"
                    value={field.value}
                    onChange={value => field.onChange(value)}
                    required
                    error={!!errors.instructorId}
                    errorText={errors.instructorId?.message}
                  >
                    <MdSelectOption value="">
                      <div slot="headline">선택해주세요</div>
                    </MdSelectOption>
                    {instructorStore.instructors.map(instructor => (
                      <MdSelectOption key={instructor.id} value={instructor.id}>
                        <div slot="headline">{instructor.name}</div>
                      </MdSelectOption>
                    ))}
                  </MdSelect>
                  {showCandidates && candidateInstructors.length > 0 && (
                    <div className="candidates-section">
                      <h3>💡 추천 강사 후보</h3>
                      <div className="candidates-list">
                        {candidateInstructors.slice(0, 5).map((candidate, index) => (
                          <MdCard key={candidate.instructor.id} variant="outlined" className="candidate-card">
                            <div className="candidate-content">
                              <div className="candidate-header">
                                <span className="candidate-rank">#{index + 1}</span>
                                <span className="candidate-name">{candidate.instructor.name}</span>
                                <span className="candidate-score">점수: {candidate.score}</span>
                              </div>
                              <div className="candidate-reasons">
                                {candidate.reasons.map((reason, idx) => (
                                  <span key={idx} className="reason-badge">
                                    {reason}
                                  </span>
                                ))}
                              </div>
                              <CustomButton
                                variant="tertiary"
                                onClick={() => handleCandidateSelect(candidate.instructor.id)}
                                disabled={field.value === candidate.instructor.id}
                              >
                                {field.value === candidate.instructor.id ? '선택됨' : '선택'}
                              </CustomButton>
                            </div>
                          </MdCard>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            />
          </div>
        </div>

        {/* 상태 및 기타 정보 섹션 */}
        <div className="form-section">
          <h2>상태 및 기타 정보</h2>
          <div className="form-grid">
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <div className="form-item">
                  <MdSelect
                    label="상태 *"
                    value={field.value}
                    onChange={value => field.onChange(value)}
                    required
                    error={!!errors.status}
                    errorText={errors.status?.message}
                  >
                    <MdSelectOption value="pending">
                      <div slot="headline">대기중</div>
                    </MdSelectOption>
                    <MdSelectOption value="active">
                      <div slot="headline">활성</div>
                    </MdSelectOption>
                    <MdSelectOption value="inactive">
                      <div slot="headline">비활성</div>
                    </MdSelectOption>
                    <MdSelectOption value="completed">
                      <div slot="headline">완료</div>
                    </MdSelectOption>
                    <MdSelectOption value="cancelled">
                      <div slot="headline">취소</div>
                    </MdSelectOption>
                  </MdSelect>
                </div>
              )}
            />
            <Controller
              name="cancellationReason"
              control={control}
              render={({ field }) => (
                <div className="form-item full-width">
                  <MdTextField
                    label="취소 사유"
                    value={field.value}
                    onChange={value => field.onChange(value)}
                    error={!!errors.cancellationReason}
                    errorText={errors.cancellationReason?.message}
                    helperText="상태가 '취소'인 경우에만 입력하세요"
                    disabled={watch('status') !== 'cancelled'}
                  />
                </div>
              )}
            />
          </div>
        </div>

        {/* 폼 액션 */}
        <div className="form-actions">
          <CustomButton variant="secondary" type="button" onClick={() => navigate('/matchings')} disabled={isLoading}>
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

