import type {
  PeopleMember,
  PeopleMemberSection,
  PeoplePageContent,
  PeopleSectionColumns,
} from './model/types'
import { PEOPLE_HERO_LABEL, PEOPLE_HERO_TITLE, PEOPLE_PATH } from './lib/constants'
import { isPeoplePath } from './lib/routes'
import { usePublicPeople } from './api/hooks'
import { MemberCard } from './ui/member-card'
import { MemberSection } from './ui/member-section'

export type { PeopleMember, PeopleMemberSection, PeoplePageContent, PeopleSectionColumns }
export {
  PEOPLE_HERO_LABEL,
  PEOPLE_HERO_TITLE,
  PEOPLE_PATH,
  isPeoplePath,
  usePublicPeople,
  MemberCard,
  MemberSection,
}
