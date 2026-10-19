import { Controller, useWatch, type Control, type FieldValues, type Path } from 'react-hook-form'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'

export type ProgramPortalHomeFeaturedFormValues = {
  featuredOnHome: boolean
  homeDisplayOrder: string
}

type ProgramPortalHomeFeaturedFieldsProps<TFieldValues extends FieldValues> = {
  isEdit?: boolean
  featuredOnHome: boolean
  homeDisplayOrder?: number | null
  control?: Control<TFieldValues>
}

function FeaturedOrderInput<TFieldValues extends FieldValues>({
  control,
}: {
  control: Control<TFieldValues>
}) {
  const featuredName = 'featuredOnHome' as Path<TFieldValues>
  const orderName = 'homeDisplayOrder' as Path<TFieldValues>
  const featuredOnHome = useWatch({ control, name: featuredName })

  return (
    <Controller
      name={orderName}
      control={control}
      render={({ field }) => (
        <CmsInput
          {...field}
          value={field.value ?? ''}
          placeholder="1 이상 정수"
          width="100%"
          disabled={featuredOnHome !== true}
        />
      )}
    />
  )
}

export function ProgramPortalHomeFeaturedFields<TFieldValues extends FieldValues>({
  isEdit = false,
  featuredOnHome,
  homeDisplayOrder,
  control,
}: ProgramPortalHomeFeaturedFieldsProps<TFieldValues>) {
  const editControl = isEdit ? control : undefined
  const featuredName = 'featuredOnHome' as Path<TFieldValues>

  return (
    <DetailInfoForm.Row type="double">
      <DetailInfoForm.Field
        label="Platform 홈 노출"
        view={featuredOnHome ? '노출' : '미노출'}
        edit={
          editControl ? (
            <Controller
              name={featuredName}
              control={editControl}
              render={({ field }) => (
                <CmsRadioGroup
                  size="large"
                  value={field.value ? 'yes' : 'no'}
                  onChange={event => field.onChange(event.target.value === 'yes')}
                >
                  <CmsRadio value="yes">노출</CmsRadio>
                  <CmsRadio value="no">미노출</CmsRadio>
                </CmsRadioGroup>
              )}
            />
          ) : undefined
        }
      />
      <DetailInfoForm.Field
        label="홈 노출 순서"
        view={
          featuredOnHome && homeDisplayOrder != null ? String(homeDisplayOrder) : '-'
        }
        edit={editControl ? <FeaturedOrderInput control={editControl} /> : undefined}
      />
    </DetailInfoForm.Row>
  )
}
