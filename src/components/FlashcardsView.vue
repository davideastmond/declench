<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import {
  ANSWERS,
  CASES,
  GENDERS,
  NONE_CELLS,
  cellId,
  type CaseId,
  type GenderId,
  type Strength,
} from '../data/declensions';

const emit = defineEmits<{
  back: []
}>()

interface Card {
  caseId: CaseId
  genderId: GenderId
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// One card per case/gender combo — 16 in total — shuffled on entry.
function buildDeck(): Card[] {
  return shuffled(
    CASES.flatMap((caseRow) =>
      GENDERS.map((gender) => ({ caseId: caseRow.id, genderId: gender.id })),
    ),
  )
}

const deck = ref<Card[]>(buildDeck())
const index = ref(0)
const strong = ref('')
const weak = ref('')
const checked = ref(false)
// One result per card: true only when both endings are right.
const results = ref<boolean[]>([])
const showSummary = ref(false)

const card = computed(() => deck.value[index.value])
const caseRow = computed(() => CASES.find((c) => c.id === card.value.caseId)!)
const gender = computed(() => GENDERS.find((g) => g.id === card.value.genderId)!)
// The Ø slot is shown as a given on these cards, never asked for.
const hasNone = computed(() => NONE_CELLS[`${card.value.caseId}-${card.value.genderId}`] === true)
const bothFilled = computed(() => strong.value !== '' && weak.value !== '')
const isLastCard = computed(() => index.value === deck.value.length - 1)

const strongInput = ref<HTMLInputElement | null>(null)
const weakInput = ref<HTMLInputElement | null>(null)
const nextButton = ref<HTMLButtonElement | null>(null)

function answer(card: Card, strength: Strength): string {
  return ANSWERS[cellId({ caseId: card.caseId, genderId: card.genderId, strength })]
}

function caseLabel(caseId: CaseId): string {
  return CASES.find((c) => c.id === caseId)?.full ?? caseId
}

function genderLabel(genderId: GenderId): string {
  return GENDERS.find((g) => g.id === genderId)?.label ?? genderId
}

function isCorrect(strength: Strength): boolean | null {
  if (!checked.value) return null
  const value = strength === 'strong' ? strong.value : weak.value
  return value.toLowerCase() === answer(card.value, strength)
}

function clean(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, '').slice(0, 1)
}

function onStrongInput(value: string) {
  strong.value = clean(value)
  // A filled Strong cell tabs on to Weak, like the chart's auto-tab.
  if (strong.value) weakInput.value?.focus()
}

function onWeakInput(value: string) {
  weak.value = clean(value)
}

function onKeydown(strength: Strength, event: KeyboardEvent) {
  const target = event.target as HTMLInputElement
  // Backspace on an empty Weak cell goes back to Strong.
  if (event.key === 'Backspace' && target.value === '' && strength === 'weak') {
    event.preventDefault()
    strongInput.value?.focus()
    return
  }
  // Enter checks once both endings are in.
  if (event.key === 'Enter' && bothFilled.value && !checked.value) {
    event.preventDefault()
    check()
    return
  }
  // Typing over a filled cell replaces it and moves on, instead of
  // maxlength swallowing the keystroke.
  if (/^[a-z]$/i.test(event.key) && target.value !== '') {
    event.preventDefault()
    if (strength === 'strong') onStrongInput(event.key)
    else onWeakInput(event.key)
  }
}

function check() {
  if (!bothFilled.value) return
  checked.value = true
  results.value[index.value] = isCorrect('strong') === true && isCorrect('weak') === true
  // A correct card moves the focus to Next, so one Enter press advances.
  // A wrong card leaves the focus where it is, so the correction can be
  // read before moving on. The Next button only renders once checked, so
  // wait a tick for it to exist.
  if (results.value[index.value]) {
    nextTick(() => nextButton.value?.focus())
  }
}

function next() {
  if (isLastCard.value) {
    showSummary.value = true
    return
  }
  index.value++
  strong.value = ''
  weak.value = ''
  checked.value = false
  strongInput.value?.focus()
}

const score = computed(() => results.value.filter(Boolean).length)
const missed = computed(() => deck.value.filter((_, i) => results.value[i] === false))

function reshuffle() {
  deck.value = buildDeck()
  index.value = 0
  results.value = []
  showSummary.value = false
  strong.value = ''
  weak.value = ''
  checked.value = false
  strongInput.value?.focus()
}

onMounted(() => {
  strongInput.value?.focus()
})
</script>

<template>
  <section class="flashcards">
    <div v-if="!showSummary" class="card-wrap">
      <p class="progress">Card {{ index + 1 }} of {{ deck.length }}</p>
      <article class="flashcard" :class="`gender-${gender.id}`">
        <h2>{{ caseRow.full }} · {{ gender.label }}</h2>
        <p v-if="hasNone" class="none-note">Ø — no declension</p>
        <div class="fields">
          <label class="cell-field">
            <span class="cell-name">Strong</span>
            <input ref="strongInput" :value="strong" aria-label="Strong ending" :class="{
              correct: isCorrect('strong') === true,
              wrong: isCorrect('strong') === false,
            }" maxlength="1" inputmode="text" autocomplete="off"
              @input="onStrongInput(($event.target as HTMLInputElement).value)"
              @keydown="onKeydown('strong', $event)" />
            <span v-if="checked && isCorrect('strong') === false" class="correction">
              {{ answer(card, 'strong') }}
            </span>
          </label>
          <label class="cell-field">
            <span class="cell-name">Weak</span>
            <input ref="weakInput" :value="weak" aria-label="Weak ending" :class="{
              correct: isCorrect('weak') === true,
              wrong: isCorrect('weak') === false,
            }" maxlength="1" inputmode="text" autocomplete="off"
              @input="onWeakInput(($event.target as HTMLInputElement).value)" @keydown="onKeydown('weak', $event)" />
            <span v-if="checked && isCorrect('weak') === false" class="correction">
              {{ answer(card, 'weak') }}
            </span>
          </label>
        </div>
        <p v-if="checked" class="feedback" role="status">
          {{ results[index] ? 'Correct!' : 'Not quite — the right endings are shown above.' }}
        </p>
        <div class="controls">
          <button v-if="!checked" type="button" class="primary" :disabled="!bothFilled" @click="check">
            Check
          </button>
          <button v-else ref="nextButton" type="button" class="primary" @click="next">
            {{ isLastCard ? 'See score' : 'Next card' }}
          </button>
          <button type="button" @click="emit('back')">Back to chart</button>
        </div>
      </article>
    </div>

    <div v-else class="summary">
      <h2>Deck done!</h2>
      <p class="score">{{ score }} / {{ deck.length }} cards correct</p>
      <div v-if="missed.length" class="missed">
        <h3>To review</h3>
        <ul>
          <li v-for="missedCard in missed" :key="`${missedCard.caseId}-${missedCard.genderId}`">
            {{ caseLabel(missedCard.caseId) }} {{ genderLabel(missedCard.genderId) }} — Strong
            {{ answer(missedCard, 'strong') }}, Weak {{ answer(missedCard, 'weak') }}
          </li>
        </ul>
      </div>
      <div class="controls">
        <button type="button" class="primary" @click="reshuffle">Reshuffle</button>
        <button type="button" @click="emit('back')">Back to chart</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
h2 {
  color: black;
}

.flashcards {
  max-width: 640px;
  margin: 0 auto;
  padding: 0 16px 32px;
  text-align: center;
}

.progress {
  font-size: 16px;
  color: #555;
  margin: 0 0 12px;
}

.flashcard {
  border: 1px solid #9a9a9a;
  border-radius: 10px;
  padding: 24px 20px;
  text-align: center;
}

.flashcard h2 {
  margin: 0 0 4px;
  font-size: 24px;
}

.none-note {
  margin: 0 0 12px;
  font-size: 18px;
  color: #555;
}

.gender-masc {
  background: #eec3cf;
}

.gender-fem {
  background: #b7d3e6;
}

.gender-neut {
  background: #c2dcc9;
}

.gender-plural {
  background: #d3d6d3;
}

.fields {
  display: flex;
  gap: 32px;
  justify-content: center;
  align-items: flex-start;
  margin-top: 16px;
}

.cell-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.cell-name {
  font-size: 16px;
  color: #111;
}

.flashcards input {
  width: 48px;
  height: 48px;
  font-size: 22px;
  text-align: center;
  text-transform: lowercase;
  border: 1px solid #888;
  border-radius: 4px;
  background: #fff;
  color: #111;
}

.flashcards input.correct {
  border-color: #2e7d32;
  background: #e6f4ea;
  outline: 2px solid #2e7d32;
}

.flashcards input.wrong {
  border-color: #c62828;
  background: #fce8e6;
  outline: 2px solid #c62828;
}

.correction {
  display: block;
  font-size: 13px;
  color: #c62828;
  min-height: 16px;
}

.feedback {
  font-size: 18px;
  font-weight: 700;
  margin: 16px 0 0;
}

.controls {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 20px;
}

.controls button {
  font-size: 16px;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 6px;
  border: 1px solid #555;
  background: #fff;
  color: #111;
  cursor: pointer;
}

.controls button:hover {
  background: #e8e8e8;
}

.controls button:focus-visible {
  outline: 2px solid #111;
  outline-offset: 2px;
}

.controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.controls button.primary {
  background: #1557b0;
  border-color: #1557b0;
  color: #fff;
}

.controls button.primary:hover {
  background: #0f4a94;
}

.controls button.primary:focus-visible {
  outline-color: #1557b0;
}

.summary h2 {
  font-size: 24px;
  margin: 0 0 8px;
}

.score {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 16px;
}

.missed {
  text-align: left;
  border: 1px solid #9a9a9a;
  border-radius: 10px;
  padding: 14px 20px;
  background: #fff;
  margin-bottom: 8px;
}

.missed h3 {
  margin: 0 0 8px;
  font-size: 18px;
}

.missed ul {
  margin: 0;
  padding-left: 20px;
}

.missed li {
  font-size: 16px;
  margin-bottom: 4px;
}
</style>
