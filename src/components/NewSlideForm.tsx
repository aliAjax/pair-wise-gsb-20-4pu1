import { useState } from "react";
import { SAMPLE_TYPES, STAINING_SUGGESTIONS } from "../types";

interface Props {
  onAdd: (name: string, sampleType: string, staining: string) => void;
}

export default function NewSlideForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sampleType, setSampleType] = useState(SAMPLE_TYPES[0]);
  const [staining, setStaining] = useState("");
  const [error, setError] = useState("");

  const reset = () => {
    setName("");
    setSampleType(SAMPLE_TYPES[0]);
    setStaining("");
    setError("");
  };

  const submit = () => {
    if (!name.trim()) {
      setError("请填写样本名称");
      return;
    }
    onAdd(name.trim(), sampleType, staining.trim() || "未染色");
    reset();
    setOpen(false);
  };

  if (!open) {
    return (
      <button className="primary-action block-action" onClick={() => setOpen(true)}>
        ＋ 新增玻片
      </button>
    );
  }

  return (
    <div className="new-slide-form">
      <label>
        <span>样本名称 *</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="如：洋葱鳞片叶表皮"
          autoFocus
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
          value={staining}
          onChange={(e) => setStaining(e.target.value)}
          placeholder="如：碘液"
          list="staining-suggestions"
        />
      </label>
      <datalist id="staining-suggestions">
        {STAINING_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button className="primary-action" onClick={submit}>
          创建玻片
        </button>
        <button
          className="ghost-action"
          onClick={() => {
            reset();
            setOpen(false);
          }}
        >
          取消
        </button>
      </div>
    </div>
  );
}
