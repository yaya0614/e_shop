<script setup lang="ts">
import { useUser } from '~/lib/useUser'; // 確保路徑正確

const router = useRouter();
const { userProfile } = useUser();
const isAdmin = computed(() => userProfile.value.role === 'ADMIN');

// 判斷是否登入：檢查 id 是否不為空，或者 role 是否不是 GUEST
const isLoggedIn = computed(
  () => userProfile.value.id !== '' && userProfile.value.role !== 'GUEST',
);

function go(path: string) {
  router.push(path);
}

// 登出功能
async function logout() {
  const token = useCookie('auth.token');
  token.value = null; // 清除前端 Cookie

  // 重置使用者狀態為初始值 (GUEST)
  userProfile.value = {
    id: '',
    name: null,
    email: '',
    address: null,
    role: 'GUEST',
  };

  router.push('/');
}
</script>

<template>
  <div class="flex flex-row sticky top-0 z-10 bg-gray-300 py-2 w-full h-fit">
    <div class="ml-10">
      <Button
        class="text-3xl"
        variant="link"
        @click="go('/')"
        >閱森書店</Button
      >
    </div>

    <div class="flex ml-auto mr-10 space-x-2">
      <template v-if="!isLoggedIn">
        <Button
          variant="link"
          @click="go('/auth/login')"
          >登入</Button
        >
        <Button
          variant="link"
          @click="go('/auth/register')"
          >註冊</Button
        >
      </template>

      <template v-else>
        <span class="flex items-center text-sm text-gray-600">
          你好, {{ userProfile.name || userProfile.email }}
        </span>
        <Button
          variant="link"
          @click="go('/profile/overview')"
        >
          會員中心
        </Button>
        <Button
          variant="link"
          @click="logout"
        >
          登出
        </Button>
      </template>

      <Button
        variant="link"
        @click="go('/coupon')"
      >
        折價券
      </Button>
      <Button
        variant="link"
        @click="go('/shop')"
      >
        購物中心
      </Button>
      <Button
        v-if="isAdmin"
        variant="link"
        @click="go('/admin')"
      >
        管理中心
      </Button>
    </div>
  </div>
</template>
