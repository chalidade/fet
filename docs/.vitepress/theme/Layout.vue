<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import AuthButton from "./components/AuthButton.vue";
import StageBanner from "./components/StageBanner.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #nav-bar-content-after>
      <ClientOnly><AuthButton /></ClientOnly>
    </template>
    <template #doc-before>
      <ClientOnly><StageBanner /></ClientOnly>
    </template>
  </Layout>
</template>
