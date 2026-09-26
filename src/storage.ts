import type { HistoryAction, Observation, Role, Slide } from "./types";

export interface PersistedState {
  slides: Slide[];
  observations: Observation[];
}

const STORAGE_KEY = "hxwl-06:slide-observations:v1";

export function persist(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 存储不可用（如隐私模式）时静默失败，不影响页面内使用
  }
}

export function loadPersisted(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!Array.isArray(parsed.slides) || !Array.isArray(parsed.observations)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

interface SeedObs {
  slideId: string;
  magnification: string;
  staining: string;
  structures: string;
  description: string;
  reviewReason?: string;
  createdAgo: number;
  trail: Array<[HistoryAction, Role, number, string?]>;
}

function buildObservation(seed: SeedObs, index: number, now: number): Observation {
  const createdAt = now - seed.createdAgo;
  const history = seed.trail.map(([action, by, ago, note]) => ({
    at: now - ago,
    action,
    by,
    note,
  }));
  const last = seed.trail[seed.trail.length - 1][0];
  const status =
    last === "approve" ? "approved"
    : last === "reject" ? "rejected"
    : last === "submit" ? "pending"
    : "draft";
  const lastSubmit = [...seed.trail].reverse().find(([a]) => a === "submit");
  const lastReview = [...seed.trail].reverse().find(([a]) => a === "approve" || a === "reject");
  return {
    id: `seed-obs-${index + 1}`,
    slideId: seed.slideId,
    magnification: seed.magnification,
    staining: seed.staining,
    structures: seed.structures,
    description: seed.description,
    status,
    reviewReason: seed.reviewReason,
    createdAt,
    updatedAt: now - seed.trail[seed.trail.length - 1][2],
    submittedAt: lastSubmit ? now - lastSubmit[2] : undefined,
    reviewedAt: lastReview ? now - lastReview[2] : undefined,
    history,
  };
}

/** 首次打开时的示例数据，覆盖 待复核 / 已退回 / 草稿 / 已定稿 四种状态 */
export function seedState(): PersistedState {
  const now = Date.now();
  const slides: Slide[] = [
    {
      id: "seed-slide-1",
      name: "洋葱鳞片叶表皮",
      sampleType: "植物组织",
      staining: "碘液",
      createdAt: now - 3 * DAY,
    },
    {
      id: "seed-slide-2",
      name: "人血涂片",
      sampleType: "血液涂片",
      staining: "瑞氏染色",
      createdAt: now - 2 * DAY,
    },
    {
      id: "seed-slide-3",
      name: "草履虫培养液",
      sampleType: "微生物",
      staining: "活体观察（未染色）",
      createdAt: now - 1 * DAY,
    },
  ];

  const seeds: SeedObs[] = [
    {
      slideId: "seed-slide-1",
      magnification: "400x",
      staining: "碘液",
      structures: "细胞壁、细胞核",
      description: "表皮细胞排列紧密，细胞壁清晰，碘液染色后细胞核呈棕黄色，结论：可观察到典型的植物细胞结构。",
      createdAgo: 3 * DAY,
      trail: [
        ["create", "teacher", 3 * DAY],
        ["submit", "teacher", 3 * DAY + 20 * MIN],
        ["approve", "admin", 3 * DAY + 2 * HOUR],
      ],
    },
    {
      slideId: "seed-slide-1",
      magnification: "100x",
      staining: "碘液",
      structures: "细胞排列方式",
      description: "低倍下表皮细胞呈长方形，排列紧密，视野边缘可见少量气泡。",
      reviewReason: "视野描述未区分气泡与细胞，请补充二者的形态区别后再提交。",
      createdAgo: 2 * DAY,
      trail: [
        ["create", "teacher", 2 * DAY],
        ["submit", "teacher", 2 * DAY + 30 * MIN],
        ["reject", "admin", 2 * DAY + 3 * HOUR, "视野描述未区分气泡与细胞，请补充二者的形态区别后再提交。"],
      ],
    },
    {
      slideId: "seed-slide-1",
      magnification: "1000x",
      staining: "碘液",
      structures: "细胞核、核仁",
      description: "高倍补充视野：可见细胞核内核仁，细胞质呈颗粒感。",
      createdAgo: 5 * HOUR,
      trail: [
        ["create", "teacher", 5 * HOUR],
        ["submit", "teacher", 4 * HOUR],
      ],
    },
    {
      slideId: "seed-slide-1",
      magnification: "40x",
      staining: "碘液",
      structures: "取材位置",
      description: "",
      createdAgo: 40 * MIN,
      trail: [["create", "teacher", 40 * MIN]],
    },
    {
      slideId: "seed-slide-2",
      magnification: "1000x",
      staining: "瑞氏染色",
      structures: "红细胞、白细胞",
      description: "红细胞呈淡红色圆盘状，分布均匀；视野内可见少量白细胞，结论：血涂片形态正常。",
      createdAgo: 2 * DAY,
      trail: [
        ["create", "teacher", 2 * DAY],
        ["submit", "teacher", 2 * DAY + 15 * MIN],
        ["approve", "admin", 2 * DAY + 5 * HOUR],
      ],
    },
    {
      slideId: "seed-slide-2",
      magnification: "400x",
      staining: "瑞氏染色",
      structures: "红细胞",
      description: "红细胞密集分布，未见明显聚集，待补充白细胞分类计数。",
      createdAgo: 90 * MIN,
      trail: [["create", "teacher", 90 * MIN]],
    },
    {
      slideId: "seed-slide-3",
      magnification: "200x",
      staining: "活体观察（未染色）",
      structures: "纤毛、口沟",
      description: "草履虫游动迅速，纤毛摆动明显，可见口沟与食物泡。",
      createdAgo: 26 * HOUR,
      trail: [
        ["create", "teacher", 26 * HOUR],
        ["submit", "teacher", 25 * HOUR],
      ],
    },
  ];

  return {
    slides,
    observations: seeds.map((seed, index) => buildObservation(seed, index, now)),
  };
}
