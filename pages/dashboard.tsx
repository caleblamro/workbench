import type { ReactElement } from 'react';
import { DashboardContent } from '../components/DashboardContent';
import { AuthenticatedLayout } from '../layouts/AuthenticatedLayout';
import type { NextPageWithLayout } from '../types/layout';

const DashboardPage: NextPageWithLayout = () => {
  return <DashboardContent />;
};

DashboardPage.getLayout = function getLayout(page: ReactElement) {
  return <AuthenticatedLayout>{page}</AuthenticatedLayout>;
};

export default DashboardPage;
