// Intermediate milestones toward the main financial-independence target,
// combining two systems the user asked for: percentages of the target
// (10/25/50/75/100%) and round absolute amounts (first million, second
// million, ...). Together they keep checkpoints reasonably dense across the
// whole journey without inventing artificial evenly-spaced markers - a
// modest target sees mostly percentage steps, a large one gets extra
// million-sized steps in between.
const PERCENT_STEPS = [0.1, 0.25, 0.5, 0.75, 1]

const MILLION_ORDINALS = [
  'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי', 'שמיני', 'תשיעי', 'עשירי',
  'אחד עשר', 'שנים עשר', 'שלושה עשר', 'ארבעה עשר', 'חמישה עשר',
]

function millionLabel(n) {
  const ordinal = MILLION_ORDINALS[n - 1]
  return ordinal ? `המיליון ה${ordinal}` : `${n} מיליון ₪`
}

// `target` should be a positive number (selectEffectiveTarget). Returns
// milestones sorted ascending by amount, deduped when a percentage step and
// a million step land on the exact same amount.
export function buildMilestones(target) {
  if (!target || target <= 0) return []

  const percentMilestones = PERCENT_STEPS.map((p) => ({
    id: `pct-${p}`,
    kind: 'percent',
    label: `${Math.round(p * 100)}% מהיעד`,
    amount: target * p,
  }))

  const maxMillion = Math.max(1, Math.ceil((target + 2_000_000) / 1_000_000))
  const millionMilestones = []
  for (let k = 1; k <= maxMillion; k++) {
    millionMilestones.push({ id: `million-${k}`, kind: 'million', label: millionLabel(k), amount: k * 1_000_000 })
  }

  const seen = new Set()
  return [...percentMilestones, ...millionMilestones]
    .sort((a, b) => a.amount - b.amount)
    .filter((m) => {
      if (seen.has(m.amount)) return false
      seen.add(m.amount)
      return true
    })
}

// The next `count` milestones strictly ahead of the current net worth.
export function upcomingMilestones(milestones, netWorth, count = 4) {
  return milestones.filter((m) => m.amount > netWorth).slice(0, count)
}
