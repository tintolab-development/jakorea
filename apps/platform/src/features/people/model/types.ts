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
