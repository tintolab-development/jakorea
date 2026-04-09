import { DetailInfoForm } from '@/shared/components/detail-info-form/detail-info-form'
import type { SectionSchema } from './recruitment-schema'

export function renderSchema(section: SectionSchema, isEdit: boolean) {
  return section.rows.map((row, i) => (
    <DetailInfoForm.Row key={i} type={row.columns === 2 ? 'double' : 'single'}>
      {row.fields.map((field, j) => (
        <DetailInfoForm.Field
          key={j}
          label={field.label}
          required={field.required}
          fullRow={field.fullRow}
          view={field.view}
          edit={isEdit ? field.edit : undefined}
        />
      ))}
    </DetailInfoForm.Row>
  ))
}
