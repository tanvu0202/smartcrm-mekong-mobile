import { priorityLabel, statusLabel } from '../lib/format.js';

export const PriorityBadge = ({ priority }) => <span className={`badge prio-${priority}`}>{priorityLabel(priority)}</span>;
export const StatusBadge = ({ status }) => <span className={`badge st-${status}`}>{statusLabel(status)}</span>;
