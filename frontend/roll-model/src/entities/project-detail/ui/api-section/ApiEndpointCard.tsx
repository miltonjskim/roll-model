import { Endpoint } from '@/entities/project-detail/model/ApiTypes';

interface ApiEndpointCardProps {
  endpoint: Endpoint;
}
export default function ApiEndpointCard({ endpoint }: ApiEndpointCardProps) {
  return (
    <>
      <div>엔드포인트</div>
      <div>{endpoint.url}</div>
    </>
  );
}
