export type PeopleMember = {
  id: string
  name: string
  role: string
  affiliation: string
  englishName: string
}

export type PeopleSectionColumns = 2 | 3 | 4

export type PeopleMemberSection = {
  id: string
  title: string
  columns: PeopleSectionColumns
  members: PeopleMember[]
}

/** 공개 함께하는 사람들 화면 모델. 섹션 제목·열 수는 role로 프론트가 정한다. */
export type PeoplePageContent = {
  title: string
  imageUrl: string
  sections: PeopleMemberSection[]
}
