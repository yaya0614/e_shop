<script setup lang="ts">
import headerBar from '~/components/header-bar.vue';
import { SearchIcon } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Input } from '@/components/ui/input';

interface SubCategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  subCategories: SubCategory[];
}

const router = useRouter();

const { data: categoriesData } = await useFetch<{ categories: Category[] }>(
  '/api/category',
  {
    method: 'GET',
  },
);
const search = ref('');

const searchProduct = (text: string) => {
  search.value = text;

  if (text.trim().length === 0) {
    router.push({
      path: '/',
    });
    return;
  }

  router.push({
    path: '/',
    query: {
      search: text,
    },
  });
};

const categories = computed(() => categoriesData.value?.categories || []);
</script>

<template>
  <div class="flex-col h-full max-h-full flex">
    <headerBar />
    <div class="flex flex-row justify-between w-full mt-4">
      <p class="text-muted-foreground text-4xl leading-tight ml-10 flex-1"></p>
      <ButtonGroup class="mr-10 flex-1 text-3xl">
        <Input
          v-model="search"
          placeholder="Search..."
          @keydown.enter="searchProduct(search)"
        />
        <Button
          variant="outline"
          aria-label="Search"
          @click="searchProduct(search)"
        >
          <SearchIcon />
        </Button>
      </ButtonGroup>
    </div>
    <div class="flex justify-center-safe mt-2 mb-2">
      <NavigationMenu
        :viewport="false"
        class="w-full flex flex-wrap"
      >
        <NavigationMenuList class="gap-8">
          <NavigationMenuItem
            v-for="category in categories"
            :key="category.id"
          >
            <NavigationMenuTrigger>
              {{ category.name }}
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="w-full gap-3 p-4 min-w-32">
                <div
                  v-for="subCategory in category.subCategories"
                  :key="subCategory.id"
                  class="w-full"
                >
                  <Button
                    variant="ghost"
                    class="text-sm font-medium leading-none w-full"
                    @click="searchProduct(subCategory.name)"
                  >
                    {{ subCategory.name }}
                  </Button>
                </div>
                <li v-if="category.subCategories.length === 0">
                  <div
                    class="select-none space-y-1 rounded-md p-3 leading-none text-sm text-muted-foreground"
                  >
                    暫無子分類
                  </div>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
    <div class="flex-1 flex w-full overflow-y-scroll">
      <slot />
    </div>
    <slot name="footer" />
  </div>
</template>
