import React from 'react';
import { Clock, CheckCircle, GitCompare, ShieldCheck, CheckCheck, XCircle } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const s = (status || 'PENDING').toUpperCase();

  const config = {
    PENDING: { label: 'Pending Review', class: 'badge-pending', icon: Clock },
    APPROVED: { label: 'Active', class: 'badge-approved', icon: CheckCircle },
    MATCHED: { label: 'Potential Match', class: 'badge-matched', icon: GitCompare },
    CLAIMED: { label: 'Claim Verification', class: 'badge-claimed', icon: ShieldCheck },
    RETURNED: { label: 'Returned', class: 'badge-returned', icon: CheckCheck },
    REJECTED: { label: 'Rejected', class: 'badge-rejected', icon: XCircle },
  };

  const itemConfig = config[s] || config.PENDING;
  const Icon = itemConfig.icon;

  return (
    <span className={`badge ${itemConfig.class}`}>
      <Icon size={12} />
      {itemConfig.label}
    </span>
  );
};
