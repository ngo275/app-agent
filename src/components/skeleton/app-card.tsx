import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function AppCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg">
      <Skeleton height={24} width="80%" className="mb-2" />
      <Skeleton count={2} />
    </div>
  );
}
