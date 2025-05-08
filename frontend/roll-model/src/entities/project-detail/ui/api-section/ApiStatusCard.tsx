import { ApiStatus } from '@/entities/project-detail/model/ApiTypes';

interface ApiStatusCardProps {
  apiStatus: ApiStatus;
}
export default function ApiStatusCard({ apiStatus }: ApiStatusCardProps) {
  return (
    <>
      <div>상태카드</div>
      <div>{apiStatus.expiresAt}</div>
    </>
  );
}
