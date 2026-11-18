<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import DeclensionChart from './components/DeclensionChart.vue'
import FlashcardsView from './components/FlashcardsView.vue'

// Two views, no router dependency: a tiny history-API switch. The chart
// stays mounted (v-show) so anything filled in survives a round trip to
// flashcards; the flashcard view mounts fresh each time, so it shuffles a
// new deck on every entry.
const isFlashcards = ref(window.location.pathname === '/flashcards')

function goFlashcards() {
  window.history.pushState({}, '', '/flashcards')
  isFlashcards.value = true
}

function goChart() {
  window.history.pushState({}, '', '/')
  isFlashcards.value = false
}

function onPopState() {
  isFlashcards.value = window.location.pathname === '/flashcards'
}

onMounted(() => window.addEventListener('popstate', onPopState))
onUnmounted(() => window.removeEventListener('popstate', onPopState))
</script>

<template>
  <main>
    <FlashcardsView v-if="isFlashcards" @back="goChart" />
    <div v-show="!isFlashcards">
      <h1>German Declensions</h1>
      <p>Fill in the German declension endings, then check your chart.</p>
      <div class="mode-switch">
        <button type="button" @click="goFlashcards">Flashcard mode</button>
      </div>
      <DeclensionChart />
    </div>
  </main>
</template>

<style scoped>
.mode-switch {
  text-align: center;
  margin-bottom: 16px;
}

.mode-switch button {
  font-size: 16px;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 6px;
  border: 1px solid #555;
  background: #fff;
  color: #111;
  cursor: pointer;
}

.mode-switch button:hover {
  background: #e8e8e8;
}

.mode-switch button:focus-visible {
  outline: 2px solid #111;
  outline-offset: 2px;
}
</style>
