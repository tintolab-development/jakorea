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
  createNewCompanySchoolRegistrationRhfValues,
  type CompanySchoolRegistrationRhfValues,
} from '@/features/program/1c-1s/lib/registration-rhf-values'
import { getNestedValue } from '@/features/program/general/lib/overlay-phase1/registration-wizard-overlay-path-map'

type CompanySchoolRegistrationWizardFormProviderProps = {
  children: ReactNode
}

export function CompanySchoolRegistrationWizardFormProvider({
  children,
}: CompanySchoolRegistrationWizardFormProviderProps) {
  // 신규 작성 시작값(시안 기본 선택). 임시저장 복원은 reset/applyOverlayRecord 로 저장값을 그대로 싣는다.
  const defaultValues = useMemo(() => createNewCompanySchoolRegistrationRhfValues(), [])
  const form = useForm<CompanySchoolRegistrationRhfValues>({
    defaultValues,
    shouldUnregister: false,
    mode: 'onSubmit',
  })
  const { isDirty } = form.formState

  useEffect(() => {
    form.register('recruitment')
    form.register('instructorRecruit')
    form.register('application')
  }, [form])

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
        // C8: shouldDirty=true → 기본값 대비 dirty 재계산(적용 값이 dirty로 잡힘).
        //     shouldDirty=false → 기존 dirty 상태 유지(적용 값으로 dirty를 만들지 않음).
        //     (이전에는 keepDirty: shouldDirty 로 의미가 뒤집혀 있었다.)
        form.reset(next, {
          keepDirty: options?.shouldDirty !== true,
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
