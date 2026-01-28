/**
 * 강사 지급정보 Mock 서비스
 * V3 Phase 4: 지급정보 재사용 기능
 */

import type { InstructorPaymentInfo } from '@/entities/settlement/model/payment-info'
import type { UUID } from '@/types'
import { instructorService } from '@/entities/instructor/api/instructor-service'

// Mock 지급정보 저장소 (실제로는 서버에 저장)
const mockPaymentInfos: InstructorPaymentInfo[] = []

/**
 * 강사 지급정보 조회 (재사용)
 */
export async function getPaymentInfo(instructorId: UUID): Promise<InstructorPaymentInfo | null> {
  await new Promise(resolve => setTimeout(resolve, 100))
  const existing = mockPaymentInfos.find(info => info.instructorId === instructorId)
  if (existing) {
    return existing
  }
  return null
}

/**
 * 강사 지급정보 저장/업데이트
 */
export async function savePaymentInfo(
  instructorId: UUID,
  data: Omit<InstructorPaymentInfo, 'instructorId' | 'createdAt' | 'updatedAt' | 'lastUsedAt'>
): Promise<InstructorPaymentInfo> {
  await new Promise(resolve => setTimeout(resolve, 150))
  const existing = mockPaymentInfos.find(info => info.instructorId === instructorId)
  
  if (existing) {
    // 업데이트
    const updated: InstructorPaymentInfo = {
      ...existing,
      ...data,
      lastUsedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const index = mockPaymentInfos.indexOf(existing)
    mockPaymentInfos[index] = updated
    return updated
  } else {
    // 신규 생성
    const newInfo: InstructorPaymentInfo = {
      instructorId,
      ...data,
      personalInfoConsent: data.personalInfoConsent ?? false,
      lastUsedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockPaymentInfos.push(newInfo)
    return newInfo
  }
}

/**
 * 강사 기본 정보로 지급정보 초기화
 */
export async function initializePaymentInfoFromInstructor(
  instructorId: UUID
): Promise<Partial<InstructorPaymentInfo>> {
  await new Promise(resolve => setTimeout(resolve, 50))
  const instructor = instructorService.getByIdSync(instructorId)
  if (!instructor) {
    throw new Error(`강사를 찾을 수 없습니다: ${instructorId}`)
  }
  
  return {
    name: instructor.name,
    phone: instructor.contactPhone || '',
    bankAccount: instructor.bankAccount || '',
    personalInfoConsent: false,
  }
}
