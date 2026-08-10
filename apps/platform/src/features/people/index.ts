import type { PeopleMember, PeopleMemberSection, PeopleSectionColumns } from './model/types'
import { PEOPLE_PATH } from './lib/constants'
import { isPeoplePath } from './lib/routes'
import { MOCK_PEOPLE_SECTIONS } from './lib/mock-data'
import { MemberCard } from './ui/member-card'
import { MemberSection } from './ui/member-section'
import orgChartUrl from './image/illustration/org-chart.png'

export type { PeopleMember, PeopleMemberSection, PeopleSectionColumns }
export { PEOPLE_PATH, isPeoplePath, MOCK_PEOPLE_SECTIONS, MemberCard, MemberSection, orgChartUrl }
