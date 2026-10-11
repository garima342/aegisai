import SystemDetailPage from '@/app/systems/[id]/page';

export default function ResultsPage() {
  return <SystemDetailPage params={Promise.resolve({ id: 'sys-hr-recruitment-01' })} />;
}
