<template>
    <div class="login-container">
      <h2>用戶登入</h2>
      <form @submit.prevent="handleLogin" class="login-form">

        <label for="email">電子郵件:</label>
        <input
          type="email"
          id="email"
          v-model="email"
          required
          placeholder="請輸入 Email (例如: test@example.com)"
        />

        <label for="password">密碼:</label>
        <input
          type="password"
          id="password"
          v-model="password"
          required
          placeholder="密碼 (至少 8 個字元)"
        />

        <p v-if="errorMessage" style="color: red; margin-top: 10px;">
          ⚠️ {{ errorMessage }}
        </p>

        <button type="submit" :disabled="loading" style="margin-top: 20px;">
          {{ loading ? '登入中...' : '登入' }}
        </button>

        <NuxtLink to="/sign-up" style="display: block; margin-top: 15px;">
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
    // 簡單的前端驗證，提高用戶體驗
    if (!email.value || password.value.length < 8) {
      errorMessage.value = '請確認 Email 格式正確且密碼至少 8 位數。';
      return;
    }

    loading.value = true;
    errorMessage.value = ''; // 重置錯誤訊息

    try {
      // 呼叫 API
      const response = await $fetch('/api/auth/sign-in', {
        method: 'POST',
        body: {
          email: email.value,
          password: password.value
        }
      });

      // 成功處理：後端返回 token
      const token = response.token;
      console.log('登入成功，已獲取 Token:', token);

      // 儲存 Token (這裡先用 localStorage，建議考慮更安全的方案)
      localStorage.setItem('authToken', token);

      // 導航到應用程式的主頁
      await navigateTo('/', { replace: true });

    } catch (error) {
      // 錯誤處理
      console.error('登入 API 錯誤:', error);

      // 提取後端返回的錯誤訊息
      const apiMessage = error.data?.message;

      if (error.statusCode === 401) {
          // 401: Invalid email or password
          errorMessage.value = apiMessage;
      } else if (error.statusCode === 400) {
          // 400: Zod 驗證錯誤
          errorMessage.value = `輸入資料格式錯誤：${apiMessage}`;
      } else {
          errorMessage.value = '連線錯誤或伺服器發生問題。';
      }

    } finally {
      loading.value = false;
    }
  };
  </script>

  <style scoped>
  /* 簡單的 CSS 樣式，您可以替換成 Tailwind CSS 或您的樣式 */
  .login-container {
    max-width: 400px;
    margin: 50px auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
  }
  .login-form input {
    width: 100%;
    padding: 10px;
    margin-bottom: 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
  }
  .login-form button {
    width: 100%;
    padding: 10px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .error-message {
      color: red;
      font-weight: bold;
  }
  </style>