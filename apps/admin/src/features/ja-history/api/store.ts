import {
  JaHistorySaveError,
  type JaHistoryCtaSaveInput,
  type JaHistoryData,
  type JaHistoryEraSaveInput,
  type JaHistoryHeroSaveInput,
  type JaHistoryMedia,
  type JaHistoryOriginSaveInput,
  type JaHistoryPhilosophySaveInput,
  type JaHistoryThriveSaveInput,
  type JaHistoryTimeline,
  type JaHistoryTimelineSaveInput,
} from '@/entities/ja-history/model/types'
import { buildJaHistorySeed } from './seed'

export const JA_HISTORY_CHANGED_EVENT = 'ja-history-changed'
const STORAGE_KEY = 'admin.ja-history.v1'

type JaHistoryFile = {
  version: 1
  data: JaHistoryData
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function requireText(value: string, label: string): string {
  const next = value.trim()
  if (!next) {
    throw new JaHistorySaveError('REQUIRED', `${label} 항목을 입력해 주세요.`)
  }
  return value.trimEnd()
}

function mediaFrom(raw: unknown, fallback: JaHistoryMedia, locked: boolean): JaHistoryMedia {
  if (locked) return fallback
  if (!raw || typeof raw !== 'object') return fallback
  const record = raw as Partial<JaHistoryMedia>
  const url = asString(record.url, '').trim()
  if (!url) return fallback
  return {
    assetId: typeof record.assetId === 'number' ? record.assetId : fallback.assetId,
    url,
    fileName: asString(record.fileName, fallback.fileName),
    alt: fallback.alt,
  }
}

function normalizeTimeline(raw: unknown, seed: JaHistoryTimeline): JaHistoryTimeline {
  const source = raw && typeof raw === 'object' ? (raw as Partial<JaHistoryTimeline>) : {}
  const rawPeriods = Array.isArray(source.periods) ? source.periods : []
  return {
    image: mediaFrom(source.image, seed.image, false),
    title: asString(source.title, seed.title),
    body: asString(source.body, seed.body),
    periods: seed.periods.map(period => {
      const stored = rawPeriods.find(item => item && item.id === period.id)
      const storedEvents = stored && Array.isArray(stored.events) ? stored.events : []
      return {
        id: period.id,
        label: period.label,
        title: stored ? asString(stored.title, period.title) : period.title,
        events:
          period.events.length > 0
            ? period.events.map(event => {
                const match = storedEvents.find(item => item && item.year === event.year)
                return {
                  year: event.year,
                  text: match ? asString(match.text, event.text) : event.text,
                }
              })
            : storedEvents
                .filter(item => item && String(item.year ?? '').trim() && asString(item.text, '').trim())
                .slice(0, 3)
                .map(item => ({
                  year: String(item.year).trim(),
                  text: asString(item.text, ''),
                })),
      }
    }),
  }
}

function normalizeData(raw: Partial<JaHistoryData> | null | undefined): JaHistoryData {
  const seed = buildJaHistorySeed()
  if (!raw || typeof raw !== 'object') return seed
  const origin = raw.origin
  const philosophy = raw.philosophy
  const thrive = raw.thrive
  const cta = raw.cta
  const rawEras = Array.isArray(raw.eras) ? raw.eras : []
  const rawCards = philosophy && Array.isArray(philosophy.cards) ? philosophy.cards : []
  const rawThriveCards = thrive && Array.isArray(thrive.cards) ? thrive.cards : []

  return {
    hero: {
      image: mediaFrom(raw.hero?.image, seed.hero.image, false),
      eyebrow: asString(raw.hero?.eyebrow, seed.hero.eyebrow),
      mainText: asString(raw.hero?.mainText, seed.hero.mainText),
    },
    origin: {
      yearMark: seed.origin.yearMark,
      title: asString(origin?.title, seed.origin.title),
      body: asString(origin?.body, seed.origin.body),
      learningEyebrow: asString(origin?.learningEyebrow, seed.origin.learningEyebrow),
      learningTitle: asString(origin?.learningTitle, seed.origin.learningTitle),
      learningBody: asString(origin?.learningBody, seed.origin.learningBody),
      learningImage: seed.origin.learningImage,
      learningOutro: asString(origin?.learningOutro, seed.origin.learningOutro),
      learningEmphasis: asString(origin?.learningEmphasis, seed.origin.learningEmphasis),
    },
    eras: seed.eras.map(era => {
      const stored = rawEras.find(item => item && item.year === era.year)
      return {
        year: era.year,
        image: era.image,
        caption: stored ? asString(stored.caption, era.caption) : era.caption,
      }
    }),
    worldTimeline: normalizeTimeline(raw.worldTimeline, seed.worldTimeline),
    philosophy: {
      eyebrow: asString(philosophy?.eyebrow, seed.philosophy.eyebrow),
      title: asString(philosophy?.title, seed.philosophy.title),
      lead: asString(philosophy?.lead, seed.philosophy.lead),
      cards: seed.philosophy.cards.map(card => {
        const stored = rawCards.find(item => item && item.id === card.id)
        return {
          id: card.id,
          title: stored ? asString(stored.title, card.title) : card.title,
          description: stored ? asString(stored.description, card.description) : card.description,
          image: card.image,
        }
      }),
    },
    koreaTimeline: normalizeTimeline(raw.koreaTimeline, seed.koreaTimeline),
    thrive: {
      title: asString(thrive?.title, seed.thrive.title),
      lead: asString(thrive?.lead, seed.thrive.lead),
      footnote: asString(thrive?.footnote, seed.thrive.footnote),
      cards: seed.thrive.cards.map(card => {
        const stored = rawThriveCards.find(item => item && item.id === card.id)
        return {
          id: card.id,
          title: stored ? asString(stored.title, card.title) : card.title,
          description: stored ? asString(stored.description, card.description) : card.description,
          decoration: card.decoration,
        }
      }),
    },
    cta: {
      title: asString(cta?.title, seed.cta.title),
      body: asString(cta?.body, seed.cta.body),
      image: seed.cta.image,
      primaryLabel: asString(cta?.primaryLabel, seed.cta.primaryLabel),
      primaryHref: asString(cta?.primaryHref, seed.cta.primaryHref),
      secondaryLabel: asString(cta?.secondaryLabel, seed.cta.secondaryLabel),
      secondaryHref: asString(cta?.secondaryHref, seed.cta.secondaryHref),
    },
    updatedAt: asString(raw.updatedAt, seed.updatedAt),
    version: typeof raw.version === 'number' ? raw.version : seed.version,
  }
}

function readFile(): JaHistoryFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, data: buildJaHistorySeed() }
    const parsed = JSON.parse(raw) as JaHistoryFile
    if (parsed?.version !== 1 || !parsed.data) {
      return { version: 1, data: buildJaHistorySeed() }
    }
    return { version: 1, data: normalizeData(parsed.data) }
  } catch {
    return { version: 1, data: buildJaHistorySeed() }
  }
}

function writeFile(file: JaHistoryFile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  } catch {
    throw new JaHistorySaveError(
      'STORAGE_QUOTA',
      '저장 공간이 부족합니다. 이미지 용량을 줄인 뒤 다시 시도해 주세요.',
    )
  }
  window.dispatchEvent(new CustomEvent(JA_HISTORY_CHANGED_EVENT))
}

function commit(data: JaHistoryData): JaHistoryData {
  const next = { ...data, updatedAt: new Date().toISOString() }
  writeFile({ version: 1, data: next })
  return next
}

export function readJaHistory(): JaHistoryData {
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  return file.data
}

export function saveJaHistoryHero(input: JaHistoryHeroSaveInput): JaHistoryData {
  const imageUrl = input.imageUrl.trim()
  if (!imageUrl) {
    throw new JaHistorySaveError('REQUIRED', '히어로 이미지를 등록해 주세요.')
  }
  const current = readJaHistory()
  return commit({
    ...current,
    hero: {
      image: {
        url: imageUrl,
        fileName: input.imageFileName.trim() || current.hero.image.fileName,
        alt: current.hero.image.alt,
      },
      eyebrow: requireText(input.eyebrow, '상단 라벨'),
      mainText: requireText(input.mainText, '메인 텍스트'),
    },
  })
}

export function saveJaHistoryOrigin(input: JaHistoryOriginSaveInput): JaHistoryData {
  const current = readJaHistory()
  return commit({
    ...current,
    origin: {
      ...current.origin,
      title: requireText(input.title, '소개 타이틀'),
      body: requireText(input.body, '소개 텍스트'),
      learningEyebrow: requireText(input.learningEyebrow, 'LEARNING BY DOING'),
      learningTitle: requireText(input.learningTitle, '상단 타이틀'),
      learningBody: requireText(input.learningBody, '상단 텍스트'),
      learningOutro: requireText(input.learningOutro, '하단 메인 텍스트'),
      learningEmphasis: requireText(input.learningEmphasis, '하단 서브 텍스트'),
    },
  })
}

export function saveJaHistoryEras(input: JaHistoryEraSaveInput[]): JaHistoryData {
  const current = readJaHistory()
  return commit({
    ...current,
    eras: current.eras.map(era => {
      const stored = input.find(item => item.year === era.year)
      return {
        ...era,
        caption: requireText(stored?.caption ?? '', `${era.year} 설명 텍스트`),
      }
    }),
  })
}

export function saveJaHistoryTimeline(
  key: 'worldTimeline' | 'koreaTimeline',
  input: JaHistoryTimelineSaveInput,
): JaHistoryData {
  const imageUrl = input.imageUrl.trim()
  if (!imageUrl) {
    throw new JaHistorySaveError('REQUIRED', '대표 이미지를 등록해 주세요.')
  }
  const current = readJaHistory()
  const seed = current[key]
  return commit({
    ...current,
    [key]: {
      image: {
        url: imageUrl,
        fileName: input.imageFileName.trim() || seed.image.fileName,
        alt: seed.image.alt,
      },
      title: requireText(input.title, '타이틀'),
      body: requireText(input.body, '서브 텍스트'),
      periods: seed.periods.map(period => {
        const stored = input.periods.find(item => item.id === period.id)
        if (period.events.length === 0) {
          const events = (stored?.events ?? [])
            .filter(event => event.year.trim() && event.text.trim())
            .slice(0, 3)
            .map(event => ({
              year: event.year.trim(),
              text: requireText(event.text, `${period.label} ${event.year.trim()} 설명`),
            }))
          return {
            ...period,
            title: events.length
              ? requireText(stored?.title ?? '', `${period.label} 제목`)
              : (stored?.title ?? period.title).trimEnd(),
            events,
          }
        }
        return {
          ...period,
          title: requireText(stored?.title ?? '', `${period.label} 제목`),
          events: period.events.map(event => {
            const match = stored?.events.find(item => item.year === event.year)
            return {
              year: event.year,
              text: requireText(match?.text ?? '', `${period.label} ${event.year} 설명`),
            }
          }),
        }
      }),
    },
  })
}

export function saveJaHistoryPhilosophy(input: JaHistoryPhilosophySaveInput): JaHistoryData {
  const current = readJaHistory()
  return commit({
    ...current,
    philosophy: {
      ...current.philosophy,
      eyebrow: requireText(input.eyebrow, '상단 라벨'),
      title: requireText(input.title, '타이틀'),
      lead: requireText(input.lead, '소개 텍스트'),
      cards: current.philosophy.cards.map(card => {
        const stored = input.cards.find(item => item.id === card.id)
        const nextImage = stored?.imageUrl?.trim()
          ? {
              ...card.image,
              url: stored.imageUrl.trim(),
              fileName: stored.imageFileName?.trim() || card.image.fileName,
              assetId: undefined,
            }
          : card.image
        return {
          ...card,
          title: requireText(stored?.title ?? '', '카드 제목'),
          description: requireText(stored?.description ?? '', '카드 설명'),
          image: nextImage,
        }
      }),
    },
  })
}

export function saveJaHistoryThrive(input: JaHistoryThriveSaveInput): JaHistoryData {
  const current = readJaHistory()
  return commit({
    ...current,
    thrive: {
      ...current.thrive,
      title: requireText(input.title, '타이틀'),
      lead: requireText(input.lead, '서브 텍스트'),
      footnote: requireText(input.footnote, '하단 텍스트'),
      cards: current.thrive.cards.map(card => {
        const stored = input.cards.find(item => item.id === card.id)
        return {
          ...card,
          title: requireText(stored?.title ?? '', '제목'),
          description: requireText(stored?.description ?? '', '설명'),
        }
      }),
    },
  })
}

export function saveJaHistoryCta(input: JaHistoryCtaSaveInput): JaHistoryData {
  const current = readJaHistory()
  return commit({
    ...current,
    cta: {
      ...current.cta,
      title: requireText(input.title, '타이틀'),
      body: requireText(input.body, '서브 텍스트'),
      image: input.imageUrl?.trim()
        ? {
            ...current.cta.image,
            url: input.imageUrl.trim(),
            fileName: input.imageFileName?.trim() || current.cta.image.fileName,
          }
        : current.cta.image,
      primaryLabel: requireText(input.primaryLabel, '버튼명 01'),
      primaryHref: requireText(input.primaryHref, '연결 링크 01'),
      secondaryLabel: requireText(input.secondaryLabel, '버튼명 02'),
      secondaryHref: requireText(input.secondaryHref, '연결 링크 02'),
    },
  })
}
