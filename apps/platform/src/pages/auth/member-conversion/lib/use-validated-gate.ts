import { useEffect, useState } from 'react'
import { restoreAgeTransitionNiceValidation } from '@/features/auth/age-transition'
import { hasMemberConversionIdentity } from './identity-session'

export function useMemberConversionValidatedGate() {
  const [gate, setGate] = useState<'pending' | 'ok' | 'block'>(() =>
    hasMemberConversionIdentity() ? 'pending' : 'block',
  )

  useEffect(() => {
    if (!hasMemberConversionIdentity()) {
      setGate('block')
      return
    }
    let cancelled = false
    void restoreAgeTransitionNiceValidation().then(result => {
      if (cancelled) return
      setGate(result === 'blocked' ? 'block' : 'ok')
    })
    return () => {
      cancelled = true
    }
  }, [])

  return gate
}
