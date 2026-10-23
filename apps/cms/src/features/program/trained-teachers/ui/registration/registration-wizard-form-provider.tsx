import { useEffect, useMemo, type ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
  notifyTrainedTeachersRegistrationRhf,
  registerTrainedTeachersRegistrationRhf,
  type TrainedTeachersRegistrationRhfApi,
} from '@/features/program/trained-teachers/lib/registration-rhf-api'
import {
  applyTrainedTeachersRhfOverlayRecord,
  cloneTrainedTeachersRegistrationRhfValues,
  createDefaultTrainedTeachersRegistrationRhfValues,
  type TrainedTeachersRegistrationRhfValues,
} from '@/features/program/trained-teachers/lib/registration-rhf-values'
import { getNestedValue } from '@/features/program/general/lib/overlay-phase1/registration-wizard-overlay-path-map'

type TrainedTeachersRegistrationWizardFormProviderProps = {
  children: ReactNode
}

export function TrainedTeachersRegistrationWizardFormProvider({
  children,
}: TrainedTeachersRegistrationWizardFormProviderProps) {
  const defaultValues = useMemo(() => createDefaultTrainedTeachersRegistrationRhfValues(), [])
  const form = useForm<TrainedTeachersRegistrationRhfValues>({
    defaultValues,
    shouldUnregister: false,
    mode: 'onSubmit',
  })
  const { isDirty } = form.formState

  useEffect(() => {
    const api: TrainedTeachersRegistrationRhfApi = {
      getValues: () => form.getValues(),
      getPath: path => getNestedValue(form.getValues(), path),
      setPath: (path, value, options) => {
        form.setValue(path as never, value as never, {
          shouldDirty: options?.shouldDirty ?? true,
          shouldTouch: options?.shouldDirty ?? true,
        })
        notifyTrainedTeachersRegistrationRhf()
      },
      reset: (values, options) => {
        form.reset(cloneTrainedTeachersRegistrationRhfValues(values), {
          keepDirty: options?.keepDirty === true,
          keepDefaultValues: options?.keepDefaultValues === true,
        })
        notifyTrainedTeachersRegistrationRhf()
      },
      applyOverlayRecord: (overlay, options) => {
        const next = applyTrainedTeachersRhfOverlayRecord(form.getValues(), overlay)
        form.reset(next, {
          keepDirty: options?.shouldDirty === true,
          keepDefaultValues: true,
        })
        notifyTrainedTeachersRegistrationRhf()
      },
      isDirty: () => form.formState.isDirty,
      markBaseline: () => {
        form.reset(form.getValues(), { keepDirty: false })
        notifyTrainedTeachersRegistrationRhf()
      },
    }
    registerTrainedTeachersRegistrationRhf(api)
    const subscription = form.watch(() => {
      notifyTrainedTeachersRegistrationRhf()
    })
    return () => {
      subscription.unsubscribe()
      registerTrainedTeachersRegistrationRhf(null)
    }
  }, [form])

  useEffect(() => {
    notifyTrainedTeachersRegistrationRhf()
  }, [isDirty])

  return <FormProvider {...form}>{children}</FormProvider>
}
