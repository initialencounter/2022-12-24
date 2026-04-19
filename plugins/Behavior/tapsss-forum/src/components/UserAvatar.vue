<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = withDefaults(defineProps<{
  user?: {
    uid?: string | null;
    id?: number | null;
    avatar?: string | null;
    [key: string]: any;
  } | null;
  size?: number | string;
  className?: string;
}>(), {
  size: 50,
  className: '',
});

const router = useRouter();

const avatarUrl = computed(() => {
  return props.user?.avatar || '/Z7.png';
});

const style = computed(() => {
  const s = typeof props.size === 'number' ? `${props.size}px` : props.size;
  return {
    width: s,
    height: s,
    borderRadius: '50%',
    objectFit: 'cover' as const,
    cursor: 'pointer',
  };
});

function goToUser() {
  const uid = props.user?.uid || props.user?.id;
  if (!uid) return;
  const routeData = router.resolve(`/user/${uid}`);
  window.open(routeData.href, '_blank');
}
</script>

<template>
  <img
    :class="className"
    :src="avatarUrl"
    :style="style"
    alt="avatar"
    @click.stop="goToUser"
  />
</template>
