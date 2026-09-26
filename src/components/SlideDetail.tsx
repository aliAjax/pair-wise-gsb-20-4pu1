import { useState } from "react";
import type { Observation, RecordStatus, Role, Slide } from "../types";
import { STATUS_LABEL } from "../types";
import { formatTime } from "../utils";
import type { ObservationPatch } from "../state";
import ObservationCard from "./ObservationCard";
import ObservationForm from "./ObservationForm";

interface Props {
  slide: Slide;
  observations: Observation[];
  role: Role;
  highlightId: string | null;
  onAddObservation: (patch: ObservationPatch, submit: boolean) => void;
  onSaveObservation: (id: string, patch: ObservationPatch, submit: boolean) => void;
  onSubmitObservation: (id: string) => void;
  onDeleteObservation: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

const GROUPS: Array<{ status: RecordStatus; hint: string }> = [
  { status: "pending", hint: "已提交，等待管理员复核" },
  { status: "rejected", hint: "管理员已退回，按复核原因修改后可重新提交" },
  { status: "draft", hint: "未提交的草稿，保存在本机，可随时继续编辑" },
  { status: "approved", hint: "管理员已批准，结论定稿锁定，历史记录永久保留" },
];

export default function SlideDetail({
  slide,
  observations,
  role,
  highlightId,
  onAddObservation,
  onSaveObservation,
  onSubmitObservation,
  onDeleteObservation,
  onApprove,
  onReject,
}: Props) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const approvedCount = observations.filter((o) => o.status === "approved").length;

  return (
    <section className="panel slide-detail">
      <header className="slide-detail-head">
        <div>
          <p className="eyebrow">{slide.sampleType}</p>
          <h2>{slide.name}</h2>
          <p className="slide-meta">
            默认染色：{slide.staining} · 创建于 {formatTime(slide.createdAt)} · 共 {observations.length} 条视野记录
            {approvedCount > 0 && `（${approvedCount} 条已定稿）`}
          </p>
        </div>
        {role === "teacher" && !showNewForm && (
          <button
            className="primary-action"
            onClick={() => {
              setShowNewForm(true);
              setEditingId(null);
            }}
          >
            ＋ 录入新视野
          </button>
        )}
      </header>

      {approvedCount > 0 && role === "teacher" && (
        <p className="hint-banner">
          该玻片已有定稿结论。补录高倍视野将生成新的待复核记录，原有记录与已批准结论保持不变。
        </p>
      )}

      {showNewForm && role === "teacher" && (
        <ObservationForm
          defaultStaining={slide.staining}
          onSave={(patch, submit) => {
            onAddObservation(patch, submit);
            setShowNewForm(false);
          }}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      {observations.length === 0 && !showNewForm && (
        <p className="empty-state">
          还没有视野记录。{role === "teacher" ? "点击「录入新视野」先留一份草稿。" : "等待教师录入。"}
        </p>
      )}

      {GROUPS.map(({ status, hint }) => {
        const list = observations
          .filter((o) => o.status === status)
          .sort((a, b) => b.updatedAt - a.updatedAt);
        if (list.length === 0) return null;
        return (
          <section key={status} className="obs-group">
            <h3>
              {STATUS_LABEL[status]}
              <span className="group-count">{list.length}</span>
              <small>{hint}</small>
            </h3>
            {list.map((obs) =>
              editingId === obs.id ? (
                <ObservationForm
                  key={obs.id}
                  initial={obs}
                  defaultStaining={slide.staining}
                  onSave={(patch, submit) => {
                    onSaveObservation(obs.id, patch, submit);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <ObservationCard
                  key={obs.id}
                  obs={obs}
                  role={role}
                  highlight={highlightId === obs.id}
                  onEdit={() => {
                    setEditingId(obs.id);
                    setShowNewForm(false);
                  }}
                  onSubmit={() => onSubmitObservation(obs.id)}
                  onDelete={() => {
                    if (window.confirm("确定删除这份未提交的草稿吗？")) {
                      onDeleteObservation(obs.id);
                    }
                  }}
                  onApprove={() => onApprove(obs.id)}
                  onReject={(reason) => onReject(obs.id, reason)}
                />
              )
            )}
          </section>
        );
      })}
    </section>
  );
}
