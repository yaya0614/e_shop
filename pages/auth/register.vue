<template>
  <div
    class="max-w-lg mx-auto mt-12 p-8 border border-gray-200 rounded-xl shadow-lg bg-white"
  >
    <h2 class="text-3xl font-bold text-center mb-6 text-gray-800">
      新用戶註冊
    </h2>

    <form
      class="space-y-4"
      @submit.prevent="handleRegister"
    >
      <div>
        <label
          for="name"
          class="block text-sm font-medium text-gray-700 mb-1"
          >姓名:</label
        >
        <input
          id="name"
          v-model="name"
          type="text"
          required
          autocomplete="name"
          placeholder="請輸入您的姓名"
          class="w-full p-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition duration-150"
        />
      </div>

      <div>
        <label
          for="email"
          class="block text-sm font-medium text-gray-700 mb-1"
          >電子郵件:</label
        >
        <input
          id="email"
          v-model="email"
          type="email"
          required
          autocomplete="email"
          placeholder="請輸入 Email"
          class="w-full p-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition duration-150"
        />
      </div>

      <div>
        <label
          for="password"
          class="block text-sm font-medium text-gray-700 mb-1"
          >密碼:</label
        >
        <input
          id="password"
          v-model="password"
          type="password"
          required
          autocomplete="new-password"
          placeholder="至少 8 碼，包含一個大寫字母 (例如: MyPassword123)"
          class="w-full p-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition duration-150"
        />
      </div>

      <div>
        <label
          for="address"
          class="block text-sm font-medium text-gray-700 mb-1"
          >地址 (選填):</label
        >
        <input
          id="address"
          v-model="address"
          type="text"
          autocomplete="street-address"
          placeholder="例如: 台北市信義區"
          class="w-full p-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition duration-150"
        />
      </div>

      <p
        v-if="errorMessage"
        class="text-red-600 text-sm font-semibold pt-2"
      >
        ⚠️ {{ errorMessage }}
      </p>

      <button
        type="submit"
        :disabled="loading"
        class="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed mt-2"
      >
        {{ loading ? '註冊中...' : '註冊' }}
      </button>

      <NuxtLink
        to="./login"
        class="block text-center text-sm text-blue-600 hover:text-blue-800 pt-2"
      >
        已經有帳號？前往登入
      </NuxtLink>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { FetchError } from 'ofetch';

const name = ref('');
const email = ref('');
const password = ref('');
const address = ref(''); // 可選欄位
const errorMessage = ref('');
const loading = ref(false);

const router = useRouter();

const handleRegister = async () => {
  if (password.value.length < 8 || !/[A-Z]/.test(password.value)) {
    errorMessage.value = '密碼必須至少 8 個字元，且包含至少一個大寫字母。';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await $fetch('/api/auth/sign-up', {
      method: 'POST',
      body: {
        name: name.value,
        email: email.value,
        password: password.value,
        address: address.value || undefined,
      },
    });

    const token = response.token;
    localStorage.setItem('authToken', token);

    router.push('/home');
  } catch (error) {
    if (error instanceof FetchError) {
      const apiMessage = error.message;

      switch (error.statusCode) {
        case 400:
          errorMessage.value = `註冊失敗：${apiMessage}`;
          break;
        case 409:
          errorMessage.value = '此 Email 已被註冊';
          break;
        default:
          errorMessage.value = '伺服器連線或發生未知錯誤。';
      }
    }
  } finally {
    loading.value = false;
  }
};
</script>
