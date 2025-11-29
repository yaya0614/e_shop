<template>
  <div class="register-container">
    <h2>新用戶註冊</h2>
    <form @submit.prevent="handleRegister" class="register-form">

      <label for="name">姓名:</label>
      <input
        type="text"
        id="name"
        v-model="name"
        required
        placeholder="請輸入您的姓名"
      />

      <label for="email">電子郵件:</label>
      <input
        type="email"
        id="email"
        v-model="email"
        required
        placeholder="請輸入 Email"
      />

      <label for="password">密碼:</label>
      <input
        type="password"
        id="password"
        v-model="password"
        required
        placeholder="至少 8 碼，包含一個大寫字母 (例如: MyPassword123)"
      />

      <label for="address">地址 (選填):</label>
      <input
        type="text"
        id="address"
        v-model="address"
        placeholder="例如: 台北市信義區"
      />

      <p v-if="errorMessage" class="error-message">⚠️ {{ errorMessage }}</p>

      <button type="submit" :disabled="loading" class="register-button">
        {{ loading ? '註冊中...' : '註冊' }}
      </button>

      <NuxtLink to="/login" class="login-link">
        已經有帳號？前往登入
      </NuxtLink>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const name = ref('');
const email = ref('');
const password = ref('');
const address = ref(''); // 可選欄位
const errorMessage = ref('');
const loading = ref(false);

// 函數名稱已更正為 handleRegister
const handleRegister = async () => {
  // 基礎前端密碼驗證 (與後端規則一致)
  if (password.value.length < 8 || !/[A-Z]/.test(password.value)) {
    errorMessage.value = '密碼必須至少 8 個字元，且包含至少一個大寫字母。';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    // API 路徑保持正確的 /api/auth/sign-up
    const response = await $fetch('/api/auth/sign-up', {
      method: 'POST',
      body: {
        name: name.value,
        email: email.value,
        password: password.value,
        // 如果地址為空，則傳送 undefined，讓後端忽略
        address: address.value || undefined,
      }
    });

    // 註冊成功處理：儲存 Token
    const token = response.token;
    console.log('註冊成功，已自動登入並獲取 Token:', token);

    // 儲存 Token (注意安全性問題，未來建議改用 HttpOnly Cookie)
    localStorage.setItem('authToken', token);

    // 導航到應用程式的主頁
    await navigateTo('/', { replace: true });

  } catch (error) {
    // 錯誤處理
    console.error('註冊 API 錯誤:', error);

    const apiMessage = error.data?.message;

    if (error.statusCode === 400) {
        // 400: 例如 'User already exists' 或格式驗證失敗
        errorMessage.value = `註冊失敗：${apiMessage}`;
    } else {
        errorMessage.value = '伺服器連線或發生未知錯誤。';
    }

  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-container {
  max-width: 450px;
  margin: 50px auto;
  padding: 30px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.register-form input {
  width: 100%;
  padding: 12px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
.register-button {
  width: 100%;
  padding: 12px;
  background-color: #28a745; /* 綠色按鈕 */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}
.register-button:disabled {
  background-color: #6c757d;
}
.error-message {
    color: red;
    font-weight: bold;
    margin-bottom: 10px;
}
.login-link {
  display: block;
  text-align: center;
  margin-top: 20px;
  color: #007bff;
}
</style>