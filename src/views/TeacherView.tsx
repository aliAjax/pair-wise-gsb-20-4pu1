import { useMemo, useState } from "react";
import {
  HistoryTimeline,
  RecordInfo,
  StatusBadge,
  lastRejectOf,
} from "../components";
import { MAGNIFICATIONS, SAMPLE_TYPES, STAINING_METHODS } from "../constants";
import { fmtTime } from "../store";
import { ObservationRecord, RecordDraft, Slide } from "../types";

interface NewSlideData {
  name: string;
  sampleType: string;
  staining: string;
}

interface TeacherViewProps {
  slides: Slide[];
  records: ObservationRecord[];
  selectedSlideId: string | null;
  onSelectSlide: (id: string) => void;
  onAddSlide: (data: NewSlideData) => void;
  onSaveRecord: (
    slideId: string,
    draft: RecordDraft,
    recordId: string | undefined,
    submit: boolean
  ) => void;
  onSubmitRecord: (id: string) => void;
  onDeleteRecord: (id: string) => void;
}

export default function TeacherView({
  slides,
  records,
  selectedSlideId,
  onSelectSlide,
  onAddSlide,
  onSaveRecord,
  onSubmitRecord,
  onDeleteRecord,
}: TeacherViewProps) {
  const [addingSlide, setAddingSlide] = useState(false);
  // editing.recordId 为空表示新增记录
  const [editing, setEditing] = useState<{ recordId?: string } | null>(null);

  const slide = slides.find((s) => s.id === selectedSlideId) ?? null;
  const slideRecords = useMemo(
    () =>
      records
        .filter((r) => r.slideId === selectedSlideId)
        .sort((a, b) => a.createdAt - b.createdAt),
    [records, selectedSlideId]
  );

  const editingRecord = editing?.recordId
    ? records.find((r) => r.id === editing.recordId) ?? null
    : null;

  const editorInitial: RecordDraft = editingRecord
    ? {
        magnification: editingRecord.magnification,
        staining: editingRecord.staining,
        structures: editingRecord.structures,
        description: editingRecord.description,
      }
    : {
        magnification: "100x",
        staining: slide?.staining ?? "",
        structures: "",
        description: "",
      };

  const editorMode: "new" | "edit" | "resubmit" = !editingRecord
    ? "new"
    : editingRecord.status === "rejected"
      ? "resubmit"
      : "edit";

  const handleSave = (draft: RecordDraft, submit: boolean) => {
    if (!slide) return;
    onSaveRecord(slide.id, draft, editing?.recordId, submit);
    setEditing(null);
  };

  return (
    <section className="workspace">
      <aside className="panel narrow">
        <div className="side-head">
          <h2>玻片列表</h2>
          <button
            className="primary-action small"
            onClick={() => setAddingSlide((v) => !v)}
          >
            {addingSlide ? "收起" : "+ 新建玻片"}
          </button>
        </div>
        {addingSlide && (
          <SlideForm
            onAdd={(d) => {
              onAddSlide(d);
              setAddingSlide(false);
            }}
            onCancel={() => setAddingSlide(false)}
          />
        )}
        <div className="slide-list">
          {slides.map((s) => {
            const rs = records.filter((r) => r.slideId === s.id);
            const approved = rs.filter((r) => r.status === "approved").length;
            const pending = rs.filter((r) => r.status === "pending").length;
            const open = rs.length - approved - pending;
            return (
              <button
                key={s.id}
                className={`slide-item ${s.id === selectedSlideId ? "active" : ""}`}
                onClick={() => {
                  onSelectSlide(s.id);
                  setEditing(null);
                }}
              >
                <strong>{s.name}</strong>
                <span className="slide-meta">
                  {s.sampleType} · {s.staining || "未注明染色"}
                </span>
                <span className="slide-counts">
                  {approved > 0 && <em className="c-approved">定稿 {approved}</em>}
                  {pending > 0 && <em className="c-pending">待复核 {pending}</em>}
                  {open > 0 && <em>进行中 {open}</em>}
                  {rs.length === 0 && <em>暂无记录</em>}
                </span>
              </button>
            );
          })}
          {slides.length === 0 && <p className="tip">还没有玻片，先新建一张。</p>}
        </div>
      </aside>

      <section className="panel">
        {!slide ? (
          <div className="empty-state">选择左侧玻片，或新建一张玻片开始录入。</div>
        ) : (
          <>
            <div className="section-heading">
              <div>
                <p>
                  {slide.sampleType} · 默认染色：{slide.staining || "未注明"}
                </p>
                <h2>{slide.name}</h2>
                <span className="tip">
                  创建于 {fmtTime(slide.createdAt)} · 共 {slideRecords.length} 次录入
                </span>
              </div>
              <button
                className="primary-action"
                disabled={editing !== null}
                onClick={() => setEditing({})}
              >
                + 新增视野记录
              </button>
            </div>

            {slideRecords.some((r) => r.status === "approved") && (
              <p className="notice">
                该玻片已有定稿结论，将永久保留、不可修改；补充高倍视野请新增记录，提交后由管理员复核。
              </p>
            )}

            {editing && !editing.recordId && (
              <RecordEditor
                key="new"
                initial={editorInitial}
                mode="new"
                onSave={handleSave}
                onCancel={() => setEditing(null)}
              />
            )}

            <div className="record-list">
              {slideRecords.map((r, i) =>
                editing?.recordId === r.id && editingRecord ? (
                  <RecordEditor
                    key={r.id}
                    initial={editorInitial}
                    mode={editorMode}
                    onSave={handleSave}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <TeacherRecordCard
                    key={r.id}
                    index={i}
                    record={r}
                    onEdit={() => setEditing({ recordId: r.id })}
                    onSubmit={() => onSubmitRecord(r.id)}
                    onDelete={() => {
                      if (window.confirm("确定删除该草稿？删除后不可恢复。")) {
                        onDeleteRecord(r.id);
                      }
                    }}
                  />
                )
              )}
              {slideRecords.length === 0 && !editing && (
                <div className="empty-state">
                  还没有视野记录，点击右上角「新增视野记录」留下第一份草稿。
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </section>
  );
}

function SlideForm({
  onAdd,
  onCancel,
}: {
  onAdd: (data: NewSlideData) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [sampleType, setSampleType] = useState(SAMPLE_TYPES[0]);
  const [staining, setStaining] = useState("");

  return (
    <form
      className="slide-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) {
          onAdd({ name: name.trim(), sampleType, staining: staining.trim() });
        }
      }}
    >
      <label>
        <span>玻片名称</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="如：洋葱表皮细胞"
        />
      </label>
      <label>
        <span>样本类型</span>
        <select value={sampleType} onChange={(e) => setSampleType(e.target.value)}>
          {SAMPLE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>默认染色方式</span>
        <input
          list="slide-staining-options"
          value={staining}
          onChange={(e) => setStaining(e.target.value)}
          placeholder="如：碘液"
        />
        <datalist id="slide-staining-options">
          {STAINING_METHODS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </label>
      <div className="form-actions">
        <button type="submit" className="primary-action small" disabled={!name.trim()}>
          创建玻片
        </button>
        <button type="button" className="ghost small" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}

type EditorMode = "new" | "edit" | "resubmit";

function RecordEditor({
  initial,
  mode,
  onSave,
  onCancel,
}: {
  initial: RecordDraft;
  mode: EditorMode;
  onSave: (draft: RecordDraft, submit: boolean) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<RecordDraft>(initial);
  const set = (patch: Partial<RecordDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const valid =
    draft.staining.trim() !== "" &&
    draft.structures.trim() !== "" &&
    draft.description.trim() !== "";

  const labels = {
    new: { submit: "提交复核", save: "存为草稿" },
    edit: { submit: "保存并提交复核", save: "保存修改" },
    resubmit: { submit: "保存并重新提交", save: "仅保存修改" },
  }[mode];

  return (
    <form className="record-form" onSubmit={(e) => e.preventDefault()}>
      <div className="field-grid">
        <label>
          <span>放大倍数</span>
          <select
            value={draft.magnification}
            onChange={(e) => set({ magnification: e.target.value })}
          >
            {MAGNIFICATIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>染色方式</span>
          <input
            list="record-staining-options"
            value={draft.staining}
            onChange={(e) => set({ staining: e.target.value })}
            placeholder="如：碘液"
          />
          <datalist id="record-staining-options">
            {STAINING_METHODS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
        <label className="span-2">
          <span>观察结构</span>
          <input
            value={draft.structures}
            onChange={(e) => set({ structures: e.target.value })}
            placeholder="如：细胞壁、细胞核"
          />
        </label>
        <label className="span-2">
          <span>视野描述</span>
          <textarea
            rows={3}
            value={draft.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="描述视野下的形态、分布、染色特征…"
          />
        </label>
      </div>
      <div className="form-actions">
        <button
          type="button"
          className="primary-action"
          disabled={!valid}
          onClick={() => onSave(draft, true)}
        >
          {labels.submit}
        </button>
        <button type="button" disabled={!valid} onClick={() => onSave(draft, false)}>
          {labels.save}
        </button>
        <button type="button" className="ghost" onClick={onCancel}>
          取消
        </button>
      </div>
      <p className="tip">
        提交后进入「待复核」，由管理员批准定稿或退回；未提交的内容会作为草稿保留在本地，关闭页面也不会丢失。
      </p>
    </form>
  );
}

function TeacherRecordCard({
  index,
  record,
  onEdit,
  onSubmit,
  onDelete,
}: {
  index: number;
  record: ObservationRecord;
  onEdit: () => void;
  onSubmit: () => void;
  onDelete: () => void;
}) {
  const lastReject = lastRejectOf(record);

  return (
    <article className={`record-card st-${record.status}`}>
      <div className="record-side">
        <strong>{record.magnification}</strong>
        <span>第 {index + 1} 次录入</span>
      </div>
      <div className="record-main">
        <div className="record-head">
          <StatusBadge status={record.status} />
          <time>更新于 {fmtTime(record.updatedAt)}</time>
        </div>
        <RecordInfo record={record} />

        {record.status === "rejected" && lastReject && (
          <div className="reject-box">
            <strong>管理员退回原因</strong>
            <p>{lastReject.reason}</p>
            <span>
              {lastReject.by} · {fmtTime(lastReject.at)}
            </span>
          </div>
        )}
        {record.status === "pending" && lastReject && (
          <div className="reject-box muted">
            <strong>上次退回原因（已重新提交，等待复核）</strong>
            <p>{lastReject.reason}</p>
          </div>
        )}
        {record.status === "approved" && (
          <p className="locked-tip">✔ 已批准定稿，结论锁定保留，不可再修改。</p>
        )}

        {record.history.length > 0 && (
          <details className="history">
            <summary>复核时间线（{record.history.length}）</summary>
            <HistoryTimeline history={record.history} />
          </details>
        )}

        <div className="record-actions">
          {record.status === "draft" && (
            <>
              <button className="primary-action" onClick={onSubmit}>
                提交复核
              </button>
              <button onClick={onEdit}>继续编辑</button>
              <button className="danger-outline" onClick={onDelete}>
                删除草稿
              </button>
            </>
          )}
          {record.status === "rejected" && (
            <>
              <button className="primary-action" onClick={onEdit}>
                按退回原因修改
              </button>
              <button onClick={onSubmit}>直接重新提交</button>
            </>
          )}
          {record.status === "pending" && (
            <span className="tip">已提交，等待管理员复核…</span>
          )}
        </div>
      </div>
    </article>
  );
}
