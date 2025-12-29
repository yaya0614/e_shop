import type { GetPaymentsResponse, BindCardRequest } from '~/types/payment';

export const usePayment = () => {
  // 1. 取得卡片列表
  const {
    data: payments,
    refresh,
    pending,
  } = useFetch<GetPaymentsResponse>('/api/user/payment', {
    method: 'GET',
    credentials: 'include', // 確保傳遞 Token Cookie
  });

  // 2. 綁定卡片
  const bindCard = async (payload: BindCardRequest) => {
    return await $fetch('/api/user/payment', {
      method: 'POST',
      body: payload,
      credentials: 'include',
    });
  };

  // 3. 刪除卡片
  const deleteCard = async (id: string) => {
    return await $fetch('/api/user/payment', {
      method: 'DELETE',
      body: { id },
      credentials: 'include',
    });
  };

  return { payments, refresh, pending, bindCard, deleteCard };
};
