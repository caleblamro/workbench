import { SOQLQueryTool } from '../components/SOQLQueryTool';
import { WorkbenchLayout } from '../components/WorkbenchLayout';

export default function QueryPage() {
  return (
    <WorkbenchLayout>
      <SOQLQueryTool />
    </WorkbenchLayout>
  );
}
