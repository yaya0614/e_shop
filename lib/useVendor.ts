import { toast } from 'vue-sonner';

// 嚴格定義角色型別
export type EmployeeRole = 'OWNER' | 'ADMIN' | 'CLERK';

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  role: EmployeeRole;
}

// 對應 /api/vendor/[vendorId]/info 的回傳格式
export interface VendorInfo {
  vendorId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: string;
  ownerName: string | null;
}

interface ApiError {
  statusCode?: number;
  message?: string;
  data?: { message?: string };
}

export const useVendor = () => {
  const vendors = ref<Vendor[]>([]);
  const loading = ref(false);

  // 參考優惠券頁面的錯誤映射邏輯
  const mapVendorErrorToUserMessage = (
    e: ApiError,
  ): { title: string; description: string } => {
    let title = '操作失敗';
    let description = '無法連線到伺服器，請檢查您的網路。';

    if (e.statusCode) {
      title = `錯誤碼 ${e.statusCode}`;
      switch (e.statusCode) {
        case 401:
          description = '您尚未登入或登入已過期，請重新登入。';
          break;
        case 403:
          description = '您沒有權限執行此操作。';
          break;
        case 404:
          description = '找不到目標商家資訊。';
          break;
        case 409:
          // 針對建立上限或重複申請的特定錯誤
          description =
            e.data?.message ||
            e.message ||
            '操作衝突，可能已達到上限或重複申請。';
          break;
        case 500:
          description = '伺服器發生未預期的錯誤，請稍後再試。';
          break;
        default:
          description =
            e.data?.message || e.message || '伺服器返回一個未知的錯誤。';
          break;
      }
    }
    return { title, description };
  };

  const handleError = (e: unknown) => {
    const err = e as ApiError;
    const { title, description } = mapVendorErrorToUserMessage(err);
    toast.error(title, { description, duration: 5000 });
  };

  const fetchVendors = async () => {
    loading.value = true;
    try {
      const response = await $fetch<{ vendors: Vendor[] }>('/api/vendor', {
        credentials: 'include',
      });
      vendors.value = response.vendors;
    } catch (e) {
      handleError(e);
    } finally {
      loading.value = false;
    }
  };

  const applyToVendor = async (
    vendorId: string,
    payload: { email: string; role: EmployeeRole },
  ) => {
    loading.value = true;
    try {
      await $fetch(`/api/vendor/${vendorId}/employee`, {
        method: 'POST',
        body: payload,
        credentials: 'include',
      });
      toast.success('申請成功', { description: '您已成功加入該商家成員。' });
      return true;
    } catch (e) {
      handleError(e);
      return false;
    } finally {
      loading.value = false;
    }
  };

  const createVendor = async (payload: Omit<Vendor, 'id' | 'role'>) => {
    loading.value = true;
    try {
      await $fetch('/api/vendor', {
        method: 'POST',
        body: payload,
        credentials: 'include',
      });
      toast.success('建立成功', { description: '您的新商家已成功註冊。' });
      await fetchVendors();
      return true;
    } catch (e) {
      handleError(e);
      return false;
    } finally {
      loading.value = false;
    }
  };

  return { vendors, loading, fetchVendors, createVendor, applyToVendor };
};
