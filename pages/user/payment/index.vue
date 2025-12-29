<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { usePayment } from '~/lib/usePayment';

// 1. 初始化導覽與 API 功能
const router = useRouter();
const { payments, refresh, pending, bindCard, deleteCard } = usePayment();

// 2. 狀態管理
const isSubmitting = ref(false);
const form = reactive({
  cardNumber: '',
  cardHolderName: '',
  expiryMonth: 12,
  expiryYear: 2027,
  cvv: '',
});

/**
 * 返回邏輯：回到個人檔案概覽
 */
const handleBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/user/profile/overview');
  }
};

/**
 * 處理卡片綁定 (POST)
 */
const handleBind = async () => {
  isSubmitting.value = true;
  try {
    // 提醒：測試時請使用卡號 4242424242424242
    await bindCard({
      ...form,
      cardNumber: form.cardNumber.replace(/\s/g, ''),
    });

    alert('✅ 信用卡綁定成功！');
    refresh(); // 重新獲取卡片列表

    // 重置表單
    Object.assign(form, { cardNumber: '', cardHolderName: '', cvv: '' });
  } catch (e: any) {
    // 顯示後端拋出的錯誤訊息 (例如 400 Bad Request 或 409 Conflict)
    alert(e.data?.message || '❌ 綁定失敗，請檢查卡號資訊');
  } finally {
    isSubmitting.value = false;
  }
};

/**
 * 處理卡片刪除 (DELETE)
 */
const handleDelete = async (id: string) => {
  if (!confirm('確定要刪除此付款方式嗎？')) return;
  try {
    await deleteCard(id);
    refresh(); // 重新整理列表
  } catch (e: any) {
    alert(e.data?.message || '刪除失敗');
  }
};
</script>

<template>
  <NuxtLayout name="header-all">
    <div
      class="flex flex-col w-full min-h-screen items-center py-10 px-4 bg-gray-50/50"
    >
      <div
        class="w-full max-w-md p-8 border border-gray-200 rounded-xl shadow-lg bg-white"
      >
        <button
          @click="handleBack"
          class="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-1 transform group-hover:-translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          返回個人檔案
        </button>

        <h2 class="text-3xl font-bold text-center mb-8 text-gray-800">
          付款方式管理
        </h2>

        <div class="mb-10">
          <h3
            class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4"
          >
            您的儲存卡片
          </h3>

          <div
            v-if="pending"
            class="flex justify-center py-8"
          >
            <svg
              class="animate-spin h-6 w-6 text-blue-500"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>

          <div
            v-else-if="!payments?.payments.length"
            class="text-center py-8 border border-dashed border-gray-300 rounded-lg text-gray-400 text-sm"
          >
            目前沒有已綁定的信用卡
          </div>

          <div
            v-else
            class="space-y-3"
          >
            <div
              v-for="card in payments.payments"
              :key="card.id"
              class="group relative p-4 border border-gray-200 rounded-xl bg-gray-50 flex justify-between items-center transition hover:border-blue-300 hover:shadow-sm"
            >
              <div class="flex items-center gap-4">
                <div
                  class="px-2 py-1 bg-blue-600 text-white text-[10px] font-black rounded italic uppercase"
                >
                  {{ card.type }}
                </div>
                <div>
                  <p class="text-sm font-bold text-gray-800">
                    **** **** **** {{ card.lastFour }}
                  </p>
                  <p class="text-[11px] text-gray-500">
                    {{ card.bankName }} | 有效期 {{ card.expiryMonth }}/{{
                      card.expiryYear
                    }}
                  </p>
                </div>
              </div>
              <button
                @click="handleDelete(card.id)"
                class="text-gray-300 hover:text-red-500 transition-colors p-1"
                title="刪除卡片"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <hr class="mb-10 border-gray-100" />

        <form
          @submit.prevent="handleBind"
          class="space-y-5"
        >
          <h3
            class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4"
          >
            新增付款方式
          </h3>

          <div>
            <label class="block text-sm font-medium mb-1.5 text-gray-700"
              >持卡人姓名</label
            >
            <input
              v-model="form.cardHolderName"
              type="text"
              class="block w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 outline-none transition"
              placeholder="英文全名"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1.5 text-gray-700"
              >信用卡號碼</label
            >
            <input
              v-model="form.cardNumber"
              type="text"
              maxlength="16"
              class="block w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 outline-none transition"
              placeholder="16 位卡號"
              required
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1.5 text-gray-700"
                >有效期 (月)</label
              >
              <input
                v-model.number="form.expiryMonth"
                type="number"
                min="1"
                max="12"
                class="block w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 outline-none transition"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1.5 text-gray-700"
                >有效期 (年)</label
              >
              <input
                v-model.number="form.expiryYear"
                type="number"
                :min="new Date().getFullYear()"
                class="block w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 outline-none transition"
                required
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1.5 text-gray-700"
              >安全碼 (CVV)</label
            >
            <input
              v-model="form.cvv"
              type="password"
              maxlength="3"
              class="block w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 outline-none transition"
              placeholder="***"
              required
            />
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full mt-4 py-3 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg
              v-if="isSubmitting"
              class="animate-spin h-4 w-4 text-white"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{ isSubmitting ? '處理中...' : '確認綁定卡片' }}
          </button>
        </form>
      </div>
    </div>
  </NuxtLayout>
</template>

<style scoped>
/* 移除 Chrome/Safari 的數字輸入框箭頭 */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
