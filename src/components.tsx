import { fmtTime } from "./store";
import { ObservationRecord, RecordStatus, ReviewEvent } from "./types";

export const STATUS_META: Record<RecordStatus, { label: string; className: string }> = {
  draft: { label: "草稿", className: "badge-draft" },
  pending: { label: "待复核", className: "badge-pending" },
  approved: { label: "已定稿", className: "badge-approved" },
  rejected: { label: "已退回", className: "badge-rejected" },
};

export function StatusBadge({ status }: { status: RecordStatus }) {
  const meta = STATUS_META[status];
  return <span className={`badge ${meta.className}`}>{meta.label}</span>;
}

export function lastEventOf(
  record: ObservationRecord,
  action: ReviewEvent["action"]
): ReviewEvent | undefined {
  return [...record.history].reverse().find((e) => e.action === action);
}

export function lastRejectOf(record: ObservationRecord): ReviewEvent | undefined {
  return lastEventOf(record, "reject");
}

export function submitCountOf(record: ObservationRecord): number {
  return record.history.filter((e) => e.action === "submit").length;
}

export function RecordInfo({ record }: { record: ObservationRecord }) {
  return (
    <dl className="record-info">
      <div>
        <dt>染色方式</dt>
        <dd>{record.staining}</dd>
      </div>
      <div>
        <dt>观察结构</dt>
        <dd>{record.structures}</dd>
      </div>
      <div className="wide">
        <dt>视野描述</dt>
        <dd>{record.description}</dd>
      </div>
    </dl>
  );
}

const ACTION_LABEL: Record<ReviewEvent["action"], string> = {
  submit: "提交复核",
  approve: "批准定稿",
  reject: "退回修改",
};

export function HistoryTimeline({ history }: { history: ReviewEvent[] }) {
  if (history.length === 0) {
    return <p className="tip">尚未提交复核。</p>;
  }
  return (
    <ol className="timeline">
      {[...history].reverse().map((ev) => (
        <li key={ev.id} className={`ev-${ev.action}`}>
          <div className="ev-head">
            <strong>{ACTION_LABEL[ev.action]}</strong>
            <span>
              {ev.by} · {fmtTime(ev.at)}
            </span>
          </div>
          {ev.reason && <p className="ev-reason">“{ev.reason}”</p>}
        </li>
      ))}
    </ol>
  );
}
