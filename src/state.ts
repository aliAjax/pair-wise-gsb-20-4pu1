import type { Observation, Slide } from "./types";
import { uid } from "./utils";

export interface State {
  slides: Slide[];
  observations: Observation[];
}

export interface ObservationPatch {
  magnification: string;
  staining: string;
  structures: string;
  description: string;
}

export type Action =
  | { type: "slide/add"; slide: Slide }
  | { type: "observation/add"; observation: Observation }
  | { type: "observation/save"; id: string; patch: ObservationPatch; submit: boolean }
  | { type: "observation/submit"; id: string }
  | { type: "observation/approve"; id: string }
  | { type: "observation/reject"; id: string; reason: string }
  | { type: "observation/delete"; id: string };

export function makeSlide(name: string, sampleType: string, staining: string): Slide {
  return { id: uid(), name, sampleType, staining, createdAt: Date.now() };
}

/** 新视野记录：先落一份草稿；submit 为 true 时一并提交复核 */
export function makeObservation(slideId: string, patch: ObservationPatch, submit: boolean): Observation {
  const now = Date.now();
  const history: Observation["history"] = [{ at: now, action: "create", by: "teacher" }];
  if (submit) {
    history.push({ at: now, action: "submit", by: "teacher" });
  }
  return {
    id: uid(),
    slideId,
    ...patch,
    status: submit ? "pending" : "draft",
    createdAt: now,
    updatedAt: now,
    submittedAt: submit ? now : undefined,
    history,
  };
}

export function reducer(state: State, action: Action): State {
  const now = Date.now();
  switch (action.type) {
    case "slide/add":
      return { ...state, slides: [...state.slides, action.slide] };

    case "observation/add":
      return { ...state, observations: [...state.observations, action.observation] };

    case "observation/delete": {
      // 仅草稿可删除；待复核 / 已定稿 / 已退回记录一律保留
      const target = state.observations.find((o) => o.id === action.id);
      if (!target || target.status !== "draft") return state;
      return { ...state, observations: state.observations.filter((o) => o.id !== action.id) };
    }

    case "observation/save":
      return {
        ...state,
        observations: state.observations.map((o) => {
          if (o.id !== action.id) return o;
          // 已定稿与待复核记录不可修改
          if (o.status !== "draft" && o.status !== "rejected") return o;
          const revised: Observation = {
            ...o,
            ...action.patch,
            updatedAt: now,
            history: [...o.history, { at: now, action: "revise", by: "teacher" }],
          };
          if (!action.submit) return revised;
          return {
            ...revised,
            status: "pending",
            submittedAt: now,
            history: [...revised.history, { at: now, action: "submit", by: "teacher" }],
          };
        }),
      };

    case "observation/submit":
      return {
        ...state,
        observations: state.observations.map((o) => {
          if (o.id !== action.id) return o;
          if (o.status !== "draft" && o.status !== "rejected") return o;
          return {
            ...o,
            status: "pending",
            updatedAt: now,
            submittedAt: now,
            history: [...o.history, { at: now, action: "submit", by: "teacher" }],
          };
        }),
      };

    case "observation/approve":
      return {
        ...state,
        observations: state.observations.map((o) => {
          if (o.id !== action.id || o.status !== "pending") return o;
          return {
            ...o,
            status: "approved",
            updatedAt: now,
            reviewedAt: now,
            history: [...o.history, { at: now, action: "approve", by: "admin" }],
          };
        }),
      };

    case "observation/reject": {
      const reason = action.reason.trim();
      if (!reason) return state;
      return {
        ...state,
        observations: state.observations.map((o) => {
          if (o.id !== action.id || o.status !== "pending") return o;
          return {
            ...o,
            status: "rejected",
            reviewReason: reason,
            updatedAt: now,
            reviewedAt: now,
            history: [...o.history, { at: now, action: "reject", by: "admin", note: reason }],
          };
        }),
      };
    }

    default:
      return state;
  }
}
