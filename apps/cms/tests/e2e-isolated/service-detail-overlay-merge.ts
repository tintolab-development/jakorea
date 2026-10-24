function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function parseJsonObject(raw: unknown): Record<string, unknown> {
  if (isRecord(raw)) return raw
  if (typeof raw !== 'string' || raw.trim() === '') return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function mergeOverlayKeys(
  prev: Record<string, unknown>,
  incoming: Record<string, unknown>
): Record<string, unknown> {
  return { ...prev, ...incoming }
}

export function bodyHasRootRegistrationOverlay(body: unknown): boolean {
  if (!isRecord(body)) return false
  const service = parseJsonObject(body.serviceDetailJson)
  return Object.prototype.hasOwnProperty.call(service, 'registrationOverlay')
}

export function noteRootRegistrationOverlay(
  log: { rootRegistrationOverlayHits: number },
  body: unknown
) {
  if (bodyHasRootRegistrationOverlay(body)) {
    log.rootRegistrationOverlayHits += 1
  }
}

/** 저장·GET 정본: nested registration.overlay만. 루트 registrationOverlay는 버린다. */
export function canonicalizeServiceDetailJson(raw: unknown): string {
  const service = parseJsonObject(raw)
  const { registrationOverlay: _drop, ...rest } = service
  const registration = parseJsonObject(rest.registration)
  return JSON.stringify({
    ...rest,
    ...(Object.keys(registration).length > 0
      ? {
          registration: {
            ...registration,
            overlay: parseJsonObject(registration.overlay),
          },
        }
      : {}),
  })
}

export function mergeServiceDetailForProgramPatch(
  prevRaw: unknown,
  incomingRaw: unknown
): string {
  const prevJson = parseJsonObject(prevRaw)
  const incoming = parseJsonObject(incomingRaw)
  const { registrationOverlay: _incomingRoot, ...incomingRest } = incoming
  const { registrationOverlay: _prevRoot, ...prevRest } = prevJson
  const prevProgram = parseJsonObject(prevRest.program)
  const nextProgram = parseJsonObject(incomingRest.program)
  const prevCommon = parseJsonObject(prevProgram.generalCommonInfo)
  const incomingCommon = parseJsonObject(nextProgram.generalCommonInfo)
  const prevReg = parseJsonObject(prevRest.registration)
  const incReg = parseJsonObject(incomingRest.registration)
  const incomingHasRegistration = Object.prototype.hasOwnProperty.call(
    incomingRest,
    'registration'
  )
  const overlay = incomingHasRegistration
    ? mergeOverlayKeys(parseJsonObject(prevReg.overlay), parseJsonObject(incReg.overlay))
    : parseJsonObject(prevReg.overlay)
  const registration = incomingHasRegistration ? { ...prevReg, ...incReg, overlay } : prevReg
  return JSON.stringify({
    schemaVersion: incomingRest.schemaVersion ?? prevRest.schemaVersion ?? 1,
    ...prevRest,
    ...incomingRest,
    program: {
      ...prevProgram,
      ...nextProgram,
      generalCommonInfo:
        Object.keys(incomingCommon).length > 0
          ? { ...prevCommon, ...incomingCommon }
          : prevCommon,
    },
    ...(Object.keys(registration).length > 0 ? { registration } : {}),
  })
}
