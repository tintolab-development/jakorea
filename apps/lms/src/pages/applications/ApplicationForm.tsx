/**
 * 신청 등록 폼
 * Phase 2.2: 학교/학생/강사가 프로그램에 신청하는 폼
 * UI/UX 개선: 구글폼 스타일 섹션 카드 레이아웃, 실시간 유효성 검사, 동적 필드
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useApplicationStore } from '../../store/applicationStore'
import { useProgramStore } from '../../store/programStore'
import { useSchoolStore } from '../../store/schoolStore'
import { useInstructorStore } from '../../store/instructorStore'
import { useSponsorStore } from '../../store/sponsorStore'
import { applicationCreateSchema, type ApplicationCreateFormData } from '../../schemas/applicationSchema'
import type { Application } from '../../types/domain'
import { MdTextField, MdSelect, MdSelectOption, MdCard } from '../../components/m3'
import { CustomButton, SubjectTypeChip } from '../../components/ui'
import '../../components/m3/MdSelect.css'
import './ApplicationForm.css'

export default function ApplicationForm() {
  const navigate = useNavigate()
  const { createApplication, isLoading } = useApplicationStore()
  const programStore = useProgramStore()
  const schoolStore = useSchoolStore()
  const instructorStore = useInstructorStore()
  const sponsorStore = useSponsorStore()

  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // 데이터 로드
  useEffect(() => {
    if (programStore.programs.length === 0) {
      programStore.fetchPrograms({ page: 1, pageSize: 100 })
    }
    if (sponsorStore.sponsors.length === 0) {
      sponsorStore.fetchSponsors({ page: 1, pageSize: 100 })
    }
    if (schoolStore.schools.length === 0) {
      schoolStore.fetchSchools({ page: 1, pageSize: 100 })
    }
    if (instructorStore.instructors.length === 0) {
      instructorStore.fetchInstructors({ page: 1, pageSize: 100 })
    }
  }, [programStore, sponsorStore, schoolStore, instructorStore])

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ApplicationCreateFormData>({
    resolver: zodResolver(applicationCreateSchema),
    defaultValues: {
      programId: '',
      roundId: '',
      subjectType: undefined,
      subjectId: '',
      studentName: '',
      studentContact: '',
      notes: '',
    },
  })

  const watchedProgramId = watch('programId')
  const watchedSubjectType = watch('subjectType')

  // 선택된 프로그램 정보
  const selectedProgram = useMemo(() => {
    if (!watchedProgramId) return null
    return programStore.programs.find(p => p.id === watchedProgramId)
  }, [watchedProgramId, programStore.programs])

  // 선택된 프로그램의 회차 목록
  const availableRounds = useMemo(() => {
    if (!selectedProgram) return []
    return selectedProgram.rounds
      .sort((a, b) => a.roundNumber - b.roundNumber)
      .map(round => ({
        id: round.id,
        roundNumber: round.roundNumber,
        label: `${round.roundNumber}회차 (${new Date(round.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(round.endDate).toLocaleDateString('ko-KR')})`,
      }))
  }, [selectedProgram])

  // 프로그램 변경 시 회차 초기화
  useEffect(() => {
    if (watchedProgramId) {
      setValue('roundId', '')
    }
  }, [watchedProgramId, setValue])

  // 주체 유형 변경 시 subjectId 초기화
  useEffect(() => {
    if (watchedSubjectType) {
      setValue('subjectId', '')
      if (watchedSubjectType !== 'student') {
        setValue('studentName', '')
        setValue('studentContact', '')
      }
    }
  }, [watchedSubjectType, setValue])

  // 주체 목록 (주체 유형에 따라 동적 변경)
  const subjectOptions = useMemo(() => {
    if (!watchedSubjectType) return []
    
    switch (watchedSubjectType) {
      case 'school':
        return schoolStore.schools.map(school => ({
          id: school.id,
          name: `${school.name} (${school.region})`,
          school,
        }))
      case 'instructor':
        return instructorStore.instructors.map(instructor => ({
          id: instructor.id,
          name: `${instructor.name} (${instructor.region})`,
          instructor,
        }))
      case 'student':
        return [] // 학생은 직접 입력
      default:
        return []
    }
  }, [watchedSubjectType, schoolStore.schools, instructorStore.instructors])

  // 폼 제출 핸들러
  const onSubmit = async (data: ApplicationCreateFormData) => {
    try {
      setSubmitError(null)
      
      // 학생의 경우 임시 ID 생성
      let finalSubjectId = data.subjectId
      if (data.subjectType === 'student' && data.studentName && data.studentContact) {
        // 학생은 이름과 연락처를 조합하여 임시 ID 생성
        finalSubjectId = `student-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      }

      if (!finalSubjectId) {
        throw new Error('신청 주체 정보가 올바르지 않습니다')
      }

      // 신청 데이터 생성
      const applicationData: Omit<Application, 'id' | 'createdAt' | 'updatedAt'> = {
        programId: data.programId,
        roundId: data.roundId || undefined,
        subjectType: data.subjectType,
        subjectId: finalSubjectId,
        status: 'submitted', // 신청 등록 시 항상 'submitted'
        notes: data.notes || undefined,
        submittedAt: new Date().toISOString(),
      }

      await createApplication(applicationData)
      setSubmitSuccess(true)
      
      // 2초 후 목록 페이지로 이동
      setTimeout(() => {
        navigate('/applications')
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '신청 등록에 실패했습니다'
      setSubmitError(errorMessage)
    }
  }

  // 주체 유형 레이블
  const getSubjectTypeLabel = (type: ApplicationCreateFormData['subjectType']) => {
    switch (type) {
      case 'school':
        return '학교'
      case 'student':
        return '학생'
      case 'instructor':
        return '강사'
      default:
        return ''
    }
  }

  if (submitSuccess) {
    return (
      <div className="application-form-page">
        <div className="success-message">
          <h2>신청이 완료되었습니다!</h2>
          <p>신청 목록 페이지로 이동합니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="application-form-page">
      <div className="form-header">
        <h1>프로그램 신청</h1>
        <p className="form-description">
          신청할 프로그램과 신청 주체 정보를 입력해주세요. 신청 후 관리자 검토를 거쳐 확정됩니다.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="application-form">
        {/* 섹션 1: 신청 주체 정보 */}
        <MdCard variant="elevated" className="form-section">
          <div className="section-content">
            <h2 className="section-title">신청 주체 정보</h2>
            
            <div className="form-fields-grid">
              {/* 주체 유형 선택 */}
              <div className="form-field full-width">
                <Controller
                  name="subjectType"
                  control={control}
                  render={({ field }) => (
                    <MdSelect
                      label="신청 주체 유형 *"
                      value={field.value || ''}
                      onChange={value => field.onChange(value || undefined)}
                      error={!!errors.subjectType}
                      errorText={errors.subjectType?.message}
                    >
                      <MdSelectOption value="">
                        <div slot="headline">선택해주세요</div>
                      </MdSelectOption>
                      <MdSelectOption value="school">
                        <div slot="headline">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <SubjectTypeChip subjectType="school" />
                            <span>학교</span>
                          </div>
                        </div>
                      </MdSelectOption>
                      <MdSelectOption value="student">
                        <div slot="headline">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <SubjectTypeChip subjectType="student" />
                            <span>학생</span>
                          </div>
                        </div>
                      </MdSelectOption>
                      <MdSelectOption value="instructor">
                        <div slot="headline">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <SubjectTypeChip subjectType="instructor" />
                            <span>강사</span>
                          </div>
                        </div>
                      </MdSelectOption>
                    </MdSelect>
                  )}
                />
              </div>

              {/* 주체 선택 (학교/강사) */}
              {watchedSubjectType && watchedSubjectType !== 'student' && (
                <div className="form-field full-width">
                  <Controller
                    name="subjectId"
                    control={control}
                    render={({ field }) => (
                      <MdSelect
                        label={`${getSubjectTypeLabel(watchedSubjectType)} 선택 *`}
                        value={field.value || ''}
                        onChange={value => field.onChange(value || undefined)}
                        error={!!errors.subjectId}
                        errorText={errors.subjectId?.message}
                      >
                        <MdSelectOption value="">
                          <div slot="headline">선택해주세요</div>
                        </MdSelectOption>
                        {subjectOptions.map(option => (
                          <MdSelectOption key={option.id} value={option.id}>
                            <div slot="headline">{option.name}</div>
                          </MdSelectOption>
                        ))}
                      </MdSelect>
                    )}
                  />
                </div>
              )}

              {/* 학생 정보 입력 */}
              {watchedSubjectType === 'student' && (
                <>
                  <div className="form-field">
                    <Controller
                      name="studentName"
                      control={control}
                      render={({ field }) => (
                        <MdTextField
                          label="학생 이름 *"
                          value={field.value || ''}
                          onChange={value => field.onChange(value || undefined)}
                          error={!!errors.studentName}
                          errorText={errors.studentName?.message}
                          placeholder="신청하는 학생의 이름을 입력하세요"
                        />
                      )}
                    />
                  </div>
                  <div className="form-field">
                    <Controller
                      name="studentContact"
                      control={control}
                      render={({ field }) => (
                        <MdTextField
                          label="연락처 *"
                          value={field.value || ''}
                          onChange={value => field.onChange(value || undefined)}
                          error={!!errors.studentContact}
                          errorText={errors.studentContact?.message}
                          placeholder="010-1234-5678"
                        />
                      )}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </MdCard>

        {/* 섹션 2: 프로그램 정보 */}
        <MdCard variant="elevated" className="form-section">
          <div className="section-content">
            <h2 className="section-title">프로그램 정보</h2>
            
            <div className="form-fields-grid">
              {/* 프로그램 선택 */}
              <div className="form-field full-width">
                <Controller
                  name="programId"
                  control={control}
                  render={({ field }) => (
                    <MdSelect
                      label="프로그램 *"
                      value={field.value || ''}
                      onChange={value => field.onChange(value || undefined)}
                      error={!!errors.programId}
                      errorText={errors.programId?.message}
                    >
                      <MdSelectOption value="">
                        <div slot="headline">선택해주세요</div>
                      </MdSelectOption>
                      {programStore.programs
                        .filter(p => p.status === 'active' || p.status === 'pending')
                        .map(program => (
                          <MdSelectOption key={program.id} value={program.id}>
                            <div slot="headline">{program.title}</div>
                          </MdSelectOption>
                        ))}
                    </MdSelect>
                  )}
                />
              </div>

              {/* 선택된 프로그램 정보 표시 */}
              {selectedProgram && (
                <div className="form-field full-width">
                  <div className="program-info">
                    <h3>선택된 프로그램 정보</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">스폰서</span>
                        <span className="info-value">
                          {sponsorStore.sponsors.find(s => s.id === selectedProgram.sponsorId)?.name || '-'}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">유형</span>
                        <span className="info-value">
                          {selectedProgram.type === 'online' ? '온라인' : 
                           selectedProgram.type === 'offline' ? '오프라인' : '혼합형'}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">형태</span>
                        <span className="info-value">
                          {selectedProgram.format === 'workshop' ? '워크샵' :
                           selectedProgram.format === 'seminar' ? '세미나' :
                           selectedProgram.format === 'course' ? '코스' :
                           selectedProgram.format === 'lecture' ? '강의' : '기타'}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">시작일</span>
                        <span className="info-value">
                          {new Date(selectedProgram.startDate).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">종료일</span>
                        <span className="info-value">
                          {new Date(selectedProgram.endDate).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">회차 수</span>
                        <span className="info-value">{selectedProgram.rounds.length}회</span>
                      </div>
                    </div>
                    {selectedProgram.description && (
                      <div className="info-item full-width">
                        <span className="info-label">설명</span>
                        <span className="info-value">{selectedProgram.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 회차 선택 (선택사항) */}
              {availableRounds.length > 0 && (
                <div className="form-field full-width">
                  <Controller
                    name="roundId"
                    control={control}
                    render={({ field }) => (
                      <MdSelect
                        label="회차 선택 (선택사항)"
                        value={field.value || ''}
                        onChange={value => field.onChange(value || undefined)}
                        error={!!errors.roundId}
                        errorText={errors.roundId?.message}
                      >
                        <MdSelectOption value="">
                          <div slot="headline">전체 회차 신청</div>
                        </MdSelectOption>
                        {availableRounds.map(round => (
                          <MdSelectOption key={round.id} value={round.id}>
                            <div slot="headline">{round.label}</div>
                          </MdSelectOption>
                        ))}
                      </MdSelect>
                    )}
                  />
                  <p className="field-hint">특정 회차만 신청하려면 선택하세요. 선택하지 않으면 전체 회차에 신청됩니다.</p>
                </div>
              )}
            </div>
          </div>
        </MdCard>

        {/* 섹션 3: 추가 정보 */}
        <MdCard variant="elevated" className="form-section">
          <div className="section-content">
            <h2 className="section-title">추가 정보</h2>
            
            <div className="form-fields-grid">
              {/* 메모 입력 */}
              <div className="form-field full-width">
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <MdTextField
                      label="메모 (선택사항)"
                      value={field.value || ''}
                      onChange={value => field.onChange(value || undefined)}
                      error={!!errors.notes}
                      errorText={errors.notes?.message}
                      placeholder="신청 관련 추가 정보나 요청사항을 입력하세요 (최대 2,000자)"
                      supportingText="여러 줄 입력이 필요하면 Enter 키를 사용하세요"
                    />
                  )}
                />
                <p className="field-hint">신청 관련 추가 정보나 특별 요청사항이 있으면 입력해주세요.</p>
              </div>
            </div>
          </div>
        </MdCard>

        {/* 에러 메시지 */}
        {submitError && (
          <div className="form-error">
            <strong>오류:</strong> {submitError}
          </div>
        )}

        {/* 폼 액션 버튼 */}
        <div className="form-actions">
          <CustomButton
            type="button"
            variant="secondary"
            onClick={() => navigate('/applications')}
            disabled={isLoading}
          >
            취소
          </CustomButton>
          <CustomButton
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
          >
            신청 제출
          </CustomButton>
        </div>
      </form>
    </div>
  )
}

