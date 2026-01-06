export type UserRole = 'USER' | 'ADMIN' | 'GUEST';

// 來自後端 GET /api/user/profile 的使用者資料結構
export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  address: string | null;
  role: UserRole;
  // 這裡省略了 createdAt 和 updatedAt，因為後端 API 沒回傳它們
}

// 用於 PATCH /api/user/profile 的請求資料結構
export interface UpdateProfilePayload {
  name?: string;
  address?: string | null; // 允許為 null
}
