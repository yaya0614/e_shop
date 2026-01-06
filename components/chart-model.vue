<script setup lang="ts">
import { computed } from 'vue';
import type { ChartConfig } from '@/components/ui/chart';
import { VisAxis, VisGroupedBar, VisXYContainer } from '@unovis/vue';
import {
  ChartContainer,
  ChartCrosshair,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
} from '@/components/ui/chart';

export interface YearChartPoint {
  date: Date;
  value: number;
}

const props = withDefaults(
  defineProps<{
    data: YearChartPoint[];
    label?: string;
    color?: string;
  }>(),
  {
    label: '每月營收',
    color: '#2563eb',
  },
);

const chartConfig = computed<ChartConfig>(() => ({
  value: {
    label: props.label,
    color: props.color,
  },
}));

type Data = YearChartPoint;
</script>
<template>
  <div class="p-4">
    <div
      v-if="!props.data || props.data.length === 0"
      class="flex items-center justify-center min-h-[200px] text-sm text-gray-400"
    >
      尚無圖表資料
    </div>

    <ChartContainer
      v-else
      :config="chartConfig"
      class="min-h-[200px] w-full"
    >
      <VisXYContainer :data="props.data">
        <VisGroupedBar
          :x="(d: Data) => d.date"
          :y="[(d: Data) => d.value]"
          :color="[chartConfig.value.color]"
          :rounded-corners="4"
          bar-padding="0.2"
        />

        <VisAxis
          type="x"
          :x="(d: Data) => d.date"
          :tick-line="false"
          :domain-line="false"
          :grid-line="false"
          :tick-values="props.data.map((d) => d.date)"
          :tick-format="
            (d: number) =>
              new Date(d).toLocaleDateString('en-US', { month: 'short' })
          "
        />

        <VisAxis
          type="y"
          :tick-format="() => ''"
          :tick-line="false"
          :domain-line="false"
          :grid-line="true"
        />

        <ChartTooltip />

        <ChartCrosshair
          :template="
            componentToString(chartConfig, ChartTooltipContent, {
              labelFormatter(d) {
                return new Date(d).toLocaleDateString('en-US', {
                  month: 'long',
                });
              },
            })
          "
          :color="[chartConfig.value.color]"
        />
      </VisXYContainer>

      <ChartLegendContent />
    </ChartContainer>
  </div>
</template>
