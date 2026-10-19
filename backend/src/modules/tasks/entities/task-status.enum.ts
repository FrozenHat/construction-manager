export enum TaskStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  SENT_TO_CONTRACTOR = 'sent_to_contractor',
  IN_PROGRESS = 'in_progress',
  ON_REVIEW = 'on_review',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PauseReason {
  MATERIALS = 'materials',
  FINANCE = 'finance',
  QUALITY = 'quality',
}