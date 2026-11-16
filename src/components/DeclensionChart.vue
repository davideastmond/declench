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

.chart {
  width: 100%;
  border-collapse: collapse;
  margin: 0 auto;
  font-size: 18px;
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

.chart input {
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

.chart input.strong {
  font-weight: 700;
}

.chart input.correct {
  border-color: #2e7d32;
  background: #e6f4ea;
  outline: 2px solid #2e7d32;
}

.chart input.wrong {
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
  padding: 8px 20px;
  border-radius: 6px;
  border: 1px solid #888;
  background: #fff;
  cursor: pointer;
}

.controls button.primary {
  background: #1a73e8;
  border-color: #1a73e8;
  color: #fff;
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
</style>
