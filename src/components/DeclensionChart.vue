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

function onInput(id: string, value: string) {
  // Keep one letter, lowercase. Editing after a check clears the result
  // so the score is only ever for the chart as it stands.
  inputs[id] = value.toLowerCase().replace(/[^a-z]/g, '').slice(0, 1)
  checked.value = false
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
  <section class="chart-wrap">
    <div class="table-scroll">
      <table class="chart">
      <thead>
        <tr>
          <th scope="col" class="corner"></th>
          <th
            v-for="gender in GENDERS"
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
          <template v-for="gender in GENDERS" :key="gender.id">
            <th v-if="gender.hasNoneColumn" scope="col" :class="`gender-${gender.id}`">Ø</th>
            <th scope="col" :class="`gender-${gender.id}`">Strong</th>
            <th scope="col" :class="`gender-${gender.id}`">Weak</th>
          </template>
        </tr>
      </thead>
      <tbody>
        <tr v-for="caseRow in CASES" :key="caseRow.id">
          <th scope="row">{{ caseRow.label }}</th>
          <template v-for="gender in GENDERS" :key="gender.id">
            <td v-if="gender.hasNoneColumn" :class="`gender-${gender.id} none-cell`">
              <span v-if="noneCell(caseRow.id, gender.id)" title="No declension">Ø</span>
            </td>
            <td
              v-for="strength in (['strong', 'weak'] as const)"
              :key="strength"
              :class="`gender-${gender.id}`"
            >
              <input
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
        </tbody>
      </table>
    </div>

    <!-- Mobile layout: one card per case, same inputs and state as the
         table above (both bind to the same answers, only one is shown). -->
    <div class="cards">
      <article v-for="caseRow in CASES" :key="caseRow.id" class="case-card">
        <h3>{{ caseRow.full }}</h3>
        <div
          v-for="gender in GENDERS"
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
    </div>

    <div class="controls">
      <button type="button" class="primary" @click="check">Check</button>
      <button type="button" @click="reveal">Reveal</button>
      <button type="button" @click="reset">Reset</button>
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
