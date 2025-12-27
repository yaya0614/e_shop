<script setup lang="ts">
import { toast } from 'vue-sonner';

definePageMeta({
  layout: 'admin',
});

interface VendorItem {
  vendorId: string;
  name: string;
  email: string;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
  owner: {
    userId: string;
    name: string;
  } | null;
}

const {
  data: pendingData,
  pending: pendingLoading,
  error: pendingError,
  refresh: refreshPending,
} = await useFetch<{ vendor: VendorItem[] }>('/api/admin/vendor/apply', {
  method: 'GET',
  credentials: 'include',
});

const {
  data: vendorsData,
  pending: vendorsLoading,
  error: vendorsError,
  refresh: refreshVendors,
} = await useFetch<{ vendors: VendorItem[] }>('/api/admin/vendor', {
  method: 'GET',
  credentials: 'include',
});

const vendors = ref<VendorItem[]>(vendorsData.value?.vendors || []);
const pendingVendors = ref<VendorItem[]>(pendingData.value?.vendor || []);

const processingVendor = ref<string | null>(null);

const handleVendorAction = async (
  vendorId: string,
  action: 'APPROVE' | 'REJECT',
) => {
  if (processingVendor.value) return;

  const vendor = pendingVendors.value.find((v) => v.vendorId === vendorId);
  const actionText = action === 'APPROVE' ? '批准' : '拒絕';

  if (
    !confirm(`確定要${actionText}商家「${vendor?.name || vendorId}」的申請嗎？`)
  ) {
    return;
  }

  processingVendor.value = vendorId;

  try {
    await $fetch('/api/admin/vendor/apply', {
      method: 'PUT',
      credentials: 'include',
      body: {
        vendorId,
        action,
      },
    });

    if (action === 'APPROVE') {
      vendors.value.push({
        vendorId,
        name: vendor?.name || vendorId,
        email: vendor?.email || '',
        status: 'ACTIVE',
        owner: vendor?.owner || null,
      });
    }
    pendingVendors.value = pendingVendors.value.filter(
      (v) => v.vendorId !== vendorId,
    );

    toast.success(
      `${actionText}成功！商家「${vendor?.name || vendorId}」已${action === 'APPROVE' ? '批准' : '拒絕'}。`,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    toast.error(`${actionText}失敗：${errorMessage}`);
  } finally {
    processingVendor.value = null;
  }
};

const deletingVendor = ref<string | null>(null);

const handleDeleteVendor = async (vendorId: string) => {
  if (deletingVendor.value) return;

  const vendor = vendors.value.find((v) => v.vendorId === vendorId);

  if (
    !confirm(
      `確定要刪除商家「${vendor?.name || vendorId}」嗎？此操作無法復原。`,
    )
  ) {
    return;
  }

  deletingVendor.value = vendorId;

  try {
    await $fetch(`/api/admin/vendor`, {
      method: 'delete',
      credentials: 'include',
      body: {
        vendorId,
      },
    });

    vendors.value = vendors.value.filter((v) => v.vendorId !== vendorId);
    toast.success(`刪除成功！商家「${vendor?.name || vendorId}」已被刪除。`, {
      description: '商家資料已從系統中移除。',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    toast.error(`刪除失敗：${errorMessage}`, {
      description: '請稍後再試。',
    });
  } finally {
    deletingVendor.value = null;
  }
};

const refreshAll = async () => {
  await Promise.all([refreshPending(), refreshVendors()]);
};
</script>

<template>
  <div class="mx-auto px-4 py-8 flex flex-col overflow-hidden h-full w-full">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">商家管理</h1>
        <p class="mt-2 text-sm text-gray-600">管理商家申請與現有商家</p>
      </div>
      <Button
        :disabled="pendingLoading || vendorsLoading"
        variant="outline"
        @click="refreshAll"
      >
        <span v-if="pendingLoading || vendorsLoading">重新整理中...</span>
        <span
          v-else
          class="text-black"
          >重新整理</span
        >
      </Button>
    </div>
    <div class="overflow-y-auto flex flex-col flex-1 min-h-0">
      <div class="mb-12">
        <div class="mb-4 flex items-center gap-3">
          <h2 class="text-2xl font-bold text-gray-900">待審核申請</h2>
          <span
            v-if="pendingVendors.length > 0"
            class="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white"
          >
            {{ pendingVendors.length }}
          </span>
        </div>

        <div
          v-if="pendingLoading"
          class="flex items-center justify-center py-12"
        >
          <UiSpinner class="h-8 w-8" />
          <span class="ml-3 text-gray-600">載入中...</span>
        </div>

        <div
          v-else-if="pendingError"
          class="rounded-lg border border-red-200 bg-red-50 p-6"
        >
          <div class="flex items-center">
            <span class="text-2xl">⚠️</span>
            <div class="ml-3">
              <h3 class="text-lg font-semibold text-red-800">載入失敗</h3>
              <p class="mt-1 text-sm text-red-600">
                {{ pendingError.message || '無法載入待審核申請' }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-else-if="pendingVendors.length === 0"
          class="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center"
        >
          <span class="text-5xl">✓</span>
          <h3 class="mt-3 text-lg font-semibold text-gray-900">
            暫無待審核申請
          </h3>
          <p class="mt-1 text-sm text-gray-600">目前沒有需要審核的商家申請</p>
        </div>

        <div
          v-else
          class="space-y-4"
        >
          <div
            v-for="vendor in pendingVendors"
            :key="vendor.vendorId"
            class="rounded-lg border-2 border-orange-200 bg-orange-50 p-5 transition-all duration-200 hover:shadow-md"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3">
                  <h3 class="text-lg font-bold text-gray-900">
                    {{ vendor.name }}
                  </h3>
                  <span
                    class="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white"
                  >
                    待審核
                  </span>
                </div>
                <div class="mt-3 space-y-1 text-sm text-gray-700">
                  <p class="flex items-center gap-2">
                    <span class="font-semibold">📧 Email:</span>
                    <span>{{ vendor.email }}</span>
                  </p>
                  <p class="flex items-center gap-2">
                    <span class="font-semibold">👤 負責人 ID:</span>
                    <span class="font-mono text-xs">{{
                      vendor.owner?.name || '查無負責人'
                    }}</span>
                  </p>
                </div>
              </div>
              <div class="ml-4 flex gap-2">
                <Button
                  :disabled="processingVendor === vendor.vendorId"
                  variant="default"
                  @click="handleVendorAction(vendor.vendorId, 'APPROVE')"
                >
                  <span v-if="processingVendor === vendor.vendorId"
                    >處理中...</span
                  >
                  <span v-else>✓ 批准</span>
                </Button>
                <Button
                  :disabled="processingVendor === vendor.vendorId"
                  variant="destructive"
                  @click="handleVendorAction(vendor.vendorId, 'REJECT')"
                >
                  <span v-if="processingVendor === vendor.vendorId"
                    >處理中...</span
                  >
                  <span v-else>✕ 拒絕</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Vendors Section -->
      <div class="mb-12">
        <div class="mb-4 flex items-center gap-3">
          <h2 class="text-2xl font-bold text-gray-900">現有商家</h2>
          <span
            v-if="vendors.length > 0"
            class="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white"
          >
            {{ vendors.length }}
          </span>
        </div>

        <div
          v-if="vendorsLoading"
          class="flex items-center justify-center py-12"
        >
          <UiSpinner class="h-8 w-8" />
          <span class="ml-3 text-gray-600">載入中...</span>
        </div>

        <div
          v-else-if="vendorsError"
          class="rounded-lg border border-red-200 bg-red-50 p-6"
        >
          <div class="flex items-center">
            <span class="text-2xl">⚠️</span>
            <div class="ml-3">
              <h3 class="text-lg font-semibold text-red-800">載入失敗</h3>
              <p class="mt-1 text-sm text-red-600">
                {{ vendorsError.message || '無法載入商家列表' }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-else-if="vendors.length === 0"
          class="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center"
        >
          <span class="text-5xl">🏪</span>
          <h3 class="mt-3 text-lg font-semibold text-gray-900">暫無商家</h3>
          <p class="mt-1 text-sm text-gray-600">目前沒有活躍的商家</p>
        </div>

        <div
          v-else
          class="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <div
            v-for="vendor in vendors"
            :key="vendor.vendorId"
            class="rounded-lg flex flex-col border-2 border-green-200 bg-green-50 p-5 transition-all duration-200 hover:shadow-md"
          >
            <div class="mb-3 flex items-center gap-3">
              <h3 class="flex-1 text-lg font-bold text-gray-900">
                {{ vendor.name }}
              </h3>
              <span
                class="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white"
              >
                活躍
              </span>
            </div>
            <div class="mb-4 space-y-1 text-sm text-gray-700">
              <p class="flex items-center gap-2">
                <span class="font-semibold">📧</span>
                <span class="truncate">{{ vendor.email }}</span>
              </p>
              <p class="flex items-center gap-2">
                <span class="font-semibold">👤</span>
                <span class="truncate font-mono text-xs">{{
                  vendor.owner?.name || '查無負責人'
                }}</span>
              </p>
            </div>
            <div class="w-full flex items-end flex-row justify-end flex-1">
              <Button
                :disabled="deletingVendor === vendor.vendorId"
                variant="destructive"
                @click="handleDeleteVendor(vendor.vendorId)"
              >
                <span v-if="deletingVendor === vendor.vendorId">刪除中...</span>
                <span v-else>刪除商家</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Footer -->
    <div
      v-if="vendors.length > 0 || pendingVendors.length > 0"
      class="mt-8 rounded-lg border border-gray-200 bg-white p-4"
    >
      <div class="flex items-center justify-between text-sm text-gray-600">
        <div class="flex gap-6">
          <span>
            待審核：<strong class="font-semibold text-orange-600">{{
              pendingVendors.length
            }}</strong>
            筆
          </span>
          <span>
            活躍商家：<strong class="font-semibold text-green-600">{{
              vendors.length
            }}</strong>
            個
          </span>
        </div>
        <span class="text-xs text-gray-500">
          最後更新：{{ new Date().toLocaleString('zh-TW') }}
        </span>
      </div>
    </div>
  </div>
</template>
