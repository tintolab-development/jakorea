/**
 * 공개 함께하는 사람들 — PublicPeopleResponse → 화면 모델.
 * 섹션 제목·열 수는 role 고정값이다. roleLabel은 쓰지 않는다.
 */

import { PEOPLE_HERO_TITLE } from '../lib/constants.ts'
import type { PeopleMember, PeoplePageContent, PeopleSectionColumns } from '../model/types.ts'
import type { PublicBoardMember, PublicPeopleResponse, PublicPeopleRole } from './types.ts'

type RoleSection = {
  role: PublicPeopleRole
  id: string
  title: string
  columns: PeopleSectionColumns
}

const ROLE_SECTIONS: readonly RoleSection[] = [
  {
    role: 'BOARD_CHAIR_PRESIDENT',
    id: 'board-chair-president',
    title: 'Board Chair & President',
    columns: 2,
  },
  {
    role: 'FIDUCIARY_BOARD_MEMBER',
    id: 'fiduciary-board',
    title: 'Fiduciary Board Member',
    columns: 3,
  },
  {
    role: 'BOARD_CHAIR',
    id: 'board-chair',
    title: 'Board Chair',
    columns: 4,
  },
]

function asText(value: string | undefined | null): string {
  return typeof value === 'string' ? value.trim() : ''
}

function toMember(row: PublicBoardMember, fallbackId: string): PeopleMember | null {
  const name = asText(row.koreanName)
  const englishName = asText(row.englishName)
  const role = asText(row.positionTitle)
  const affiliation = asText(row.affiliationTitle)
  if (!name && !englishName && !role && !affiliation) return null
  return {
    id: row.id != null ? String(row.id) : fallbackId,
    name,
    role,
    affiliation,
    englishName,
  }
}

export function mapPublicPeople(response: PublicPeopleResponse): PeoplePageContent {
  const members = response.boardMembers ?? []
  const sections = ROLE_SECTIONS.map(section => {
    const rows = members
      .filter(row => row.role === section.role)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    const mapped = rows
      .map((row, index) => toMember(row, `${section.id}-${index + 1}`))
      .filter((row): row is PeopleMember => row != null)
    return {
      id: section.id,
      title: section.title,
      columns: section.columns,
      members: mapped,
    }
  }).filter(section => section.members.length > 0)

  return {
    title: asText(response.organizationChart?.title) || PEOPLE_HERO_TITLE,
    imageUrl: asText(response.organizationChart?.imageUrl),
    sections,
  }
}

/** 조직도 이미지 또는 이사회 구성원이 하나라도 있으면 본문을 그린다. */
export function hasPeopleContent(content: PeoplePageContent | null | undefined): boolean {
  if (!content) return false
  return Boolean(content.imageUrl.trim() || content.sections.length > 0)
}
