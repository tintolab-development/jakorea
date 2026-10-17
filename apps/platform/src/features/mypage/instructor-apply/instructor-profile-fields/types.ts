import type { Dispatch, SetStateAction } from 'react'
import type { InstructorSharedProfileFormValues } from '@jakorea/domain/instructor/profile-form-values'

export type InstructorProfileFieldsProps = {
  values: InstructorSharedProfileFormValues
  onValuesChange: Dispatch<SetStateAction<InstructorSharedProfileFormValues>>
}
