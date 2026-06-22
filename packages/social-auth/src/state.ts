import { isSocialProvider } from './provider-map'
import type { OAuthIntent, PendingSocialLink, SocialProvider } from './types'

export interface CreateSocialAuthStateOptions {
  storagePrefix?: string
}

export interface SocialAuthState {
  storeOAuthState: (provider: SocialProvider, state: string) => void
  createOAuthState: (provider: SocialProvider) => string
  validateOAuthState: (provider: SocialProvider, state: string | null) => boolean
  setOAuthIntent: (intent: OAuthIntent, returnUrl?: string) => void
  getOAuthIntent: () => OAuthIntent | null
  getReturnUrl: () => string | undefined
  clearOAuthIntent: () => void
  getConnectedProviders: () => Set<SocialProvider>
  addConnectedProvider: (provider: SocialProvider) => void
  removeConnectedProvider: (provider: SocialProvider) => void
  setPendingSocialLink: (link: PendingSocialLink) => void
  getPendingSocialLinks: () => PendingSocialLink[]
  clearPendingSocialLinks: () => void
  removePendingSocialLink: (provider: SocialProvider) => void
}

const DEFAULT_PREFIX = 'social_auth'

function isPendingSocialLink(item: unknown): item is PendingSocialLink {
  if (item === null || typeof item !== 'object') {
    return false
  }
  const link = item as PendingSocialLink
  if (!isSocialProvider(link.provider)) {
    return false
  }
  const hasCode = typeof link.code === 'string' && link.code.length > 0
  const hasSessionId =
    typeof link.socialVerificationSessionId === 'number' &&
    link.socialVerificationSessionId > 0
  return hasCode || hasSessionId
}

export function createSocialAuthState(
  options: CreateSocialAuthStateOptions = {}
): SocialAuthState {
  const prefix = options.storagePrefix ?? DEFAULT_PREFIX
  const oauthStateKey = (provider: SocialProvider) => `${prefix}_oauth_state_${provider}`
  const intentKey = `${prefix}_oauth_intent`
  const returnUrlKey = `${prefix}_oauth_return_url`
  const connectedKey = `${prefix}_connected_providers`
  const pendingLinksKey = `${prefix}_pending_links`

  function readConnectedProviders(): SocialProvider[] {
    try {
      const raw = sessionStorage.getItem(connectedKey)
      if (!raw) return []
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed.filter(isSocialProvider)
    } catch {
      return []
    }
  }

  function writeConnectedProviders(providers: SocialProvider[]) {
    sessionStorage.setItem(connectedKey, JSON.stringify(providers))
  }

  function readPendingLinks(): PendingSocialLink[] {
    try {
      const raw = sessionStorage.getItem(pendingLinksKey)
      if (!raw) return []
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed.filter(isPendingSocialLink)
    } catch {
      return []
    }
  }

  function writePendingLinks(links: PendingSocialLink[]) {
    sessionStorage.setItem(pendingLinksKey, JSON.stringify(links))
  }

  return {
    createOAuthState(provider) {
      const random =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)
      const state = `${provider}:${Date.now()}:${random}`
      localStorage.setItem(oauthStateKey(provider), state)
      return state
    },

    storeOAuthState(provider, state) {
      localStorage.setItem(oauthStateKey(provider), state)
    },

    validateOAuthState(provider, state) {
      if (!state) return false
      const key = oauthStateKey(provider)
      const expected = localStorage.getItem(key)
      const isValid = Boolean(expected) && expected === state
      if (isValid) {
        localStorage.removeItem(key)
      }
      return isValid
    },

    setOAuthIntent(intent, returnUrl) {
      sessionStorage.setItem(intentKey, intent)
      if (returnUrl) {
        sessionStorage.setItem(returnUrlKey, returnUrl)
      } else {
        sessionStorage.removeItem(returnUrlKey)
      }
    },

    getOAuthIntent() {
      const intent = sessionStorage.getItem(intentKey)
      if (intent === 'login' || intent === 'link') {
        return intent
      }
      return null
    },

    getReturnUrl() {
      return sessionStorage.getItem(returnUrlKey) ?? undefined
    },

    clearOAuthIntent() {
      sessionStorage.removeItem(intentKey)
      sessionStorage.removeItem(returnUrlKey)
    },

    getConnectedProviders() {
      return new Set(readConnectedProviders())
    },

    addConnectedProvider(provider) {
      const next = new Set(readConnectedProviders())
      next.add(provider)
      writeConnectedProviders([...next])
    },

    removeConnectedProvider(provider) {
      const next = new Set(readConnectedProviders())
      next.delete(provider)
      writeConnectedProviders([...next])
    },

    setPendingSocialLink(link) {
      const next = readPendingLinks().filter(item => item.provider !== link.provider)
      next.push(link)
      writePendingLinks(next)
    },

    getPendingSocialLinks() {
      return readPendingLinks()
    },

    clearPendingSocialLinks() {
      sessionStorage.removeItem(pendingLinksKey)
    },

    removePendingSocialLink(provider) {
      writePendingLinks(readPendingLinks().filter(item => item.provider !== provider))
    },
  }
}
