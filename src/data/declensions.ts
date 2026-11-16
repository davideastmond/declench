// Answers from German With Laura's All-In-One Declensions Chart
// (https://germanwithlaura.com/declension/).
// Rows are cases, columns are genders, each split into Strong and Weak.
// The "no declension" (Ø) cells are Masc. Nom., Neut. Nom. and Neut. Acc.
// They are shown in the chart, not scored — how to practise them is still open.

export type CaseId = 'nom' | 'acc' | 'dat' | 'gen'
export type GenderId = 'masc' | 'fem' | 'neut' | 'plural'
export type Strength = 'strong' | 'weak'

export interface CellKey {
  caseId: CaseId
  genderId: GenderId
  strength: Strength
}

export const CASES: { id: CaseId; label: string }[] = [
  { id: 'nom', label: 'Nom.' },
  { id: 'acc', label: 'Acc.' },
  { id: 'dat', label: 'Dat.' },
  { id: 'gen', label: 'Gen.' },
]

export const GENDERS: { id: GenderId; label: string; hasNoneColumn: boolean }[] = [
  { id: 'masc', label: 'Masc.', hasNoneColumn: true },
  { id: 'fem', label: 'Fem.', hasNoneColumn: false },
  { id: 'neut', label: 'Neut.', hasNoneColumn: true },
  { id: 'plural', label: 'Plural', hasNoneColumn: false },
]

// The Ø column: only these three cells take no declension.
export const NONE_CELLS: Record<string, boolean> = {
  'nom-masc': true,
  'nom-neut': true,
  'acc-neut': true,
}

export function cellId(cell: CellKey): string {
  return `${cell.caseId}-${cell.genderId}-${cell.strength}`
}

// Strong and weak endings, keyed by `${case}-${gender}-${strength}`.
export const ANSWERS: Record<string, string> = {
  // Nominative
  'nom-masc-strong': 'r',
  'nom-masc-weak': 'e',
  'nom-fem-strong': 'e',
  'nom-fem-weak': 'e',
  'nom-neut-strong': 's',
  'nom-neut-weak': 'e',
  'nom-plural-strong': 'e',
  'nom-plural-weak': 'n',
  // Accusative
  'acc-masc-strong': 'n',
  'acc-masc-weak': 'n',
  'acc-fem-strong': 'e',
  'acc-fem-weak': 'e',
  'acc-neut-strong': 's',
  'acc-neut-weak': 'e',
  'acc-plural-strong': 'e',
  'acc-plural-weak': 'n',
  // Dative
  'dat-masc-strong': 'm',
  'dat-masc-weak': 'n',
  'dat-fem-strong': 'r',
  'dat-fem-weak': 'n',
  'dat-neut-strong': 'm',
  'dat-neut-weak': 'n',
  'dat-plural-strong': 'n',
  'dat-plural-weak': 'n',
  // Genitive
  'gen-masc-strong': 's',
  'gen-masc-weak': 'n',
  'gen-fem-strong': 'r',
  'gen-fem-weak': 'n',
  'gen-neut-strong': 's',
  'gen-neut-weak': 'n',
  'gen-plural-strong': 'r',
  'gen-plural-weak': 'n',
}

export const TOTAL_CELLS = Object.keys(ANSWERS).length // 32
