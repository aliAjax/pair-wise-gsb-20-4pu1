import { ADMIN_NAME, TEACHER_NAME } from "./constants";
import { AppState } from "./types";

const STORAGE_KEY = "hxwl-06-observations-v1";

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function fmtTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 首次打开时的示例数据，覆盖 草稿 / 待复核 / 已定稿 / 已退回 四种状态 */
export function seedState(): AppState {
  const now = Date.now();
  const h = 3600_000;
  return {
    slides: [
      { id: "slide-onion", name: "洋葱表皮细胞", sampleType: "植物组织", staining: "碘液", createdAt: now - 26 * h },
      { id: "slide-blood", name: "人血涂片", sampleType: "血液涂片", staining: "瑞氏染色", createdAt: now - 20 * h },
      { id: "slide-paramecium", name: "草履虫", sampleType: "微生物", staining: "活体观察", createdAt: now - 8 * h },
    ],
    records: [
      {
        id: "rec-onion-100",
        slideId: "slide-onion",
        magnification: "100x",
        staining: "碘液",
        structures: "细胞壁、细胞核",
        description: "低倍下表皮细胞排列紧密，细胞壁清晰，碘液染色后细胞核呈淡黄色。",
        status: "approved",
        createdAt: now - 25 * h,
        updatedAt: now - 24 * h,
        history: [
          { id: uid(), action: "submit", by: TEACHER_NAME, at: now - 25 * h },
          { id: uid(), action: "approve", by: ADMIN_NAME, at: now - 24 * h },
        ],
      },
      {
        id: "rec-onion-400",
        slideId: "slide-onion",
        magnification: "400x",
        staining: "碘液",
        structures: "细胞核、液泡",
        description: "高倍下可见细胞核被挤向一侧，中央大液泡明显，细胞质贴壁分布。",
        status: "pending",
        createdAt: now - 3 * h,
        updatedAt: now - 2 * h,
        history: [{ id: uid(), action: "submit", by: TEACHER_NAME, at: now - 2 * h }],
      },
      {
        id: "rec-onion-1000",
        slideId: "slide-onion",
        magnification: "1000x",
        staining: "碘液",
        structures: "细胞核细节",
        description: "（草稿）油镜下拟观察核膜与染色质分布，待补充。",
        status: "draft",
        createdAt: now - 1 * h,
        updatedAt: now - 1 * h,
        history: [],
      },
      {
        id: "rec-blood-400",
        slideId: "slide-blood",
        magnification: "400x",
        staining: "瑞氏染色",
        structures: "红细胞、白细胞",
        description: "红细胞分布均匀，可见少量白细胞。",
        status: "rejected",
        createdAt: now - 19 * h,
        updatedAt: now - 6 * h,
        history: [
          { id: uid(), action: "submit", by: TEACHER_NAME, at: now - 18 * h },
          {
            id: uid(),
            action: "reject",
            by: ADMIN_NAME,
            at: now - 6 * h,
            reason: "染色信息存疑：瑞氏染色下应描述白细胞胞核着色特征，请补充细胞核形态与染色深浅后再提交。",
          },
        ],
      },
      {
        id: "rec-paramecium-200",
        slideId: "slide-paramecium",
        magnification: "200x",
        staining: "活体观察",
        structures: "纤毛、食物泡",
        description: "纤毛摆动明显，虫体往返运动，可见食物泡随细胞质流动。",
        status: "approved",
        createdAt: now - 8 * h,
        updatedAt: now - 7 * h,
        history: [
          { id: uid(), action: "submit", by: TEACHER_NAME, at: now - 8 * h },
          { id: uid(), action: "approve", by: ADMIN_NAME, at: now - 7 * h },
        ],
      },
    ],
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || !Array.isArray(parsed.slides) || !Array.isArray(parsed.records)) {
      return seedState();
    }
    return parsed;
  } catch {
    return seedState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 存储不可用时静默失败，页面内数据仍保留
  }
}
