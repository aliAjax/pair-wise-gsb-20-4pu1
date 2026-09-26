import { useState } from "react";
import type { Observation } from "../types";
import { MAGNIFICATIONS, STAINING_SUGGESTIONS } from "../types";
import type { ObservationPatch } from "../state";

interface Props {
  /** 传入则为编辑已有记录，否则为新增 */
  initial?: Observation;
  defaultStaining: string;
  onSave: (patch: ObservationPatch, submit: boolean) => void;
  onCancel: () => void;
}

export default function ObservationForm({ initial, defaultStaining, onSave, onCancel }: Props) {
  const [magnification, setMagnification] = useState(initial?.magnification ?? MAGNIFICATIONS[0]);
  const [staining, setStaining] = useState(initial?.staining ?? defaultStaining);
  const [structures, setStructures] = useState(initial?.structures ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [error, setError] = useState("");

  const isResubmit = initial?.status === "rejected";

  const handle = (submit: boolean) => {
    if (!magnification || !staining.trim()) {
      setError("放大倍数和染色方式必填，才能保存草稿");
      return;
    }
    if (submit && (!structures.trim() || !description.trim())) {
      setError("提交复核前请补全观察结构和视野描述");
      return;
    }
    onSave(
      {
        magnification,
        staining: staining.trim(),
        structures: structures.trim(),
        description: description.trim(),
      },
      submit
    );
  };

  return (
    <div className="obs-form">
      <div className="obs-form-grid">
        <label>
          <span>放大倍数 *</span>
          <select value={magnification} onChange={(e) => setMagnification(e.target.value)}>
            {MAGNIFICATIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>染色方式 *</span>
          <input
            value={staining}
            onChange={(e) => setStaining(e.target.value)}
            placeholder="如：碘液"
            list="staining-suggestions"
          />
        </label>
        <label className="span-2">
          <span>观察结构{initial ? " *" : "（提交前必填）"}</span>
          <input
            value={structures}
            onChange={(e) => setStructures(e.target.value)}
            placeholder="如：细胞壁、细胞核"
          />
        </label>
        <label className="span-2">
          <span>视野描述 / 结论{initial ? " *" : "（提交前必填）"}</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="描述视野中看到的形态、分布与初步结论"
          />
        </label>
      </div>
      <datalist id="staining-suggestions">
        {STAINING_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button className="subtle-action" onClick={() => handle(false)}>
          {initial ? "保存修改" : "存为草稿"}
        </button>
        <button className="primary-action" onClick={() => handle(true)}>
          {isResubmit ? "保存并重新提交" : "保存并提交复核"}
        </button>
        <button className="ghost-action" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  );
}
