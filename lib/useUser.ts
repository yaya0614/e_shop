import { ref } from 'vue';
import type { UserProfile, UpdateProfilePayload } from '~/types/user';
import { FetchError } from 'ofetch'; // 導入 ofetch 的 FetchError 進行精確型別檢查

// 假設的初始狀態 (用於未登入或加載中)
const initialProfile: UserProfile = {
  id: '',
  name: null,
  email: '',
  address: null,
  role: 'GUEST', // 預設為 GUEST
};

const userProfile = ref<UserProfile>(initialProfile);
const isLoading = ref(false);

export const useUser = () => {
  //載入使用者的個人資料 (GET /api/user/profile)
  const fetchUserProfile = async () => {
    isLoading.value = true;
    try {
      const response = await $fetch<{ success: boolean; user: UserProfile }>(
        '/api/user/profile',
        // 根據 README，對於需要認證的 API 應使用 credentials: 'include'
        { credentials: 'include' },
      );

      if (response.success) {
        userProfile.value = response.user;
      }
    } catch {
      // 狀態重置邏輯保持不變。
      userProfile.value = initialProfile;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 更新使用者的個人資料 (PATCH /api/user/profile)
   * @param payload 包含要更新的 name 或 address
   */
  const updateProfile = async (
    payload: UpdateProfilePayload,
  ): Promise<UserProfile> => {
    try {
      const updateData: UpdateProfilePayload = {
        name: payload.name,
        address: payload.address === '' ? null : payload.address, // 如果地址為空字串，傳遞 null
      };

      if (Object.keys(updateData).length === 0) {
        throw new Error('沒有資料可供更新。');
      }

      const response = await $fetch<{ success: boolean; user: UserProfile }>(
        '/api/user/profile',
        {
          method: 'PATCH',
          body: updateData,
          credentials: 'include', // 根據 README，使用 credentials: 'include'
        },
      );

      if (response.success) {
        userProfile.value = response.user;
        return response.user;
      }

      throw new Error('伺服器更新失敗。');
    } catch (error: unknown) {
      let errorMessage = '更新個人資料時發生未預期錯誤。';

      // 使用 FetchError 進行型別縮小
      if (error instanceof FetchError) {
        // 警告 B 修正：優先從 response._data 讀取後端明確的 message
        const errorData = error.response?._data as
          | { message?: string }
          | undefined;

        if (errorData?.message) {
          errorMessage = errorData.message;
        } else {
          // 如果 _data.message 不存在，則使用 FetchError 自身的 message
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        // 處理我們自己拋出的 New Error('沒有資料可供更新')
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  };

  return {
    userProfile,
    isLoading,
    fetchUserProfile,
    updateProfile,
  };
};

if (import.meta.client) {
  useUser().fetchUserProfile();
}
