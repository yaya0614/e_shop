<script setup lang="ts">
import { toast } from 'vue-sonner';
import { EmployeeRole } from '~/prisma/generated/enums';

definePageMeta({
  layout: 'vendor-bar',
});

interface Employee {
  id: string;
  userId: string;
  name: string;
  email: string;
  address: string;
  role: EmployeeRole;
}

interface ApiError {
  statusCode?: number;
  message?: string;
  data?: { message?: string };
}

const {
  params: { vendorId },
} = useRoute('vendor-vendorId');

const inviteEmail = ref('');
const inviteRole = ref<EmployeeRole>(EmployeeRole.CLERK);
const isProcessing = ref(false);

const mapEmployeeErrorToUserMessage = (
  e: ApiError,
  action: string,
): { title: string; description: string } => {
  let title = `${action}失敗`;
  let description = '無法連線到伺服器，請檢查您的網路。';

  if (e.statusCode) {
    title = `錯誤碼 ${e.statusCode}`;
    switch (e.statusCode) {
      case 401:
        description = '您尚未登入或登入已過期，請重新登入。';
        break;
      case 403:
        description = '權限不足：您必須是 OWNER 或 ADMIN 才能執行此操作。';
        break;
      case 404:
        description = '找不到指定的對象（使用者或員工）。';
        break;
      case 409:
        description = '該使用者已經是此商家的員工。';
        break;
      default:
        description =
          e.data?.message || e.message || '伺服器返回一個未知的錯誤。';
        break;
    }
  }
  return { title, description };
};

const {
  data: employees,
  refresh,
  pending,
} = await useFetch<Employee[]>(`/api/vendor/${vendorId}/employee`, {
  method: 'GET',
  credentials: 'include',
  lazy: true,
});

const handleInvite = async () => {
  if (!inviteEmail.value) return;
  isProcessing.value = true;

  try {
    await $fetch(`/api/vendor/${vendorId}/employee`, {
      method: 'POST',
      body: { email: inviteEmail.value, role: inviteRole.value },
      credentials: 'include',
    });

    toast.success('邀請成功', {
      description: `已將 ${inviteEmail.value} 加入團隊`,
    });
    inviteEmail.value = '';
    await refresh();
  } catch (e: unknown) {
    const err = e as ApiError;
    const { title, description } = mapEmployeeErrorToUserMessage(
      err,
      '邀請員工',
    );
    toast.error(title, { description });
  } finally {
    isProcessing.value = false;
  }
};

const handleUpdateRole = async (employeeId: string, newRole: EmployeeRole) => {
  try {
    await $fetch(`/api/vendor/${vendorId}/employee`, {
      method: 'PUT',
      body: { id: employeeId, role: newRole },
      credentials: 'include',
    });

    toast.success('職位更新成功');
    await refresh();
  } catch (e: unknown) {
    const err = e as ApiError;
    const { title, description } = mapEmployeeErrorToUserMessage(
      err,
      '更新職位',
    );
    toast.error(title, { description });
  }
};

const handleDelete = async (employeeId: string, name: string) => {
  if (!confirm(`確定要移除員工 ${name} 嗎？`)) return;

  try {
    await $fetch(`/api/vendor/${vendorId}/employee`, {
      method: 'DELETE',
      body: { id: employeeId },
      credentials: 'include',
    });

    toast.success('移除成功', { description: `已將 ${name} 從員工清單移除` });
    await refresh();
  } catch (e: unknown) {
    const err = e as ApiError;
    const { title, description } = mapEmployeeErrorToUserMessage(
      err,
      '移除員工',
    );
    toast.error(title, { description });
  }
};
</script>

<template>
  <div class="flex flex-1 flex-col px-8 py-8 h-screen w-screen">
    <h1 class="font-semibold mb-6 text-2xl">員工管理</h1>
    <div class="max-w-6xl w-full mx-auto">
      <div class="bg-white p-6 rounded-lg border shadow-sm mb-8">
        <h2 class="text-lg font-medium mb-4 text-gray-700">邀請團隊成員</h2>
        <div class="flex flex-col sm:flex-row gap-4 items-end">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-600 mb-1"
              >使用者 Email</label
            >
            <input
              v-model="inviteEmail"
              type="email"
              placeholder="example@mail.com"
              class="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 outline-none"
            />
          </div>
          <div class="w-44">
            <label class="block text-sm font-medium text-gray-600 mb-1"
              >職位設定</label
            >
            <select
              v-model="inviteRole"
              class="w-full border rounded-md px-3 py-2 text-sm bg-white outline-none"
            >
              <option :value="EmployeeRole.CLERK">店員 (CLERK)</option>
              <option :value="EmployeeRole.ADMIN">管理員 (ADMIN)</option>
            </select>
          </div>
          <button
            :disabled="isProcessing || !inviteEmail"
            class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            @click="handleInvite"
          >
            {{ isProcessing ? '處理中...' : '送出邀請' }}
          </button>
        </div>
      </div>

      <div class="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600">
                姓名
              </th>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600">
                Email / 地址
              </th>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600">
                職位
              </th>
              <th
                class="px-6 py-4 text-sm font-semibold text-gray-600 text-right"
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-if="pending"
              class="animate-pulse"
            >
              <td
                colspan="4"
                class="px-6 py-8 text-center text-gray-400"
              >
                資料載入中...
              </td>
            </tr>
            <tr v-else-if="!employees || employees.length === 0">
              <td
                colspan="4"
                class="px-6 py-8 text-center text-gray-400"
              >
                目前尚無員工資料
              </td>
            </tr>
            <tr
              v-for="emp in employees"
              :key="emp.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="font-medium text-gray-800">{{ emp.name }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-500">{{ emp.email }}</div>
                <div class="text-xs text-gray-400">{{ emp.address }}</div>
              </td>
              <td class="px-6 py-4">
                <span
                  v-if="emp.role === EmployeeRole.OWNER"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700"
                >
                  OWNER
                </span>
                <select
                  v-else
                  :value="emp.role"
                  class="border rounded px-2 py-1 text-sm bg-transparent focus:ring-1 focus:ring-green-500 outline-none"
                  @change="
                    (e) =>
                      handleUpdateRole(
                        emp.id,
                        (e.target as HTMLSelectElement).value as EmployeeRole,
                      )
                  "
                >
                  <option :value="EmployeeRole.ADMIN">ADMIN</option>
                  <option :value="EmployeeRole.CLERK">CLERK</option>
                </select>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  v-if="emp.role !== EmployeeRole.OWNER"
                  class="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                  @click="handleDelete(emp.id, emp.name)"
                >
                  移除成員
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
