import { useEffect, useReducer, useState } from "react";
import "./styles.css";
import type { Observation, Role } from "./types";
import { ROLE_LABEL } from "./types";
import { loadPersisted, persist, seedState } from "./storage";
import {
  makeObservation,
  makeSlide,
  reducer,
  type ObservationPatch,
  type State,
} from "./state";
import NewSlideForm from "./components/NewSlideForm";
import SlideList from "./components/SlideList";
import SlideDetail from "./components/SlideDetail";
import ReviewQueue from "./components/ReviewQueue";

const initState = (): State => loadPersisted() ?? seedState();

export default function App() {
  const [role, setRole] = useState<Role>("teacher");
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // 关键需求：未提交的草稿与复核原因在页面关闭后仍保留（localStorage 持久化）
  useEffect(() => {
    persist(state);
  }, [state]);

  useEffect(() => {
    if (!highlightId) return;
    const timer = window.setTimeout(() => setHighlightId(null), 2600);
    return () => window.clearTimeout(timer);
  }, [highlightId]);

  const selectedSlide =
    state.slides.find((s) => s.id === selectedSlideId) ?? state.slides[0] ?? null;

  const stats = {
    slides: state.slides.length,
    pending: state.observations.filter((o) => o.status === "pending").length,
    approved: state.observations.filter((o) => o.status === "approved").length,
    open: state.observations.filter((o) => o.status === "draft" || o.status === "rejected").length,
  };

  const addObservation = (slideId: string) => (patch: ObservationPatch, submit: boolean) =>
    dispatch({ type: "observation/add", observation: makeObservation(slideId, patch, submit) });

  const locateFromQueue = (obs: Observation) => {
    setSelectedSlideId(obs.slideId);
    setHighlightId(obs.id);
    requestAnimationFrame(() => {
      document.getElementById(`obs-${obs.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar-title">
          <p className="eyebrow">hxwl-06 · 生物显微观察</p>
          <h1>显微镜玻片观察记录</h1>
          <p className="subtitle">
            同一玻片按倍率分次录入：先存草稿，提交后由管理员复核；批准即定稿锁定，
            退回须写明原因，修改后可重新提交。草稿与复核原因保存在本机，关闭页面不丢失。
          </p>
        </div>
        <div className="role-card">
          <span>当前角色</span>
          <div className="role-switch">
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
              <button
                key={r}
                className={role === r ? "active" : ""}
                onClick={() => setRole(r)}
              >
                {ROLE_LABEL[r]}
              </button>
            ))}
          </div>
          <div className="stats-row">
            <span>
              <strong>{stats.slides}</strong>玻片
            </span>
            <span>
              <strong>{stats.pending}</strong>待复核
            </span>
            <span>
              <strong>{stats.approved}</strong>已定稿
            </span>
            <span>
              <strong>{stats.open}</strong>草稿/退回
            </span>
          </div>
        </div>
      </header>

      <div className="layout">
        <aside className="panel side-panel">
          {role === "teacher" && (
            <NewSlideForm
              onAdd={(name, sampleType, staining) => {
                const slide = makeSlide(name, sampleType, staining);
                dispatch({ type: "slide/add", slide });
                setSelectedSlideId(slide.id);
              }}
            />
          )}
          <h2 className="side-title">玻片列表</h2>
          <SlideList
            slides={state.slides}
            observations={state.observations}
            selectedId={selectedSlide?.id ?? null}
            onSelect={setSelectedSlideId}
          />
        </aside>

        <div className="main-column">
          {role === "admin" && (
            <ReviewQueue
              slides={state.slides}
              observations={state.observations}
              onLocate={locateFromQueue}
            />
          )}
          {selectedSlide ? (
            <SlideDetail
              slide={selectedSlide}
              observations={state.observations.filter((o) => o.slideId === selectedSlide.id)}
              role={role}
              highlightId={highlightId}
              onAddObservation={addObservation(selectedSlide.id)}
              onSaveObservation={(id, patch, submit) =>
                dispatch({ type: "observation/save", id, patch, submit })
              }
              onSubmitObservation={(id) => dispatch({ type: "observation/submit", id })}
              onDeleteObservation={(id) => dispatch({ type: "observation/delete", id })}
              onApprove={(id) => dispatch({ type: "observation/approve", id })}
              onReject={(id, reason) => dispatch({ type: "observation/reject", id, reason })}
            />
          ) : (
            <section className="panel empty-state">请先新增一个玻片。</section>
          )}
        </div>
      </div>

      <footer className="persist-note">
        数据仅保存在本机浏览器（localStorage）：未提交的草稿、退回原因与流转记录关闭页面后仍会保留。
      </footer>
    </main>
  );
}
