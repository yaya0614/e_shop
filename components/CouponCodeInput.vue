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
// 假設您的 Alert 元件有 success/destructive/info 等 type

const emit = defineEmits(['couponClaimed']);

const code = ref('');
const loading = ref(false);
const codeError = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// 錯誤碼映射函式 (與前一個版本相同，省略)

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

    successMessage.value = `優惠碼 "${code.value.trim()}" 領取成功！`;
    code.value = '';
    emit('couponClaimed');
  } catch (e: any) {
    // 錯誤處理邏輯 (與前一個版本相同，省略)
    codeError.value = e.message || '領取失敗，請稍後再試。';
  } finally {
    loading.value = false;
  }
};
</script>
