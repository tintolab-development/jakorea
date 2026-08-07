/**
 * JA Korea 소개 관리 — localStorage mock (API 연동 전)
 */

import type {
  IntroContentBlock,
  IntroSection01,
  IntroSection02,
  JaKoreaIntro,
  VisionMission,
} from '@/entities/ja-korea-intro/model/types'

const STORAGE_KEY = 'admin.jakorea.jaKoreaIntro.v1'

export const JA_KOREA_INTRO_CHANGED_EVENT = 'jakorea:ja-korea-intro-changed' as const

type IntroFile = {
  version: 1
  data: JaKoreaIntro
}

function buildSeedIntro(): JaKoreaIntro {
  const now = '2026-07-01T00:00:00.000Z'
  return {
    section01: {
      mainTitle: '청소년이 마음껏 역량을 발휘하며 성공할 수 있도록 함께합니다',
      subTitle: 'JA Korea는 청소년의 무한한 가능성을 믿습니다',
    },
    section02: {
      titlePhrase: 'Inspiring Youth',
      subTitle: 'JA Korea는 청소년의 가능성을 미래로 연결합니다',
      content01: {
        title: '청소년을 위한 글로벌 교육 네트워크',
        description:
          'JA Korea는 국제 교육 비영리기구(NGO)인 JA Worldwide의 한국 지부입니다. 2002년부터 청소년에게 진로·취업, 경제·금융, 기업가정신, 디지털 리터러시 교육을 제공합니다.',
      },
      content02: {
        title: '청소년의 미래를 위한 체계적인 배움 경험',
        description:
          '관심 있는 분야를 탐색하며 영감(Inspire)을 얻고, 지식과 기술을 습득하며 미래를 체계적으로 준비(Prepare)하고, 배우고 협력하는 과정을 통해 성공(Succeed)을 경험하도록 돕습니다.',
      },
    },
    vision: {
      topSubText: 'Young people have the skillset and mindset to build thriving communities.',
      mainText: '공동체의 성장을 이끌 수 있는 역량과 마음가짐을 갖춘 청소년이 되도록 교육합니다.',
    },
    mission: {
      topSubText: 'JA inspires and prepares young people to succeed in a global economy.',
      mainText: '청소년이 마음껏 역량을 발휘하며 성공할 수 있도록 함께합니다.',
    },
    updatedAt: now,
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function normalizeContentBlock(
  raw: Partial<IntroContentBlock> | null | undefined,
  seed: IntroContentBlock
): IntroContentBlock {
  return {
    title: asString(raw?.title, seed.title),
    description: asString(raw?.description, seed.description),
  }
}

function normalizeSection01(
  raw: Partial<IntroSection01> | null | undefined,
  seed: IntroSection01
): IntroSection01 {
  return {
    mainTitle: asString(raw?.mainTitle, seed.mainTitle),
    subTitle: asString(raw?.subTitle, seed.subTitle),
  }
}

function normalizeSection02(
  raw: Partial<IntroSection02> | null | undefined,
  seed: IntroSection02
): IntroSection02 {
  return {
    titlePhrase: asString(raw?.titlePhrase, seed.titlePhrase),
    subTitle: asString(raw?.subTitle, seed.subTitle),
    content01: normalizeContentBlock(raw?.content01, seed.content01),
    content02: normalizeContentBlock(raw?.content02, seed.content02),
  }
}

function normalizeVisionMission(
  raw: Partial<VisionMission> | null | undefined,
  seed: VisionMission
): VisionMission {
  return {
    topSubText: asString(raw?.topSubText, seed.topSubText),
    mainText: asString(raw?.mainText, seed.mainText),
  }
}

function normalizeIntro(raw: Partial<JaKoreaIntro> | null | undefined): JaKoreaIntro {
  const seed = buildSeedIntro()
  if (!raw || typeof raw !== 'object') return seed
  return {
    section01: normalizeSection01(raw.section01, seed.section01),
    section02: normalizeSection02(raw.section02, seed.section02),
    vision: normalizeVisionMission(raw.vision, seed.vision),
    mission: normalizeVisionMission(raw.mission, seed.mission),
    updatedAt: asString(raw.updatedAt, seed.updatedAt),
  }
}

function readIntroFile(): IntroFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, data: buildSeedIntro() }
    const parsed = JSON.parse(raw) as IntroFile
    if (parsed?.version !== 1 || !parsed.data) {
      return { version: 1, data: buildSeedIntro() }
    }
    return { version: 1, data: normalizeIntro(parsed.data) }
  } catch {
    return { version: 1, data: buildSeedIntro() }
  }
}

function writeIntroFile(file: IntroFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(JA_KOREA_INTRO_CHANGED_EVENT))
}

export function readJaKoreaIntro(): JaKoreaIntro {
  const file = readIntroFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeIntroFile(file)
  }
  return file.data
}

function trimContentBlock(block: IntroContentBlock): IntroContentBlock {
  return {
    title: block.title.trim(),
    description: block.description.trimEnd(),
  }
}

export function saveJaKoreaIntro(data: JaKoreaIntro): JaKoreaIntro {
  const next = normalizeIntro({
    section01: {
      mainTitle: data.section01.mainTitle.trim(),
      subTitle: data.section01.subTitle.trim(),
    },
    section02: {
      titlePhrase: data.section02.titlePhrase.trim(),
      subTitle: data.section02.subTitle.trim(),
      content01: trimContentBlock(data.section02.content01),
      content02: trimContentBlock(data.section02.content02),
    },
    vision: {
      topSubText: data.vision.topSubText.trim(),
      mainText: data.vision.mainText.trim(),
    },
    mission: {
      topSubText: data.mission.topSubText.trim(),
      mainText: data.mission.mainText.trim(),
    },
    updatedAt: new Date().toISOString(),
  })
  writeIntroFile({ version: 1, data: next })
  return next
}
