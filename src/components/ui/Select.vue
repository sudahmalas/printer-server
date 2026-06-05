<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { ChevronDown } from 'lucide-vue-next';
import { cn } from './cn';

interface Option {
  label: string;
  value: string;
}

const props = defineProps<{
  modelValue: string;
  options: Option[];
  placeholder?: string;
  class?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const toggleOpen = () => isOpen.value = !isOpen.value;
const selectOption = (val: string) => {
  emit('update:modelValue', val);
  isOpen.value = false;
};

const closeDropdown = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => document.addEventListener('click', closeDropdown));
onUnmounted(() => document.removeEventListener('click', closeDropdown));

const displayValue = computed(() => {
  const opt = props.options.find(o => o.value === props.modelValue);
  return opt ? opt.label : props.placeholder || 'Select...';
});
</script>

<template>
  <div class="relative w-full" ref="dropdownRef">
    <div 
      @click="toggleOpen"
      :class="cn('w-full text-sm border-slate-200 border rounded-lg pl-9 pr-10 py-2.5 outline-none transition-all cursor-pointer flex items-center justify-between select-none', 
                 isOpen ? 'bg-white ring-2 ring-emerald-500/20 border-emerald-500' : 'bg-slate-50/50 hover:bg-slate-100/50', 
                 !modelValue ? 'text-slate-500' : 'text-slate-900', props.class)"
    >
      <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <slot name="icon"></slot>
      </div>
      <span class="truncate">{{ displayValue }}</span>
      <ChevronDown class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform" :class="isOpen ? 'rotate-180' : ''" />
    </div>

    <!-- Dropdown Menu -->
    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div v-if="isOpen" class="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-slate-100 py-1.5 max-h-60 overflow-auto">
        <div v-if="options.length === 0" class="px-4 py-2 text-sm text-slate-500 italic">No options available</div>
        <div 
          v-for="opt in options" 
          :key="opt.value"
          @click="selectOption(opt.value)"
          class="px-4 py-2.5 text-sm cursor-pointer transition-colors"
          :class="modelValue === opt.value ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-600'"
        >
          {{ opt.label }}
        </div>
      </div>
    </transition>
  </div>
</template>
