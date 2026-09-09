import { getMockVolunteerInstitutionAssignment } from '../../assignments'
import type { VolunteerInstitutionGuide } from '../model/types'
import { shouldUsePlatformMockData } from '@/shared/lib/dev-auth'

const GUIDE_BY_SCHOOL: Record<string, Omit<VolunteerInstitutionGuide, 'schoolName'>> = {
  강서초등학교: {
    computerInRoom: '1대 사용 가능, USB는 사용 불가합니다.',
    waitingPlace:
      '후관2층 1-4 옆 강사대기실(늘봄교실1)에서 대기, 정수기는 후관2층 2학년 연구실 이용하시면 됩니다.',
    meal: '가능',
    otherNotes: "본교 주차장이 협소한 관계로 학교 바로 옆 '운남동 공영주차장' 이용 부탁드립니다.",
    criminalCheckRequest: '온라인 제출 | ID : tinto | 검증번호 : 940412',
  },
  진월초등학교: {
    computerInRoom: '2대 사용 가능',
    waitingPlace: '교내 1층 귀빈실',
    meal: '급식실에서 식사 가능하며 해당 계좌로 인당 4,500원씩 입금 부탁드립니다.',
    otherNotes: '있음 | 학교 정문 앞 주차장 사용 가능',
    criminalCheckRequest: '온라인 제출 요청',
  },
}

const FALLBACK_GUIDE: Omit<VolunteerInstitutionGuide, 'schoolName'> = {
  computerInRoom: '1대 사용 가능 | USB 사용 불가',
  waitingPlace: '2층 회의실',
  meal: '미제공',
  otherNotes: '없음',
  criminalCheckRequest: '미요청',
}

export function listMockVolunteerAssignedInstitutionNames(
  lastParticipatedSession?: number,
): string[] {
  if (!shouldUsePlatformMockData()) return []
  const seen = new Set<string>()
  const names: string[] = []
  for (const row of getMockVolunteerInstitutionAssignment(lastParticipatedSession).assigned) {
    const name = row.schoolName.trim()
    if (!name || seen.has(name)) continue
    seen.add(name)
    names.push(name)
  }
  return names
}

export function getMockVolunteerInstitutionGuide(
  schoolName: string,
): VolunteerInstitutionGuide | null {
  if (!shouldUsePlatformMockData()) return null
  const name = schoolName.trim()
  if (!name) return null
  const fields = GUIDE_BY_SCHOOL[name] ?? FALLBACK_GUIDE
  return { schoolName: name, ...fields }
}
