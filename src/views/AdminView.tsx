import { useState } from "react";
import {
  HistoryTimeline,
  RecordInfo,
  StatusBadge,
  lastEventOf,
  lastRejectOf,
  submitCountOf,
} from "../components";
import { fmtTime } from "../store";
import { ObservationRecord, Slide } from "../types";

type AdminTab = "pending" | "approved" | "rejected";

const TAB_LABEL: Record<AdminTab, string> = {
  pending: "待复核",
  approved: "已定稿",
  rejected: "已退回",
};

interface AdminViewProps {
  slides: Slide[];
  records: ObservationRecord[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export default function AdminView({ slides, records, onApprove, onReject }: AdminViewProps) {
  const [tab, setTab] = useState<AdminTab>("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const slideOf = (id: string) => slides.find((s) => s.id === id);

  const lists: Record<AdminTab, ObservationRecord[]> = {
    // 待复核按提交时间先后排队，先提交先复核
    pending: records
      .filter((r) => r.status === "pending")
      .sort((a, b) => a.updatedAt - b.updatedAt),
    approved: records
      .filter((r) => r.status === "approved")
      .sort((a, b) => b.updatedAt - a.updatedAt),
    rejected: records
      .filter((r) => r.status === "rejected")
      .sort((a, b) => b.updatedAt - a.updatedAt),
  };
  const shown = lists[tab];

  const handleApprove = (id: string) => {
    if (window.confirm("批准后该记录即定稿锁定，不可再修改。确认批准？")) {
      onApprove(id);
    }
  };

  const confirmReject = () => {
    if (!rejectingId || !reason.trim()) return;
    onReject(rejectingId, reason.trim());
    setRejectingId(null);
    setReason("");
  };

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p>管理员复核台</p>
          <h2>视野记录复核</h2>
        </div>
        <div className="tabs">
          {(Object.keys(TAB_LABEL) as AdminTab[]).map((t) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => {
                setTab(t);
                setRejectingId(null);
                setReason("");
              }}
            >
              {TAB_LABEL[t]}（{lists[t].length}）
            </button>
          ))}
        </div>
      </div>

      <div className="record-list">
        {shown.map((r) => {
          const slide = slideOf(r.slideId);
          const lastReject = lastRejectOf(r);
          const lastSubmit = lastEventOf(r, "submit");
          const lastApprove = lastEventOf(r, "approve");
          return (
            <article key={r.id} className={`record-card st-${r.status}`}>
              <div className="record-side">
                <strong>{r.magnification}</strong>
                <span>{slide?.name ?? "未知玻片"}</span>
              </div>
              <div className="record-main">
                <div className="record-head">
                  <StatusBadge status={r.status} />
                  {tab === "pending" && (
                    <time>
                      {lastSubmit ? `提交于 ${fmtTime(lastSubmit.at)}` : ""} · 第{" "}
                      {submitCountOf(r)} 次提交
                    </time>
                  )}
                  {tab === "approved" && lastApprove && (
                    <time>定稿于 {fmtTime(lastApprove.at)}</time>
                  )}
                  {tab === "rejected" && lastReject && (
                    <time>退回于 {fmtTime(lastReject.at)}</time>
                  )}
                </div>

                <p className="slide-line">
                  玻片：{slide?.name ?? "未知"} · {slide?.sampleType ?? "-"} · 默认染色{" "}
                  {slide?.staining || "未注明"}
                </p>
                <RecordInfo record={r} />

                {tab === "rejected" && lastReject ? (
                  <div className="reject-box">
                    <strong>退回原因</strong>
                    <p>{lastReject.reason}</p>
                    <span>
                      {lastReject.by} · {fmtTime(lastReject.at)}
                    </span>
                  </div>
                ) : (
                  lastReject && (
                    <div className="reject-box muted">
                      <strong>上次退回原因</strong>
                      <p>{lastReject.reason}</p>
                    </div>
                  )
                )}

                <details className="history">
                  <summary>复核时间线（{r.history.length}）</summary>
                  <HistoryTimeline history={r.history} />
                </details>

                {tab === "pending" && (
                  <div className="record-actions">
                    <button className="accent-action" onClick={() => handleApprove(r.id)}>
                      批准定稿
                    </button>
                    {rejectingId === r.id ? (
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setReason("");
                        }}
                      >
                        收起退回
                      </button>
                    ) : (
                      <button
                        className="danger-outline"
                        onClick={() => {
                          setRejectingId(r.id);
                          setReason("");
                        }}
                      >
                        退回修改
                      </button>
                    )}
                  </div>
                )}

                {tab === "pending" && rejectingId === r.id && (
                  <div className="reject-editor">
                    <textarea
                      rows={3}
                      autoFocus
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="写明退回原因（如对视野描述或染色信息的异议），教师修改后将再次提交"
                    />
                    <div className="form-actions">
                      <button
                        className="danger"
                        disabled={!reason.trim()}
                        onClick={confirmReject}
                      >
                        确认退回
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setReason("");
                        }}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
        {shown.length === 0 && (
          <div className="empty-state">
            {tab === "pending"
              ? "当前没有待复核的记录。"
              : tab === "approved"
                ? "还没有已定稿的结论。"
                : "没有被退回的记录。"}
          </div>
        )}
      </div>
    </section>
  );
}
