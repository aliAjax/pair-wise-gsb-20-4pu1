import type { Observation, Slide } from "../types";

interface Props {
  slides: Slide[];
  observations: Observation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function SlideList({ slides, observations, selectedId, onSelect }: Props) {
  return (
    <div className="slide-list">
      {slides.map((slide) => {
        const obs = observations.filter((o) => o.slideId === slide.id);
        const pending = obs.filter((o) => o.status === "pending").length;
        const rejected = obs.filter((o) => o.status === "rejected").length;
        const drafts = obs.filter((o) => o.status === "draft").length;
        const approved = obs.filter((o) => o.status === "approved").length;
        return (
          <button
            key={slide.id}
            className={`slide-item${slide.id === selectedId ? " active" : ""}`}
            onClick={() => onSelect(slide.id)}
          >
            <span className="slide-item-head">
              <strong>{slide.name}</strong>
              <em>{slide.sampleType}</em>
            </span>
            <span className="slide-item-badges">
              {pending > 0 && <i className="count-badge badge-pending">{pending} 待复核</i>}
              {rejected > 0 && <i className="count-badge badge-rejected">{rejected} 退回</i>}
              {drafts > 0 && <i className="count-badge badge-draft">{drafts} 草稿</i>}
              {approved > 0 && <i className="count-badge badge-approved">{approved} 定稿</i>}
              {obs.length === 0 && <i className="count-badge">暂无记录</i>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
