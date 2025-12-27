<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUser } from '~/lib/useUser';
import type { UpdateProfilePayload } from '~/types/user';

const router = useRouter();
const { userProfile, updateProfile } = useUser();

const editForm = reactive<UpdateProfilePayload>({
  name: '',
  address: null,
});

const isSubmitting = ref(false);
const errors = reactive({ name: '' });
const apiError = ref('');
const successMessage = ref('');

onMounted(() => {
  if (userProfile.value.id) {
    editForm.name = userProfile.value.name || '';
    editForm.address = userProfile.value.address || '';
  }
});

const validate = () => {
  errors.name = '';
  let isValid = true;

  const currentName = editForm.name || '';

  if (!currentName.trim() || currentName.trim().length < 2) {
    errors.name = '姓名為必填欄位，且至少需要2個字。';
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  apiError.value = '';
  successMessage.value = '';

  if (!validate()) {
    return;
  }

  // 檢查是否有實際變更
  const isNameChanged =
    (editForm.name || '').trim() !== (userProfile.value.name || '').trim();
  const newAddress = editForm.address?.trim() === '' ? null : editForm.address;
  const isAddressChanged = newAddress !== userProfile.value.address;

  if (!isNameChanged && !isAddressChanged) {
    apiError.value = '您沒有進行任何變更。';
    return;
  }

  isSubmitting.value = true;

  // 構建只包含有變更的 payload
  const payload: UpdateProfilePayload = {};
  if (isNameChanged) {
    payload.name = (editForm.name || '').trim();
  }
  if (isAddressChanged) {
    payload.address = newAddress;
  }

  try {
    await updateProfile(payload);
    successMessage.value = '個人檔案已成功更新！即將返回概覽頁面。';

    setTimeout(() => {
      router.push('/profile/overview');
    }, 1500);
  } catch (err: unknown) {
    const error = err as Error;
    apiError.value = error.message || '連線或伺服器發生未預期錯誤。';
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancel = () => {
  router.push('/profile/overview');
};
</script>

<template>
  <NuxtLayout name="header-all">
    <div class="flex flex-col w-full flex-1 items-center justify-center px-4">
      <div
        class="w-full max-w-xl p-8 border border-gray-200 rounded-xl shadow-lg bg-white"
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
              :value="userProfile.email"
              type="email"
              disabled
              class="w-full p-2 border rounded-lg bg-gray-100 cursor-not-allowed text-gray-500"
            />
            <p class="text-xs text-gray-500 mt-1">
              電子郵件為帳號識別，無法在此頁面修改。
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
              <span v-if="isSubmitting">儲存中...</span>
              <span v-else>儲存變更</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </NuxtLayout>
</template>
