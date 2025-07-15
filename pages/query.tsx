import type { ReactElement } from 'react';
import { SOQLQueryTool } from '../components/SOQLQueryTool';
import { AuthenticatedLayout } from '../layouts/AuthenticatedLayout';
import type { NextPageWithLayout } from '../types/layout';

const QueryPage: NextPageWithLayout = () => {
  return <SOQLQueryTool />;
};

QueryPage.getLayout = function getLayout(page: ReactElement) {
  return <AuthenticatedLayout>{page}</AuthenticatedLayout>;
};

export default QueryPage;
