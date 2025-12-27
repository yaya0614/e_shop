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

const { data: categoriesData } = await useFetch<{ categories: Category[] }>(
  '/api/category',
  {
    method: 'GET',
  },
);

const categories = computed(() => categoriesData.value?.categories || []);
</script>

<template>
  <div class="flex-col h-full max-h-full flex">
    <headerBar />
    <div class="flex flex-row justify-between w-full mt-4">
      <p class="text-muted-foreground text-4xl leading-tight ml-10 flex-1"></p>
      <ButtonGroup class="mr-10 flex-1 text-3xl">
        <Input placeholder="Search..." />
        <Button
          variant="outline"
          aria-label="Search"
        >
          <SearchIcon />
        </Button>
      </ButtonGroup>
    </div>
    <div class="flex justify-center-safe mt-2 mb-2">
      <NavigationMenu
        :viewport="false"
        class="w-full"
      >
        <div class="z-4">
          <NavigationMenuList class="gap-12">
            <div
              v-for="category in categories"
              :key="category.id"
            >
              <NavigationMenuItem>
                <NavigationMenuTrigger>
                  {{ category.name }}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul
                    class="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]"
                  >
                    <li
                      v-for="subCategory in category.subCategories"
                      :key="subCategory.id"
                    >
                      <NavigationMenuLink as-child>
                        <div class="text-sm font-medium leading-none">
                          {{ subCategory.name }}
                        </div>
                      </NavigationMenuLink>
                    </li>
                    <li v-if="category.subCategories.length === 0">
                      <div
                        class="block select-none space-y-1 rounded-md p-3 leading-none text-sm text-muted-foreground"
                      >
                        暫無子分類
                      </div>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </div>
          </NavigationMenuList>
        </div>
      </NavigationMenu>
    </div>
    <div class="flex-1 flex w-full overflow-y-scroll">
      <slot />
    </div>
    <slot name="footer" />
  </div>
</template>
