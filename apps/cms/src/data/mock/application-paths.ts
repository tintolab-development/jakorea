/**
 * 신청 경로 Mock 데이터
 * V3 Phase 7: 신청 경로 관리
 */

import type { ApplicationPath, ApplicationPathType } from '@/types/domain'

const getDate = (daysAgo: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

const pathTypes: ApplicationPathType[] = ['google_form', 'internal']
const guideTexts = [
  '구글폼을 통해 신청해주세요. 신청 후 관리자 승인을 거쳐 참여가 확정됩니다.',
  '자동화 프로그램 내에서 신청해주세요. 신청 후 관리자 승인을 거쳐 참여가 확정됩니다.',
  '아래 링크를 통해 신청 양식을 작성해주세요.',
  '프로그램 신청은 승인제로 운영됩니다. 신청 후 3일 이내 승인 결과를 안내드립니다.',
  '학교 프로그램은 학사일정에 맞춰 진행됩니다. 신청 전 일정을 확인해주세요.',
]

export const mockApplicationPaths: ApplicationPath[] = Array.from({ length: 30 }, (_, index) => {
  // 첫 번째 경로는 prog-001에 연결하고 활성화
  const programId = index === 0 
    ? 'prog-001' 
    : `prog-${String((index % 40) + 1).padStart(3, '0')}`
  
  const pathType = index === 0 
    ? 'internal' // 첫 번째는 내부 신청 경로로 설정
    : pathTypes[Math.floor(Math.random() * pathTypes.length)]
  const isGoogleForm = pathType === 'google_form'
  
  // 첫 번째 프로그램(prog-001)은 신청 가능하도록 활성화
  const isFirstProgram = programId === 'prog-001'

  return {
    id: `path-${String(index + 1).padStart(3, '0')}`,
    programId,
    pathType,
    googleFormUrl: isGoogleForm
      ? `https://docs.google.com/forms/d/e/${Math.random().toString(36).substring(7)}/viewform`
      : undefined,
    guideText: isFirstProgram 
      ? '자동화 프로그램 내에서 신청해주세요. 신청 후 관리자 승인을 거쳐 참여가 확정됩니다.'
      : guideTexts[Math.floor(Math.random() * guideTexts.length)],
    isActive: isFirstProgram ? true : Math.random() > 0.2, // 첫 번째 프로그램은 항상 활성화, 나머지는 80% 확률로 활성화
    createdAt: getDate(Math.floor(Math.random() * 60) + 5),
    updatedAt: getDate(Math.floor(Math.random() * 5)) }
})

export const mockApplicationPathsMap = new Map(mockApplicationPaths.map(path => [path.id, path]))

// 프로그램 ID로 신청 경로 조회
export const getApplicationPathByProgramId = (programId: string): ApplicationPath | undefined => {
  return mockApplicationPaths.find(path => path.programId === programId && path.isActive)
}




