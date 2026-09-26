import type { Observation, Slide } from "../types";
import { formatTime } from "../utils";

interface Props {
  slides: Slide[];
  observations: Observation[];
  onLocate: (obs: Observation) => void;
}

/** 管理员视角：跨玻片的待复核队列 */
export default function ReviewQueue({ slides, observations, onLocate }: Props) {
  const pending = observations
    .filter((o) => o.status === "pending")
    .sort((a, b) => (a.submittedAt ?? 0) - (b.submittedAt ?? 0));
  if (pending.length === 0) return null;

  const slideName = (id: string) => slides.find((s) => s.id === id)?.name ?? "未知玻片";

  return (
    <section className="panel review-queue">
      <div className="section-heading">
        <div>
          <p className="eyebrow">复核队列</p>
          <h2>待复核记录（{pending.length}）</h2>
        </div>
      </div>
      <ul className="queue-list">
        {pending.map((obs) => (
          <li key={obs.id}>
            <span className="mag-badge">{obs.magnification}</span>
            <div className="queue-info">
              <strong>{slideName(obs.slideId)}</strong>
              <span>
                {obs.staining} · 提交于 {formatTime(obs.submittedAt ?? obs.updatedAt)}
              </span>
            </div>
            <button className="primary-action" onClick={() => onLocate(obs)}>
              前往复核
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
