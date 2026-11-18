<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  ANSWERS,
  CASES,
  GENDERS,
  NONE_CELLS,
  TOTAL_CELLS,
  cellId,
  type CaseId,
  type GenderId,
  type Strength,
} from '../data/declensions'

// One-letter answers, keyed by cell id. Empty string = not filled in yet.
const inputs = reactive<Record<string, string>>({})
for (const id of Object.keys(ANSWERS)) inputs[id] = ''

const checked = ref(false)

const score = computed(() => {
  let correct = 0
  for (const [id, answer] of Object.entries(ANSWERS)) {
    if (inputs[id]?.toLowerCase() === answer) correct++
  }
  return correct
})

function isCorrect(id: string): boolean | null {
  if (!checked.value) return null
  return inputs[id]?.toLowerCase() === ANSWERS[id]
}

// Both layouts render the same inputs, so keep a ref map per layout and
// auto-tab within the visible one (table on desktop, cards on mobile).
const tableInputEls = new Map<string, HTMLInputElement>()
const cardInputEls = new Map<string, HTMLInputElement>()

function setInputRef(map: Map<string, HTMLInputElement>, id: string, el: unknown) {
  if (el instanceof HTMLInputElement) map.set(id, el)
  else map.delete(id)
}

function activeInputEls(): Map<string, HTMLInputElement> {
  return window.matchMedia('(max-width: 640px)').matches ? cardInputEls : tableInputEls
}

// Display order, shuffled on demand. Each gender moves as one block
// (Strong + Weak, plus its Ø slot), and each case row moves as one block.
const genderOrder = ref([...GENDERS])
const caseOrder = ref([...CASES])

// Auto-tab follows the order on screen, not the canonical chart order.
const visibleCellOrder = computed(() =>
  caseOrder.value.flatMap((caseRow) =>
    genderOrder.value.flatMap((gender) =>
      (['strong', 'weak'] as const).map((strength) =>
        cellId({ caseId: caseRow.id, genderId: gender.id, strength }),
      ),
    ),
  ),
)

function shuffled<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function shuffleGenders() {
  let next = shuffled(genderOrder.value)
  while (next.every((gender, i) => gender.id === genderOrder.value[i].id)) {
    next = shuffled(genderOrder.value)
  }
  genderOrder.value = next
  pulseColumns()
}

function shuffleCases() {
  let next = shuffled(caseOrder.value)
  while (next.every((caseRow, i) => caseRow.id === caseOrder.value[i].id)) {
    next = shuffled(caseOrder.value)
  }
  caseOrder.value = next
}

// A short fade-slide pulse for column changes: table cells can't glide
// sideways the way rows can, so they fade in place instead.
let columnAnimTimeout: ReturnType<typeof setTimeout> | undefined
const columnAnimating = ref(false)

function pulseColumns() {
  columnAnimating.value = true
  window.clearTimeout(columnAnimTimeout)
  columnAnimTimeout = window.setTimeout(() => {
    columnAnimating.value = false
  }, 400)
}

function resetOrder() {
  const columnsChanged = genderOrder.value.some((gender, i) => gender.id !== GENDERS[i].id)
  genderOrder.value = [...GENDERS]
  caseOrder.value = [...CASES]
  if (columnsChanged) pulseColumns()
}

function focusNeighbour(id: string, step: 1 | -1) {
  const order = visibleCellOrder.value
  const next = order[order.indexOf(id) + step]
  if (next) activeInputEls().get(next)?.focus()
}

function onInput(id: string, value: string) {
  // Keep one letter, lowercase. Editing after a check clears the result
  // so the score is only ever for the chart as it stands.
  inputs[id] = value.toLowerCase().replace(/[^a-z]/g, '').slice(0, 1)
  checked.value = false
  // A filled cell tabs on to the next one.
  if (inputs[id]) focusNeighbour(id, 1)
}

function onKeydown(id: string, event: KeyboardEvent) {
  const target = event.target as HTMLInputElement
  // Backspace on an empty cell goes back to the previous one.
  if (event.key === 'Backspace' && target.value === '') {
    event.preventDefault()
    focusNeighbour(id, -1)
    return
  }
  // Typing over a filled cell replaces it and moves on, instead of
  // maxlength swallowing the keystroke.
  if (/^[a-z]$/i.test(event.key) && target.value !== '') {
    event.preventDefault()
    onInput(id, event.key)
  }
}

function check() {
  checked.value = true
}

function reveal() {
  for (const [id, answer] of Object.entries(ANSWERS)) inputs[id] = answer
  checked.value = false
}

function reset() {
  for (const id of Object.keys(inputs)) inputs[id] = ''
  checked.value = false
}

function noneCell(caseId: CaseId, genderId: GenderId): boolean {
  return NONE_CELLS[`${caseId}-${genderId}`] === true
}

function label(caseId: CaseId, genderId: GenderId, strength: Strength): string {
  const caseLabel = CASES.find((c) => c.id === caseId)?.label ?? caseId
  const genderLabel = GENDERS.find((g) => g.id === genderId)?.label ?? genderId
  return `${caseLabel} ${genderLabel} ${strength}`
}
</script>

<template>
  <section class="chart-wrap" :class="{ 'column-anim': columnAnimating }">
    <div class="table-scroll">
      <table class="chart">
      <thead>
        <tr>
          <th scope="col" class="corner"></th>
          <th
            v-for="gender in genderOrder"
            :key="gender.id"
            scope="col"
            :colspan="gender.hasNoneColumn ? 3 : 2"
            :class="`gender-${gender.id}`"
          >
            {{ gender.label }}
          </th>
        </tr>
        <tr>
          <th scope="col" class="corner"></th>
          <template v-for="gender in genderOrder" :key="gender.id">
            <th v-if="gender.hasNoneColumn" scope="col" :class="`gender-${gender.id}`">Ø</th>
            <th scope="col" :class="`gender-${gender.id}`">Strong</th>
            <th scope="col" :class="`gender-${gender.id}`">Weak</th>
          </template>
        </tr>
      </thead>
      <TransitionGroup name="shuffle" tag="tbody">
        <tr v-for="caseRow in caseOrder" :key="caseRow.id">
          <th scope="row">{{ caseRow.label }}</th>
          <template v-for="gender in genderOrder" :key="gender.id">
            <td v-if="gender.hasNoneColumn" :class="`gender-${gender.id} none-cell`">
              <span v-if="noneCell(caseRow.id, gender.id)" title="No declension">Ø</span>
            </td>
            <td
              v-for="strength in (['strong', 'weak'] as const)"
              :key="strength"
              :class="`gender-${gender.id}`"
            >
              <input
                :ref="(el) => setInputRef(tableInputEls, cellId({ caseId: caseRow.id, genderId: gender.id, strength }), el)"
                :value="inputs[cellId({ caseId: caseRow.id, genderId: gender.id, strength })]"
                :aria-label="label(caseRow.id, gender.id, strength)"
                :class="{
                  strong: strength === 'strong',
                  correct: isCorrect(cellId({ caseId: caseRow.id, genderId: gender.id, strength })) === true,
                  wrong: isCorrect(cellId({ caseId: caseRow.id, genderId: gender.id, strength })) === false,
                }"
                maxlength="1"
                inputmode="text"
                autocomplete="off"
                @input="
                  onInput(
                    cellId({ caseId: caseRow.id, genderId: gender.id, strength }),
                    ($event.target as HTMLInputElement).value,
                  )
                "
                @keydown="
                  onKeydown(cellId({ caseId: caseRow.id, genderId: gender.id, strength }), $event)
                "
              />
              <span
                v-if="
                  checked &&
                  isCorrect(cellId({ caseId: caseRow.id, genderId: gender.id, strength })) === false
                "
                class="correction"
              >
                {{ ANSWERS[cellId({ caseId: caseRow.id, genderId: gender.id, strength })] }}
              </span>
            </td>
          </template>
        </tr>
      </TransitionGroup>
      </table>
    </div>

    <!-- Mobile layout: one card per case, same inputs and state as the
         table above (both bind to the same answers, only one is shown). -->
    <TransitionGroup name="shuffle" tag="div" class="cards">
      <article v-for="caseRow in caseOrder" :key="caseRow.id" class="case-card">
        <h3>{{ caseRow.full }}</h3>
        <div
          v-for="gender in genderOrder"
          :key="gender.id"
          :class="`gender-block gender-${gender.id}`"
        >
          <h4>{{ gender.label }}</h4>
          <div class="cell-row">
            <span v-if="gender.hasNoneColumn" class="none-slot">
              <span v-if="noneCell(caseRow.id, gender.id)" title="No declension">Ø</span>
            </span>
            <label
              v-for="strength in (['strong', 'weak'] as const)"
              :key="strength"
              class="cell-field"
            >
              <span class="cell-name">{{ strength === 'strong' ? 'Strong' : 'Weak' }}</span>
              <input
                :ref="(el) => setInputRef(cardInputEls, cellId({ caseId: caseRow.id, genderId: gender.id, strength }), el)"
                :value="inputs[cellId({ caseId: caseRow.id, genderId: gender.id, strength })]"
                :aria-label="label(caseRow.id, gender.id, strength)"
                :class="{
                  strong: strength === 'strong',
                  correct: isCorrect(cellId({ caseId: caseRow.id, genderId: gender.id, strength })) === true,
                  wrong: isCorrect(cellId({ caseId: caseRow.id, genderId: gender.id, strength })) === false,
                }"
                maxlength="1"
                inputmode="text"
                autocomplete="off"
                @input="
                  onInput(
                    cellId({ caseId: caseRow.id, genderId: gender.id, strength }),
                    ($event.target as HTMLInputElement).value,
                  )
                "
                @keydown="
                  onKeydown(cellId({ caseId: caseRow.id, genderId: gender.id, strength }), $event)
                "
              />
              <span
                v-if="
                  checked &&
                  isCorrect(cellId({ caseId: caseRow.id, genderId: gender.id, strength })) === false
                "
                class="correction"
              >
                {{ ANSWERS[cellId({ caseId: caseRow.id, genderId: gender.id, strength })] }}
              </span>
            </label>
          </div>
        </div>
      </article>
    </TransitionGroup>

    <div class="controls">
      <button type="button" class="primary" @click="check">Check</button>
      <button type="button" @click="reveal">Reveal</button>
      <button type="button" @click="reset">Reset</button>
      <button type="button" @click="shuffleGenders">Shuffle columns</button>
      <button type="button" @click="shuffleCases">Shuffle rows</button>
      <button type="button" @click="resetOrder">Original order</button>
      <p v-if="checked" class="score" role="status">
        {{ score }} / {{ TOTAL_CELLS }} correct
      </p>
    </div>

    <p class="note">
      Ø cells are shown, not scored — how to practise them is still to be decided.
      Chart: German With Laura's
      <a href="https://germanwithlaura.com/declension/">All-In-One Declensions Chart</a>.
    </p>
  </section>
</template>

<style scoped>
.chart-wrap {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px 32px;
  text-align: center;
}

/* On narrow screens the table scrolls sideways instead of squashing,
   so the inputs stay big enough to tap. */
.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.chart {
  width: 100%;
  min-width: 620px;
  border-collapse: collapse;
  margin: 0 auto;
  font-size: 18px;
}

/* Keep the case labels visible while scrolling sideways. */
.chart thead .corner {
  position: sticky;
  left: 0;
  background: #fff;
  z-index: 2;
}

.chart tbody th {
  position: sticky;
  left: 0;
  background: #fff;
  z-index: 1;
}

.chart th,
.chart td {
  border: 1px solid #9a9a9a;
  padding: 6px 4px;
}

.chart thead th {
  padding: 8px 4px;
}

.corner {
  border: none;
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

.none-cell {
  color: #555;
  font-size: 20px;
}

.chart input,
.cards input {
  width: 44px;
  height: 44px;
  font-size: 22px;
  text-align: center;
  text-transform: lowercase;
  border: 1px solid #888;
  border-radius: 4px;
  background: #fff;
  color: #111;
}

.chart input.strong,
.cards input.strong {
  font-weight: 700;
}

.chart input.correct,
.cards input.correct {
  border-color: #2e7d32;
  background: #e6f4ea;
  outline: 2px solid #2e7d32;
}

.chart input.wrong,
.cards input.wrong {
  border-color: #c62828;
  background: #fce8e6;
  outline: 2px solid #c62828;
}

/* Card layout is mobile-only; the table is the desktop layout. */
.cards {
  display: none;
}

/* Reordering animation. Rows (and mobile cards) glide to their new spots
   via the TransitionGroup FLIP move; columns fade in place, since table
   cells can't glide sideways. */
.shuffle-move {
  transition: transform 0.45s ease;
}

/* Opacity only — no translate: the table sits in a horizontal-scroll
   container, and overflow-x: auto forces overflow-y to auto too, so even
   a 4px slide pushed the bottom row past the container and flashed a
   vertical scrollbar for the length of the animation. */
@keyframes column-fade {
  from {
    opacity: 0.35;
  }
  to {
    opacity: 1;
  }
}

.column-anim .chart th,
.column-anim .chart td,
.column-anim .gender-block {
  animation: column-fade 0.4s ease;
}

@media (prefers-reduced-motion: reduce) {
  .shuffle-move {
    transition: none;
  }

  .column-anim .chart th,
  .column-anim .chart td,
  .column-anim .gender-block {
    animation: none;
  }
}

.correction {
  display: block;
  font-size: 13px;
  color: #c62828;
  min-height: 16px;
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

.score {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.note {
  font-size: 14px;
  color: #555;
  margin-top: 20px;
}

@media (max-width: 640px) {
  .chart-wrap {
    padding: 0 8px 24px;
  }

  /* Swap the table for the stacked cards. */
  .table-scroll {
    display: none;
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .case-card {
    border: 1px solid #9a9a9a;
    border-radius: 10px;
    padding: 14px;
    text-align: left;
    background: #fff;
  }

  .case-card h3 {
    margin: 0 0 12px;
    font-size: 20px;
  }

  .gender-block {
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 10px;
  }

  .gender-block:last-child {
    margin-bottom: 0;
  }

  .gender-block h4 {
    margin: 0 0 8px;
    font-size: 16px;
  }

  .cell-row {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }

  .none-slot {
    width: 44px;
    padding-top: 26px;
    text-align: center;
    font-size: 20px;
    color: #555;
  }

  .cell-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .cell-name {
    font-size: 14px;
    color: #111;
  }

  .cards input {
    width: 48px;
    height: 48px;
  }

  .controls button {
    flex: 1 1 auto;
    padding: 10px 12px;
  }
}
</style>
