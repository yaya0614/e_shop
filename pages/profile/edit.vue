<template>
  <div
    class="max-w-xl mx-auto mt-12 p-8 border border-gray-200 rounded-xl shadow-lg bg-white"
  >
    <h2 class="text-3xl font-bold text-center mb-6 text-gray-800">
      ✏️ 編輯個人資料
    </h2>

    <p
      v-if="apiError"
      class="text-red-600 text-sm font-semibold pt-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
    >
      ⚠️ {{ apiError }}
    </p>
    <p
      v-if="successMessage"
      class="text-green-600 text-sm font-semibold pt-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"
    >
      ✔ {{ successMessage }}
    </p>

    <form
      class="space-y-6"
      @submit.prevent="handleSubmit"
    >
      <div>
        <label
          for="name"
          class="block text-sm font-medium text-gray-700 mb-1"
        >
          姓名:
        </label>
        <input
          id="name"
          v-model="editForm.name"
          type="text"
          required
          placeholder="請輸入您的真實姓名"
          class="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
          :class="{ 'border-red-500': errors.name }"
        />
        <p
          v-if="errors.name"
          class="text-red-500 text-xs mt-1"
        >
          {{ errors.name }}
        </p>
      </div>

      <div>
        <label
          for="email"
          class="block text-sm font-medium text-gray-700 mb-1"
        >
          電子郵件:
        </label>
        <input
          id="email"
          v-model="editForm.email"
          type="email"
          required
          autocomplete="email"
          placeholder="請輸入 Email 地址"
          class="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
          :class="{ 'border-red-500': errors.email }"
        />
        <p
          v-if="errors.email"
          class="text-red-500 text-xs mt-1"
        >
          {{ errors.email }}
        </p>
      </div>

      <div>
        <label
          for="address"
          class="block text-sm font-medium text-gray-700 mb-1"
        >
          聯絡地址 (可選):
        </label>
        <textarea
          id="address"
          v-model="editForm.address"
          rows="3"
          placeholder="用於訂單寄送，可選填"
          class="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 resize-y"
        ></textarea>
      </div>

      <div class="flex space-x-4 pt-4">
        <button
          type="button"
          class="w-1/3 py-2 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition duration-200"
          @click="handleCancel"
        >
          取消
        </button>
        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-2/3 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? '儲存中...' : '儲存變更' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
// *** 修正匯入路徑 ***
import { useAuth } from '~/lib/auth';
import type { UserProfile } from '~/types/user';

const { userProfile, updateProfile } = useAuth();
const router = useRouter();

// 編輯表單狀態初始化
const editForm = reactive<
  Omit<UserProfile, 'id' | 'role' | 'createdAt' | 'updatedAt'>
>({
  name: '',
  email: '',
  address: null,
});

const isSubmitting = ref(false);
const errors = reactive({ name: '', email: '' });
const apiError = ref('');
const successMessage = ref('');

// 組件載入時，從 Composable 載入當前資料
onMounted(() => {
  if (import.meta.client) {
    editForm.name = userProfile.value.name;
    editForm.email = userProfile.value.email;
    editForm.address = userProfile.value.address || '';
  }
});

// 前端表單驗證邏輯
const validate = () => {
  errors.name = '';
  errors.email = '';
  let isValid = true;

  if (!editForm.name.trim()) {
    errors.name = '姓名為必填欄位。';
    isValid = false;
  }

  if (!editForm.email.trim() || !/\S+@\S+\.\S+/.test(editForm.email)) {
    errors.email = '請輸入有效的電子郵件地址。';
    isValid = false;
  }

  return isValid;
};

// 提交表單處理 (模擬 API 流程)
const handleSubmit = async () => {
  apiError.value = '';
  successMessage.value = '';

  if (!validate()) {
    return;
  }

  isSubmitting.value = true;

  try {
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 模擬後端錯誤情境
    if (editForm.email === 'error@test.com') {
      throw new Error('此電子郵件已被其他帳戶使用或格式不符後端規範。');
    }

    await updateProfile(editForm);

    successMessage.value = '個人檔案已成功更新！即將返回概覽頁面。';

    setTimeout(() => {
      router.push('/profile/overview');
    }, 1500);
  } catch (err: any) {
    apiError.value = err.message || '連線或伺服器發生未預期錯誤。';
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancel = () => {
  router.push('/profile/overview');
};
</script>

<style scoped>
/* 保持簡潔，所有樣式透過 Tailwind 類別處理 */
</style>
