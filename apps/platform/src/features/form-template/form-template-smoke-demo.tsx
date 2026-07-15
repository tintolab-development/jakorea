import { FormTemplateHost, FormTemplateRenderer } from '@/features/form-template'
import { FORM_TEMPLATE_SMOKE_DRAFT } from '@/features/form-template/mock-smoke-draft'
import { PFText } from '@/shared/ui'
import styles from './form-template-smoke-demo.module.css'

export function FormTemplateSmokeDemo() {
  return (
    <div className={styles.root}>
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
        CMS 템플릿 surface embed — DetailInfoForm radius 16px (platformUser), CMS 타이포 유지.
      </PFText>
      <FormTemplateHost surface="platformUser">
        <FormTemplateRenderer
          draft={FORM_TEMPLATE_SMOKE_DRAFT}
          interactionMode="preview"
          surface="platformUser"
        />
      </FormTemplateHost>
    </div>
  )
}
