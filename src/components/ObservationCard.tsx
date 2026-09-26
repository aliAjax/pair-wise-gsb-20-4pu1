import { useState } from "react";
import type { Observation, Role } from "../types";
import { HISTORY_LABEL, ROLE_LABEL } from "../types";
import { formatTime } from "../utils";
import StatusBadge from "./StatusBadge";

interface Props {
  obs: Observation;
  role: Role;
  highlight: boolean;
  onEdit: () => void;
  onSubmit: () => void;
  onDelete: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

export default function ObservationCard({
  obs,
  role,
  highlight,
  onEdit,
  onSubmit,
  onDelete,
  onApprove,
  onReject,
}: Props) {
  const [showHistory, setShowHistory] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const canEdit = role === "teacher" && (obs.status === "draft" || obs.status === "rejected");
  const canReview = role === "admin" && obs.status === "pending";

  const confirmReject = () => {
    if (!reason.trim()) {
      setError("退回时必须写明复核原因");
      return;
    }
    onReject(reason);
    setRejecting(false);
    setReason("");
    setError("");
  };

  return (
    <article
      className={`obs-card status-${obs.status}${highlight ? " highlight" : ""}`}
      id={`obs-${obs.id}`}
    >
      <header className="obs-head">
        <span className="mag-badge">{obs.magnification}</span>
        <StatusBadge status={obs.status} />
        {obs.status === "approved" && <span className="lock-note">🔒 已批准定稿，内容锁定</span>}
        <time>更新于 {formatTime(obs.updatedAt)}</time>
      </header>

      <dl className="obs-body">
        <div>
          <dt>染色方式</dt>
          <dd>{obs.staining}</dd>
        </div>
        <div>
          <dt>观察结构</dt>
          <dd>{obs.structures || "（未填写）"}</dd>
        </div>
        <div className="span-2">
          <dt>视野描述 / 结论</dt>
          <dd>{obs.description || "（未填写）"}</dd>
        </div>
      </dl>

      {obs.status === "rejected" && obs.reviewReason && (
        <p className="reason-banner">
          <strong>复核退回原因（{formatTime(obs.reviewedAt ?? obs.updatedAt)}）：</strong>
          {obs.reviewReason}
        </p>
      )}

      {obs.status === "pending" && role === "teacher" && (
        <p className="hint-banner">已提交，等待管理员复核，复核期间内容不可修改。</p>
      )}

      <footer className="obs-actions">
        {canEdit && (
          <>
            <button className="subtle-action" onClick={onEdit}>
              {obs.status === "rejected" ? "修改" : "编辑"}
            </button>
            <button className="primary-action" onClick={onSubmit}>
              {obs.status === "rejected" ? "重新提交复核" : "提交复核"}
            </button>
          </>
        )}
        {role === "teacher" && obs.status === "draft" && (
          <button className="danger-action" onClick={onDelete}>
            删除草稿
          </button>
        )}
        {canReview && !rejecting && (
          <>
            <button className="approve-action" onClick={onApprove}>
              ✓ 批准定稿
            </button>
            <button className="danger-action" onClick={() => setRejecting(true)}>
              退回
            </button>
          </>
        )}
        <button className="ghost-action history-toggle" onClick={() => setShowHistory((v) => !v)}>
          流转记录（{obs.history.length}）{showHistory ? "▴" : "▾"}
        </button>
      </footer>

      {rejecting && canReview && (
        <div className="reject-box">
          <label>
            <span>退回原因（必填，教师修改后重新提交）</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="如：染色方式与描述不符，请核对后修改"
              autoFocus
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button className="danger-action" onClick={confirmReject}>
              确认退回
            </button>
            <button
              className="ghost-action"
              onClick={() => {
                setRejecting(false);
                setReason("");
                setError("");
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {showHistory && (
        <ul className="timeline">
          {obs.history.map((h, i) => (
            <li key={`${h.at}-${i}`}>
              <i className={`dot dot-${h.action}`} />
              <span className="timeline-label">{HISTORY_LABEL[h.action]}</span>
              <span className="timeline-by">{ROLE_LABEL[h.by]}</span>
              <time>{formatTime(h.at)}</time>
              {h.note && <p className="timeline-note">{h.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
