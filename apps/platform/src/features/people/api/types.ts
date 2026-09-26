/** GET /api/public/ja-korea/people — 공개 함께하는 사람들 (무토큰) */

export type PublicPeopleRole =
  | 'BOARD_CHAIR_PRESIDENT'
  | 'FIDUCIARY_BOARD_MEMBER'
  | 'BOARD_CHAIR'

export type PublicBoardMember = {
  id?: number
  role?: PublicPeopleRole | string
  roleLabel?: string
  koreanName?: string
  englishName?: string
  positionTitle?: string
  affiliationTitle?: string
  displayOrder?: number
}

export type PublicOrgChart = {
  title?: string
  imageUrl?: string
}

export type PublicPeopleResponse = {
  organizationChart?: PublicOrgChart
  boardMembers?: PublicBoardMember[]
}
