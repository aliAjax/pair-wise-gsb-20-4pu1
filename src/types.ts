export type Role = "teacher" | "admin";

/** draft 草稿 → pending 待复核 → approved 已定稿 / rejected 已退回 */
export type RecordStatus = "draft" | "pending" | "approved" | "rejected";

export interface Slide {
  id: string;
  name: string;
  sampleType: string;
  staining: string;
  createdAt: number;
}

export interface ReviewEvent {
  id: string;
  action: "submit" | "approve" | "reject";
  reason?: string;
  by: string;
  at: number;
}

export interface ObservationRecord {
  id: string;
  slideId: string;
  magnification: string;
  staining: string;
  structures: string;
  description: string;
  status: RecordStatus;
  createdAt: number;
  updatedAt: number;
  history: ReviewEvent[];
}

export interface RecordDraft {
  magnification: string;
  staining: string;
  structures: string;
  description: string;
}

export interface AppState {
  slides: Slide[];
  records: ObservationRecord[];
}
