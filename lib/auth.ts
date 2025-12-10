// /lib/auth.ts
import { ref, computed } from 'vue';
import type { UserState, UserProfile } from '~/types/user'; // 修正匯入路徑

// 虛擬的用戶資料
const MOCK_USER_DATA: UserProfile = {
  id: 'user-001',
  name: '王小明',
  email: 'ming.wang@example.com',
  address: '臺北市信義區忠孝東路 100 號 5 樓',
  role: 'USER',
  createdAt: new Date(2023, 5, 10).toISOString(),
  updatedAt: new Date().toISOString(),
};

// 虛擬的供應商資料 (模擬 Enhanced Token 內容)
const MOCK_VENDOR_SCOPE = {
  id: 'vendor-123',
  name: '魔法史萊姆商店',
  role: 'MANAGER',
};

// 狀態管理
const userState = ref<UserState>({
  profile: MOCK_USER_DATA,
  vendor: MOCK_VENDOR_SCOPE,
});

// 將此檔案命名為 useAuth 或 authHelper，在 pages 中使用 import { useAuth } from '~/lib/auth';
export function useAuth() {
  const userProfile = computed(() => userState.value.profile);
  const vendorScope = computed(() => userState.value.vendor);

  const updateProfile = async (
    newProfile: Omit<UserProfile, 'id' | 'role' | 'createdAt' | 'updatedAt'>,
  ) => {
    // 模擬後端更新成功並返回新的 updated-at
    userState.value.profile = {
      ...userState.value.profile,
      ...newProfile,
      updatedAt: new Date().toISOString(),
    };
    return true;
  };

  const enterVendorDashboard = async (vendorId: string) => {
    // 模擬 Token Exchange API 流程
    return true;
  };

  return {
    userProfile,
    vendorScope,
    updateProfile,
    enterVendorDashboard,
  };
}
