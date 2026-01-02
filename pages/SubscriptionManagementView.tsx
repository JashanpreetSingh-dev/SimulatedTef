import React from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { SubscriptionManagement } from '../components/SubscriptionManagement';

export function SubscriptionManagementView() {
  return (
    <DashboardLayout>
      <div className="h-full flex flex-col overflow-hidden">
        <SubscriptionManagement />
      </div>
    </DashboardLayout>
  );
}
