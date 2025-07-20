import type { ReactElement } from 'react';
import { ObjectInspector } from '../components/ObjectInspector';
import { AuthenticatedLayout } from '../layouts/AuthenticatedLayout';
import type { NextPageWithLayout } from '../types/layout';

const ObjectInspectorPage: NextPageWithLayout = () => {
  return <ObjectInspector />;
};

ObjectInspectorPage.getLayout = function getLayout(page: ReactElement) {
  return <AuthenticatedLayout>{page}</AuthenticatedLayout>;
};

export default ObjectInspectorPage;
