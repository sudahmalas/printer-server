<script setup lang="ts">
import { cn } from './cn';

interface Props {
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <div :class="cn('bg-white/70 backdrop-blur-lg border border-slate-200/50 shadow-xl shadow-slate-100/40 rounded-2xl p-6 transition-all duration-300', props.class)">
    <slot />
  </div>
</template>
