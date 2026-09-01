import { shouldUsePlatformMockData } from '@/shared/lib/dev-auth'
import type { PeopleMemberSection } from '../model/types'

export const MOCK_PEOPLE_SECTIONS: PeopleMemberSection[] = [
  {
    id: 'board-chair-president',
    title: 'Board Chair & President',
    columns: 2,
    members: [
      {
        id: 'shin-cheulsik',
        name: '신철식',
        role: '이사장',
        affiliation: '우호문화재단 이사장',
        englishName: 'Mr. Cheulsik Shin',
      },
      {
        id: 'lee-eunhyung',
        name: '이은형',
        role: '회장',
        affiliation: '국민대 경영학부 교수',
        englishName: 'Eunhyung Lee',
      },
    ],
  },
  {
    id: 'fiduciary-board',
    title: 'Fiduciary Board Member',
    columns: 3,
    members: [
      {
        id: 'yoon-jongrok',
        name: '윤종록',
        role: '이사',
        affiliation: 'KAIST 과기정책대학원 겸임교수',
        englishName: 'Mr. Jongrok Yoon',
      },
      {
        id: 'john-lee',
        name: '존 리',
        role: '이사',
        affiliation: '존리의 부자학교 대표',
        englishName: 'John Lee',
      },
      {
        id: 'paeng-kyungin',
        name: '팽경인',
        role: '이사',
        affiliation: '서부 T&D 사외이사',
        englishName: 'Mr. Cheulsik Shin',
      },
    ],
  },
  {
    id: 'board-chair',
    title: 'Board Chair',
    columns: 4,
    members: [
      {
        id: 'ryu-hyuksun',
        name: '류혁선',
        role: '이사',
        affiliation: 'KAIST 경영대학 교수',
        englishName: 'Hyuksun Rhu',
      },
      {
        id: 'kim-soyeon',
        name: '김소연',
        role: '이사',
        affiliation: 'Disney Korea 대표',
        englishName: 'Soyeon Kim',
      },
      {
        id: 'hobart-epstein',
        name: '호버트 엡스타인',
        role: '이사',
        affiliation: '원익홀딩스 사외이사',
        englishName: 'Hobart Epsteine',
      },
      {
        id: 'vivian-lau',
        name: '비비안 라우',
        role: '이사',
        affiliation: '퍼시픽 에어 홀딩스 회장/그룹 CEO',
        englishName: 'Vivian Lau',
      },
      {
        id: 'cheon-changwon',
        name: '전창원',
        role: '이사',
        affiliation: '김앤장법률사무소 변호사',
        englishName: 'Changwon Cheon',
      },
      {
        id: 'song-yonju',
        name: '송연주',
        role: '이사',
        affiliation: '삼일회계법인 파트너',
        englishName: 'Yonju Song',
      },
    ],
  },
]

export function getMockPeopleSections(): PeopleMemberSection[] {
  if (!shouldUsePlatformMockData()) return []
  return MOCK_PEOPLE_SECTIONS
}
