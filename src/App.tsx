import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import { ADMIN_NAME, TEACHER_NAME } from "./constants";
import { loadState, saveState, seedState, uid } from "./store";
import { AppState, ObservationRecord, RecordDraft, Role, Slide } from "./types";
import AdminView from "./views/AdminView";
import TeacherView from "./views/TeacherView";

const ROLE_KEY = "hxwl-06-role";

function MetricCard({ label, value, index }: { label: string; value: string; index: number }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <i className={`m-${index % 4}`} />
    </article>
  );
}

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [role, setRole] = useState<Role>(() =>
    localStorage.getItem(ROLE_KEY) === "admin" ? "admin" : "teacher"
  );
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(
    () => loadState().slides[0]?.id ?? null
  );

  // 任何状态变化都写入 localStorage：关掉页面后草稿与复核原因仍在
  useEffect(() => saveState(state), [state]);
  useEffect(() => localStorage.setItem(ROLE_KEY, role), [role]);

  // 数据重置后保证选中项有效
  useEffect(() => {
    if (!selectedSlideId || !state.slides.some((s) => s.id === selectedSlideId)) {
      setSelectedSlideId(state.slides[0]?.id ?? null);
    }
  }, [state.slides, selectedSlideId]);

  const metrics = useMemo(() => {
    const rs = state.records;
    const count = (st: ObservationRecord["status"]) => rs.filter((r) => r.status === st).length;
    return [
      { label: "玻片总数", value: String(state.slides.length) },
      { label: "待复核记录", value: String(count("pending")) },
      { label: "已定稿结论", value: String(count("approved")) },
      { label: "草稿 / 退回", value: `${count("draft")} / ${count("rejected")}` },
    ];
  }, [state]);

  // ---------- 教师侧操作 ----------

  const addSlide = (data: { name: string; sampleType: string; staining: string }) => {
    const slide: Slide = { id: uid(), createdAt: Date.now(), ...data };
    setState((s) => ({ ...s, slides: [slide, ...s.slides] }));
    setSelectedSlideId(slide.id);
  };

  const saveRecord = (
    slideId: string,
    draft: RecordDraft,
    recordId: string | undefined,
    submit: boolean
  ) => {
    const now = Date.now();
    setState((s) => {
      if (recordId) {
        // 只允许修改草稿或被退回的记录；已定稿与待复核不可改
        return {
          ...s,
          records: s.records.map((r) => {
            if (r.id !== recordId || (r.status !== "draft" && r.status !== "rejected")) return r;
            return {
              ...r,
              ...draft,
              status: submit ? "pending" : r.status,
              updatedAt: now,
              history: submit
                ? [...r.history, { id: uid(), action: "submit" as const, by: TEACHER_NAME, at: now }]
                : r.history,
            };
          }),
        };
      }
      const record: ObservationRecord = {
        id: uid(),
        slideId,
        ...draft,
        status: submit ? "pending" : "draft",
        createdAt: now,
        updatedAt: now,
        history: submit
          ? [{ id: uid(), action: "submit", by: TEACHER_NAME, at: now }]
          : [],
      };
      return { ...s, records: [record, ...s.records] };
    });
  };

  const submitRecord = (id: string) => {
    const now = Date.now();
    setState((s) => ({
      ...s,
      records: s.records.map((r) =>
        r.id === id && (r.status === "draft" || r.status === "rejected")
          ? {
              ...r,
              status: "pending",
              updatedAt: now,
              history: [...r.history, { id: uid(), action: "submit" as const, by: TEACHER_NAME, at: now }],
            }
          : r
      ),
    }));
  };

  const deleteRecord = (id: string) => {
    // 仅草稿可删除；已定稿与历史记录始终保留
    setState((s) => ({
      ...s,
      records: s.records.filter((r) => !(r.id === id && r.status === "draft")),
    }));
  };

  // ---------- 管理员侧操作 ----------

  const approveRecord = (id: string) => {
    const now = Date.now();
    setState((s) => ({
      ...s,
      records: s.records.map((r) =>
        r.id === id && r.status === "pending"
          ? {
              ...r,
              status: "approved",
              updatedAt: now,
              history: [...r.history, { id: uid(), action: "approve" as const, by: ADMIN_NAME, at: now }],
            }
          : r
      ),
    }));
  };

  const rejectRecord = (id: string, reason: string) => {
    const now = Date.now();
    setState((s) => ({
      ...s,
      records: s.records.map((r) =>
        r.id === id && r.status === "pending"
          ? {
              ...r,
              status: "rejected",
              updatedAt: now,
              history: [
                ...r.history,
                { id: uid(), action: "reject" as const, reason, by: ADMIN_NAME, at: now },
              ],
            }
          : r
      ),
    }));
  };

  const resetAll = () => {
    if (!window.confirm("将清空当前全部数据并恢复示例数据，确定？")) return;
    const fresh = seedState();
    setState(fresh);
    setSelectedSlideId(fresh.slides[0]?.id ?? null);
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">hxwl-06 · 生物显微观察</p>
          <h1>显微镜玻片观察记录库</h1>
          <p className="subtitle">
            同一玻片按倍率分次录入视野记录：教师先存草稿，提交后由管理员复核；批准即定稿锁定，
            退回需写明原因，教师修改后可再次提交。补拍高倍视野只能新增记录，
            旧记录与已定稿结论始终保留。
          </p>
          <div className="flow-legend">
            <span>草稿</span>
            <i>→</i>
            <span>待复核</span>
            <i>→</i>
            <span>已定稿</span>
            <em>退回（附原因）→ 修改后重新提交</em>
          </div>
        </div>
        <div className="stack-card">
          <span>当前角色</span>
          <div className="role-switch">
            <button
              className={role === "teacher" ? "active" : ""}
              onClick={() => setRole("teacher")}
            >
              实验课教师
            </button>
            <button
              className={role === "admin" ? "active" : ""}
              onClick={() => setRole("admin")}
            >
              实验管理员
            </button>
          </div>
          <p className="role-hint">
            {role === "teacher"
              ? "录入草稿、提交复核、按退回原因修改后重新提交"
              : "复核待办队列，批准定稿或写明原因退回"}
          </p>
        </div>
      </section>

      <section className="metrics-grid">
        {metrics.map((m, i) => (
          <MetricCard key={m.label} label={m.label} value={m.value} index={i} />
        ))}
      </section>

      {role === "teacher" ? (
        <TeacherView
          slides={state.slides}
          records={state.records}
          selectedSlideId={selectedSlideId}
          onSelectSlide={setSelectedSlideId}
          onAddSlide={addSlide}
          onSaveRecord={saveRecord}
          onSubmitRecord={submitRecord}
          onDeleteRecord={deleteRecord}
        />
      ) : (
        <AdminView
          slides={state.slides}
          records={state.records}
          onApprove={approveRecord}
          onReject={rejectRecord}
        />
      )}

      <footer className="foot">
        <p>数据保存在浏览器本地（localStorage），关闭页面后未提交的草稿与复核原因仍会保留。</p>
        <button onClick={resetAll}>恢复示例数据</button>
      </footer>
    </main>
  );
}
