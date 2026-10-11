import { statusStyles } from '../utils/helpers';

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || statusStyles.STOPPED;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] ${style.badge}`}>
      <span className={`status-dot ${style.dot}`} />
      {style.label}
    </span>
  );
}
