/**
 * 강사 User Mock 데이터 (Instructor와 연결)
 * Phase 4.1: 강사 조회를 위한 User-Instructor 연결 데이터
 */

import type { User } from '@/types/user'
import { mockInstructors } from './instructors'

function generateUUID(): string {
  return `user-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
}

function generatePastDate(daysAgo: number = 30): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

function generateEmail(name: string): string {
  const domains = ['gmail.com', 'naver.com', 'daum.net', 'jakorea.org']
  const domain = domains[Math.floor(Math.random() * domains.length)]
  const id = name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
  return `${id}@${domain}`
}

/**
 * Instructor와 연결된 User 생성
 * Phase 4.1: 강사 조회를 위해 Instructor ID와 User를 연결
 */
export function createInstructorUsers(): User[] {
  // mockInstructors의 일부(최대 20개)에 대해 User 생성
  const instructorsToLink = mockInstructors.slice(0, Math.min(20, mockInstructors.length))
  
  return instructorsToLink.map((instructor) => {
    const isApproved = Math.random() > 0.2 // 80% 확률로 승인
    const participationHistory = isApproved ? Math.floor(Math.random() * 20) : 0
    
    return {
      id: generateUUID(),
      email: instructor.contactEmail || generateEmail(instructor.name),
      password: 'instructor123!',
      name: instructor.name,
      role: 'INSTRUCTOR' as const,
      instructorId: instructor.id, // Instructor ID와 연결
      interviewStatus: participationHistory > 0 ? 'NOT_REQUIRED' : (isApproved ? 'APPROVED' : 'PENDING'),
      participationHistory,
      isActive: Math.random() > 0.1, // 90% 확률로 활성
      lastLoginAt: Math.random() > 0.3 ? generatePastDate(Math.floor(Math.random() * 30)) : undefined,
      createdAt: instructor.createdAt,
      updatedAt: instructor.updatedAt,
      phone: instructor.contactPhone,
    }
  })
}

// Instructor와 연결된 User 목록
export const mockInstructorUsers = createInstructorUsers()
