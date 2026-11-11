import { useEffect, useMemo, type ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
  notifyTrainedTeachersRegistrationRhf,
  registerTrainedTeachersRegistrationRhf,
  scheduleTrainedTeachersRegistrationRhfNotify,
  type TrainedTeachersRegistrationRhfApi,
} from '@/features/program/trained-teachers/lib/registration-rhf-api'
import {
  applyTrainedTeachersRhfOverlayRecord,
  cloneTrainedTeachersRegistrationRhfValues,
  createNewTrainedTeachersRegistrationRhfValues,
  type TrainedTeachersRegistrationRhfValues,
} from '@/features/program/trained-teachers/lib/registration-rhf-values'
import { getNestedValue } from '@/features/program/general/lib/overlay-phase1/registration-wizard-overlay-path-map'

type TrainedTeachersRegistrationWizardFormProviderProps = {
  children: ReactNode
}

export function TrainedTeachersRegistrationWizardFormProvider({
  children,
}: TrainedTeachersRegistrationWizardFormProviderProps) {
  // 신규 등록 위저드 — 시안 기본 선택값으로 시작. 임시저장 복원은 위저드가 reset으로 덮는다.
  const defaultValues = useMemo(() => createNewTrainedTeachersRegistrationRhfValues(), [])
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
      scheduleTrainedTeachersRegistrationRhfNotify()
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
