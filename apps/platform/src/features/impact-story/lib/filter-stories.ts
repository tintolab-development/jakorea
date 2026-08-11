import type { ImpactStoryListItem, ImpactStoriesListParams } from '../model/types'

export function filterImpactStories(
  stories: readonly ImpactStoryListItem[],
  params: Pick<ImpactStoriesListParams, 'category' | 'q'>
): ImpactStoryListItem[] {
  const query = params.q.trim().toLowerCase()

  return stories
    .filter(story => {
      if (params.category !== 'all' && story.category !== params.category) {
        return false
      }
      if (!query) {
        return true
      }
      return (
        story.title.toLowerCase().includes(query) ||
        story.summary.toLowerCase().includes(query)
      )
    })
    .slice()
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}
