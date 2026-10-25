import type { CategoryManagementDraftChanges } from '@/features/posts/model/category-management-draft'

export type CategoryRemoteActions = {
  /** Legacy row mutations are retained for API compatibility but are not called by the modal. */
  onCreate: (name: string) => Promise<void>
  onUpdate: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  /**
   * Commits the entire local draft through the domain bulk endpoint. The adapter
   * refetches the category query before resolving so the next modal open reads
   * the server canonical state.
   */
  onSave?: (changes: CategoryManagementDraftChanges) => Promise<void>
}
