export type Role = "teacher" | "admin";

export const ROLE_LABEL: Record<Role, string> = {
  teacher: "实验课教师",
  admin: "实验管理员",
};

/** 草稿 → 待复核 → 已定稿 / 已退回（可修改后重新提交） */
export type RecordStatus = "draft" | "pending" | "approved" | "rejected";

export const STATUS_LABEL: Record<RecordStatus, string> = {
  draft: "草稿",
  pending: "待复核",
  approved: "已定稿",
  rejected: "已退回",
};

export interface Slide {
  id: string;
  /** 样本名称 */
  name: string;
  /** 样本类型 */
  sampleType: string;
  /** 玻片默认染色方式 */
  staining: string;
  createdAt: number;
}

export type HistoryAction = "create" | "revise" | "submit" | "approve" | "reject";

export const HISTORY_LABEL: Record<HistoryAction, string> = {
  create: "创建草稿",
  revise: "修改内容",
  submit: "提交复核",
  approve: "复核通过，结论定稿",
  reject: "退回修改",
};

export interface HistoryEvent {
  at: number;
  action: HistoryAction;
  by: Role;
  note?: string;
}

export interface Observation {
  id: string;
  slideId: string;
  /** 放大倍数，如 400x */
  magnification: string;
  /** 本条视野的染色方式 */
  staining: string;
  /** 观察结构 */
  structures: string;
  /** 视野描述 / 观察结论 */
  description: string;
  status: RecordStatus;
  /** 最近一次退回原因（复核意见），退回后一直保留 */
  reviewReason?: string;
  createdAt: number;
  updatedAt: number;
  submittedAt?: number;
  reviewedAt?: number;
  history: HistoryEvent[];
}

export const SAMPLE_TYPES = ["植物组织", "动物组织", "微生物", "血液涂片"];

export const MAGNIFICATIONS = ["40x", "100x", "200x", "400x", "1000x"];

export const STAINING_SUGGESTIONS = [
  "碘液",
  "瑞氏染色",
  "革兰氏染色",
  "亚甲基蓝",
  "苏木精-伊红（HE）",
  "活体观察（未染色）",
];
