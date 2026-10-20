import { Navigate, useSearchParams } from 'react-router-dom';

/**
 * AddLoom redirect component.
 * Add Loom is now unified as a dedicated tab inside Settings (/settings?tab=add-loom).
 */
export default function AddLoom() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  return <Navigate to={editId ? `/settings?tab=add-loom&edit=${editId}` : '/settings?tab=add-loom'} replace />;
}
