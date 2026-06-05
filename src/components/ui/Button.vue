<script setup lang="ts">
import { computed } from 'vue';
import { cva } from 'class-variance-authority';
import { cn } from './cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg',
        secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/50',
        destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg',
        outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600',
        ghost: 'hover:bg-slate-100 text-slate-600',
        glass: 'bg-white/40 backdrop-blur-md border border-white/40 text-slate-700 hover:bg-white/60 shadow-sm',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface Props {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'glass';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  class?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
});

const classes = computed(() => cn(buttonVariants({ variant: props.variant, size: props.size }), props.class));
</script>

<template>
  <button :class="classes" :disabled="disabled">
    <slot />
  </button>
</template>
