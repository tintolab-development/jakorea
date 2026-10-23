import { useEffect, useMemo, type ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
  notifyGeneralRegistrationWizardRhf,
  registerGeneralRegistrationWizardRhf,
  type GeneralRegistrationWizardRhfApi,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-rhf-api'
import {
  getNestedValue,
  overlayKeyToWizardUiPath,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-overlay-path-map'
import {
  cloneRegistrationWizardUiValues,
  createDefaultRegistrationWizardUiValues,
  type RegistrationWizardUiValues,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-ui-values'

type GeneralRegistrationWizardFormProviderProps = {
  children: ReactNode
}

export function GeneralRegistrationWizardFormProvider({
  children,
}: GeneralRegistrationWizardFormProviderProps) {
  const defaultValues = useMemo(() => createDefaultRegistrationWizardUiValues(), [])
  const form = useForm<RegistrationWizardUiValues>({
    defaultValues,
    shouldUnregister: false,
    mode: 'onSubmit',
  })
  const { isDirty } = form.formState

  useEffect(() => {
    const api: GeneralRegistrationWizardRhfApi = {
      getValues: () => form.getValues(),
      getPath: path => form.getValues(path as never),
      setPath: (path, value, options) => {
        form.setValue(path as never, value as never, {
          shouldDirty: options?.shouldDirty ?? true,
          shouldTouch: options?.shouldDirty ?? true,
        })
        notifyGeneralRegistrationWizardRhf()
      },
      reset: (values, options) => {
        form.reset(cloneRegistrationWizardUiValues(values), {
          keepDirty: options?.keepDirty === true,
          keepDefaultValues: options?.keepDefaultValues === true,
        })
        notifyGeneralRegistrationWizardRhf()
      },
      applyOverlayRecord: (overlay, options) => {
        for (const [key, value] of Object.entries(overlay)) {
          const path = overlayKeyToWizardUiPath(key)
          if (path == null) continue
          form.setValue(path as never, value as never, {
            shouldDirty: options?.shouldDirty ?? false,
            shouldTouch: false,
          })
        }
        notifyGeneralRegistrationWizardRhf()
      },
      isDirty: () => form.formState.isDirty,
      markBaseline: () => {
        form.reset(form.getValues(), { keepDirty: false })
        notifyGeneralRegistrationWizardRhf()
      },
    }
    registerGeneralRegistrationWizardRhf(api)
    const subscription = form.watch(() => {
      notifyGeneralRegistrationWizardRhf()
    })
    return () => {
      subscription.unsubscribe()
      registerGeneralRegistrationWizardRhf(null)
    }
  }, [form])

  useEffect(() => {
    notifyGeneralRegistrationWizardRhf()
  }, [isDirty])

  return <FormProvider {...form}>{children}</FormProvider>
}

export function readWizardFormNestedValue(
  values: RegistrationWizardUiValues,
  path: string
): unknown {
  return getNestedValue(values, path)
}
