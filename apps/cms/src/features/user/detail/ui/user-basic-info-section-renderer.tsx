import {
  BasicInfoLayout,
  BasicInfoSectionTypes,
  type BasicInfoLayoutResolved,
} from './user-basic-info-layout-resolver'
import type { BasicInfoSectionContext } from './user-basic-info/sections/types'
import { AllUsersSection } from './user-basic-info/sections/all-users-section'
import { InstitutionSection } from './user-basic-info/sections/institution-section'
import {
  SchoolTeacherMetaSection,
  SchoolTeacherSection,
} from './user-basic-info/sections/school-teacher-section'
import { InstructorMetaSection, InstructorSection } from './user-basic-info/sections/instructor-section'
import { AdminSection } from './user-basic-info/sections/admin-section'

export type BasicInfoSectionRenderContext = BasicInfoSectionContext

export function renderResolvedBasicInfoSections({
  resolution,
  shared,
}: {
  resolution: BasicInfoLayoutResolved
  shared: BasicInfoSectionRenderContext
}) {
  if (resolution.layout === BasicInfoLayout.SPLIT_CARD) {
    const [metaSection, profileSection] = resolution.sections
    return {
      meta:
        metaSection === BasicInfoSectionTypes.META ? (
          resolution.instructorSectionVariant === 'school_teacher' ? (
            <SchoolTeacherMetaSection {...shared} />
          ) : (
            <InstructorMetaSection {...shared} />
          )
        ) : null,
      profile:
        profileSection === BasicInfoSectionTypes.PROFILE ? (
          resolution.instructorSectionVariant === 'school_teacher' ? (
            <SchoolTeacherSection {...shared} />
          ) : (
            <InstructorSection {...shared} />
          )
        ) : null,
    }
  }

  const [section] = resolution.sections
  return {
    single:
      section === BasicInfoSectionTypes.ALL_USERS ? (
        <AllUsersSection {...shared} />
      ) : section === BasicInfoSectionTypes.INSTITUTION ? (
        <InstitutionSection {...shared} />
      ) : (
        <AdminSection {...shared} />
      ),
  }
}
