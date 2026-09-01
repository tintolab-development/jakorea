import type { JaKoreaIntro } from '@/entities/ja-korea-intro/model/types'
import type { IntroductionResponse } from '@/shared/api/generated/ja-korea/schemas/introductionResponse'
import type { IntroductionUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/introductionUpdateRequest'

export function mapIntroductionResponseToDomain(row: IntroductionResponse): JaKoreaIntro {
  return {
    section01: {
      mainTitle: row.section1Title ?? '',
      subTitle: row.section1Subtitle ?? '',
    },
    section02: {
      titlePhrase: row.section2TitleEn ?? '',
      subTitle: row.section2SubtitleKo ?? '',
      content01: {
        title: row.content1Title ?? '',
        description: row.content1Description ?? '',
      },
      content02: {
        title: row.content2Title ?? '',
        description: row.content2Description ?? '',
      },
    },
    vision: {
      topSubText: row.globalVisionSubtitleEn ?? '',
      mainText: row.globalVisionTextKo ?? '',
    },
    mission: {
      topSubText: row.globalMissionSubtitleEn ?? '',
      mainText: row.globalMissionTextKo ?? '',
    },
    updatedAt: row.updatedAt ?? '',
    version: row.version ?? 0,
  }
}

export function toIntroductionUpdateRequest(data: JaKoreaIntro): IntroductionUpdateRequest {
  return {
    section1Title: data.section01.mainTitle.trim() || undefined,
    section1Subtitle: data.section01.subTitle.trim() || undefined,
    section2TitleEn: data.section02.titlePhrase.trim() || undefined,
    section2SubtitleKo: data.section02.subTitle.trim() || undefined,
    content1Title: data.section02.content01.title.trim() || undefined,
    content1Description: data.section02.content01.description.trimEnd() || undefined,
    content2Title: data.section02.content02.title.trim() || undefined,
    content2Description: data.section02.content02.description.trimEnd() || undefined,
    globalVisionSubtitleEn: data.vision.topSubText.trim() || undefined,
    globalVisionTextKo: data.vision.mainText.trim() || undefined,
    globalMissionSubtitleEn: data.mission.topSubText.trim() || undefined,
    globalMissionTextKo: data.mission.mainText.trim() || undefined,
    version: data.version,
  }
}
