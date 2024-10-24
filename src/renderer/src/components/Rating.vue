<template>
  <div class="rating">
    <i
      v-for="star in maxStars"
      :key="star"
      :class="['fa-star', star <= rating ? 'fa-solid' : 'fa-regular']"></i>
  </div>
</template>

<script setup>
  import { computed } from 'vue';

  const props = defineProps({
    rating: {
      type: Number,
      required: true,
    },
    maxStars: {
      type: Number,
      default: 5,
    },
  });

  // Tạo mảng số sao để loop
  const starArray = computed(() => Array.from({ length: props.maxStars }, (_, i) => i + 1));
</script>