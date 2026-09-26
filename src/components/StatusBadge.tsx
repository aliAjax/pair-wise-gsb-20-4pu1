import type { RecordStatus } from "../types";
import { STATUS_LABEL } from "../types";

export default function StatusBadge({ status }: { status: RecordStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>;
}
