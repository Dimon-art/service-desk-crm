import CreateRequestForm from './CreateRequestForm';
import { CreateRequestInput, SupportRequest } from '../types';

export default function PublicCreateRequest() {
  const handleAddRequest = async (input: CreateRequestInput): Promise<SupportRequest> => {
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      let errMsg = 'Ошибка при создании заявки';

      try {
        const errData = await response.json();
        errMsg = errData.error || errMsg;
      } catch {
        errMsg = `Ошибка сервера (${response.status})`;
      }

      throw new Error(errMsg);
    }

    return response.json();
  };

  return (
    <div className="min-h-screen bg-[#f4f1eb] py-8 px-4">
      <CreateRequestForm
        onAddRequest={handleAddRequest}
        onNavigateHome={() => {
          window.location.href = '/';
        }}
        onNavigateList={() => {
          window.location.href = '/';
        }}
      />
    </div>
  );
}
