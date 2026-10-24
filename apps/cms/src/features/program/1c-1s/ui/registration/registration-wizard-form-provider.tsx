import { useEffect, useMemo, type ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
  notifyCompanySchoolRegistrationRhf,
  registerCompanySchoolRegistrationRhf,
  scheduleCompanySchoolRegistrationRhfNotify,
  type CompanySchoolRegistrationRhfApi,
} from '@/features/program/1c-1s/lib/registration-rhf-api'
import {
  applyCompanySchoolRhfOverlayRecord,
  cloneCompanySchoolRegistrationRhfValues,
  createDefaultCompanySchoolRegistrationRhfValues,
  type CompanySchoolRegistrationRhfValues,
} from '@/features/program/1c-1s/lib/registration-rhf-values'
import { getNestedValue } from '@/features/program/general/lib/overlay-phase1/registration-wizard-overlay-path-map'

type CompanySchoolRegistrationWizardFormProviderProps = {
  children: ReactNode
}

export function CompanySchoolRegistrationWizardFormProvider({
  children,
}: CompanySchoolRegistrationWizardFormProviderProps) {
  const defaultValues = useMemo(() => createDefaultCompanySchoolRegistrationRhfValues(), [])
  const form = useForm<CompanySchoolRegistrationRhfValues>({
    defaultValues,
    shouldUnregister: false,
    mode: 'onSubmit',
  })
  const { isDirty } = form.formState

  useEffect(() => {
    const api: CompanySchoolRegistrationRhfApi = {
      getValues: () => form.getValues(),
      getPath: path => getNestedValue(form.getValues(), path),
      setPath: (path, value, options) => {
        form.setValue(path as never, value as never, {
          shouldDirty: options?.shouldDirty ?? true,
          shouldTouch: options?.shouldDirty ?? true,
        })
        notifyCompanySchoolRegistrationRhf()
      },
      reset: (values, options) => {
        form.reset(cloneCompanySchoolRegistrationRhfValues(values), {
          keepDirty: options?.keepDirty === true,
          keepDefaultValues: options?.keepDefaultValues === true,
        })
        notifyCompanySchoolRegistrationRhf()
      },
      applyOverlayRecord: (overlay, options) => {
        const next = applyCompanySchoolRhfOverlayRecord(form.getValues(), overlay)
        form.reset(next, {
          keepDirty: options?.shouldDirty === true,
          keepDefaultValues: true,
        })
        notifyCompanySchoolRegistrationRhf()
      },
      isDirty: () => form.formState.isDirty,
      markBaseline: () => {
        form.reset(form.getValues(), { keepDirty: false })
        notifyCompanySchoolRegistrationRhf()
      },
    }
    registerCompanySchoolRegistrationRhf(api)
    const subscription = form.watch(() => {
      scheduleCompanySchoolRegistrationRhfNotify()
    })
    return () => {
      subscription.unsubscribe()
      registerCompanySchoolRegistrationRhf(null)
    }
  }, [form])

  useEffect(() => {
    notifyCompanySchoolRegistrationRhf()
  }, [isDirty])

  return <FormProvider {...form}>{children}</FormProvider>
}
