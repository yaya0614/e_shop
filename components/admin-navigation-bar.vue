<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

interface MenuItem {
  label: string;
  path?: string;

  danger?: boolean;
  onClick?: () => void;
}

const router = useRouter();
const route = useRoute();

const mainMenu: MenuItem[] = [
  { label: '操作日誌', path: '/admin' },
  { label: '商家管理', path: '/admin/vendor' },
  { label: '分類管理', path: '/admin/category' },
  { label: '建立優惠券', path: '/admin/coupon' },
];

const bottomMenu: MenuItem[] = [
  {
    label: 'Logout',
    danger: true,
    onClick: () => {
      router.push('/');
    },
  },
];

const isActive = (path?: string): boolean => {
  if (!path) return false;
  if (path === '/admin') {
    return route.path === path;
  } else {
    return route.path.includes(path);
  }
};
</script>
<template>
  <aside
    class="w-64 shrink-0 bg-white border-r flex flex-col justify-between overflow-y-auto"
  >
    <nav class="px-3 py-4 space-y-1">
      <button
        v-for="item in mainMenu"
        :key="item.label"
        type="button"
        class="w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm transition text-left text-gray-600 hover:bg-green-50 hover:text-green-600"
        :class="{
          'bg-green-100 text-green-600 font-medium': isActive(item.path),
        }"
        @click="router.push(item.path!)"
      >
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <!-- Bottom menu -->
    <div class="px-3 pb-4 space-y-1">
      <button
        v-for="item in bottomMenu"
        :key="item.label"
        type="button"
        class="w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm text-left transition"
        :class="[
          item.danger
            ? 'text-red-500 hover:bg-red-50'
            : 'text-gray-600 hover:bg-green-50 hover:text-green-600',
          isActive(item.path) ? 'bg-green-100 text-green-600 font-medium' : '',
        ]"
        @click="item.onClick"
      >
        <span>{{ item.label }}</span>
      </button>
    </div>
  </aside>
</template>
