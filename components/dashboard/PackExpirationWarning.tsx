import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SubscriptionStatus as SubscriptionStatusType } from '../../hooks/useSubscription';

interface PackExpirationWarningProps {
  status: SubscriptionStatusType;
}

export function PackExpirationWarning({ status }: PackExpirationWarningProps) {
  const navigate = useNavigate();

  if (!status.packType || !status.packExpirationDate) return null;

  const expirationDate = new Date(status.packExpirationDate);
  const now = new Date();
  const diffTime = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 3 && diffDays > 0 && now < expirationDate) {
    return (
      <div className="bg-amber-300/10 border border-amber-300/20 rounded-2xl p-4 md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-base md:text-lg font-bold text-amber-700 mb-1">
              Pack Expiring Soon
            </h3>
            <p className="text-xs md:text-sm text-amber-800 mb-2">
              Your {status.packType === 'STARTER_PACK' ? 'Starter Pack' : 'Exam Ready Pack'} expires in {diffDays} {diffDays === 1 ? 'day' : 'days'}.
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="text-xs md:text-sm text-amber-700 hover:text-amber-800 font-semibold underline"
            >
              Purchase New Pack →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
