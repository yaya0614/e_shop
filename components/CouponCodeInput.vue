<template>
  <div>
    <InputGroup class="mb-3">
      <Input
        v-model="code"
        type="text"
        placeholder="請輸入優惠碼 (如: TEST200)"
        :disabled="loading"
        :error="!!codeError"
      />
      <Button
        :disabled="loading || !code.trim()"
        :loading="loading"
        @click="handleUseCode"
      >
        領取優惠
      </Button>
    </InputGroup>

    <Alert
      v-if="codeError"
      type="destructive"
      title="領取失敗"
    >
      <p>{{ codeError }}</p>
    </Alert>
    <Alert
      v-if="successMessage"
      type="success"
      title="領取成功"
    >
      <p>{{ successMessage }}</p>
    </Alert>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
// 引入您元件庫中的基礎元件
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { InputGroup } from '~/components/ui/input-group';
import { Alert } from '~/components/ui/alert';
import { toast } from 'vue-sonner';
// 假設您的 Alert 元件有 success/destructive/info 等 type

const emit = defineEmits(['couponClaimed']);

const code = ref('');
const loading = ref(false);
const codeError = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// 錯誤碼映射函式 (與前一個版本相同，省略)

const mapErrorCodeToMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'COUPON_NOT_FOUND':
      return '查無此優惠碼，請檢查輸入。';
    case 'COUPON_EXPIRED':
      return '此優惠碼已過期。';
    case 'COUPON_ALREADY_USED':
      return '此優惠碼已被領取或使用。';
    case 'MIN_PRICE_NOT_REACHED':
      return '未達使用門檻金額。';
    case 'INVALID_COUPON_FORMAT':
      return '優惠碼格式錯誤。';
    default:
      return '領取失敗，請稍後再試。';
  }
};

const handleUseCode = async () => {
  if (!code.value.trim()) return;

  loading.value = true;
  codeError.value = null;
  successMessage.value = null;

  try {
    await $fetch('/api/coupon/use-code', {
      method: 'POST',
      body: { code: code.value.trim() },
    });

    toast.success(`優惠碼 "${code.value.trim()}" 領取成功！`, {
      description: '您的優惠券已更新至列表中。',
    });
    code.value = '';
    emit('couponClaimed');
  } catch (e: unknown) {
    const err = e as {
      response?: {
        _data?: { errorCode?: string; message?: string };
        status?: number;
      };
    };
    let userMessage = '無法連線到伺服器，請檢查網路。';
    let title = '領取失敗';

    if (err.response && err.response.status) {
      if (err.response._data && err.response._data.errorCode) {
        // 處理後端明確的錯誤碼 (400, 404)
        userMessage = mapErrorCodeToMessage(err.response._data.errorCode);
        title = `操作失敗 (${err.response.status})`;
      } else if (err.response.status === 401) {
        userMessage = '您尚未登入或登入已過期。';
        title = '權限錯誤 (401)';
      } else {
        // 處理其他未定義的 HTTP 錯誤
        userMessage = `伺服器錯誤 (${err.response.status})：${err.response._data?.message || '未知錯誤'}`;
      }
    }

    toast.error(title, {
      description: userMessage,
    });
  } finally {
    loading.value = false;
  }
};
</script>
