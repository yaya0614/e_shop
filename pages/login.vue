<template>
  <div
    class="max-w-md mx-auto mt-12 p-8 border border-gray-200 rounded-xl shadow-lg bg-white"
  >
    <h2 class="text-3xl font-bold text-center mb-6 text-gray-800">用戶登入</h2>

    <form
      class="space-y-4"
      @submit.prevent="handleLogin"
    >
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
          placeholder="請輸入 Email"
          class="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
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
          placeholder="至少 8 個字元"
          class="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
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
        class="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {{ loading ? '登入中...' : '登入' }}
      </button>

      <NuxtLink
        to="/register"
        class="block text-center text-sm text-blue-600 hover:text-blue-800 pt-2"
      >
        還沒有帳號？立即註冊
      </NuxtLink>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const loading = ref(false);

const handleLogin = async () => {
  if (!email.value || password.value.length < 8) {
    errorMessage.value = '請確認 Email 格式正確且密碼至少 8 位數。';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await $fetch('/api/auth/sign-in', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
      },
    });

    const token = response.token;
    localStorage.setItem('authToken', token);

    await navigateTo('/', { replace: true });
  } catch (error) {
    const apiMessage = error.data?.message;

    if (error.statusCode === 401) {
      errorMessage.value = apiMessage;
    } else if (error.statusCode === 400) {
      errorMessage.value = `輸入資料格式錯誤：${apiMessage}`;
    } else {
      errorMessage.value = '連線或伺服器發生未預期錯誤。';
    }
  } finally {
    loading.value = false;
  }
};
</script>
