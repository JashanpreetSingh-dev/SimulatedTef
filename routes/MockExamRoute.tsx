import { DashboardLayout } from '../layouts/DashboardLayout';
import { MockExamView } from '../components/MockExamView';

/** Single chunk for /mock-exam* so layout + view load together (no waterfall). */
export default function MockExamRoute() {
  return (
    <DashboardLayout>
      <MockExamView />
    </DashboardLayout>
  );
}
