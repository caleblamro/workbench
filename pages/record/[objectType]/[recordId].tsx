import type { ReactElement } from 'react';
import { useRouter } from 'next/router';
import { RecordDetail } from '../../../components/RecordDetail';
import { AuthenticatedLayout } from '../../../layouts/AuthenticatedLayout';
import type { NextPageWithLayout } from '../../../types/layout';

const RecordPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { objectType, recordId } = router.query;

  // Handle loading state while router populates query params
  if (!objectType || !recordId) {
    return null; // or a loading spinner
  }

  return (
    <RecordDetail 
      objectType={objectType as string} 
      recordId={recordId as string} 
    />
  );
};

RecordPage.getLayout = function getLayout(page: ReactElement) {
  return <AuthenticatedLayout>{page}</AuthenticatedLayout>;
};

export default RecordPage;
