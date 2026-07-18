// Calcul de la prochaine occurrence d'une tâche récurrente (modèle « la tâche se
// reprogramme »). Fonction pure sur des dates ISO (YYYY-MM-DD), sans fuseau.
// Règle de fin de mois : on rabat sur le dernier jour du mois (le 31 → 28/29 févr.).

export type RecurrenceFreq = 'weekly' | 'monthly' | 'yearly'

const pad = (n: number) => String(n).padStart(2, '0')
const fmt = (year: number, month0: number, day: number) => `${year}-${pad(month0 + 1)}-${pad(day)}`

// Nombre de jours dans le mois (month0 = 0-11).
function daysInMonth(year: number, month0: number): number {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate()
}

// Rabat un numéro de jour sur le dernier jour du mois si nécessaire.
function clampDay(year: number, month0: number, day: number): number {
  return Math.min(day, daysInMonth(year, month0))
}

function addDays(year: number, month0: number, day: number, n: number): string {
  const dt = new Date(Date.UTC(year, month0, day + n))
  return fmt(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())
}

// ISO weekday : lundi = 1 … dimanche = 7.
function isoWeekday(year: number, month0: number, day: number): number {
  const wd = new Date(Date.UTC(year, month0, day)).getUTCDay()
  return wd === 0 ? 7 : wd
}

/**
 * Prochaine occurrence après `currentISO`, selon la règle.
 * @param days jours du mois (1-31) si monthly ; de la semaine (1-7) si weekly ; ignoré si yearly.
 */
export function computeNextOccurrence(
  currentISO: string,
  freq: RecurrenceFreq,
  interval: number,
  days: number[] | null | undefined
): string {
  const [y, m, d] = currentISO.split('-').map(Number)
  const year = y, month0 = m - 1, day = d
  const step = interval && interval > 0 ? interval : 1

  if (freq === 'yearly') {
    const ny = year + step
    return fmt(ny, month0, clampDay(ny, month0, day))
  }

  if (freq === 'monthly') {
    const dayList = (days && days.length ? [...days] : [day]).sort((a, b) => a - b)
    // Un jour de la liste, plus loin dans le mois courant (comparé après rabat) ?
    for (const dd of dayList) {
      const cd = clampDay(year, month0, dd)
      if (cd > day) return fmt(year, month0, cd)
    }
    // Sinon, mois + interval, premier jour de la liste.
    const total = month0 + step
    const ny = year + Math.floor(total / 12)
    const nm = ((total % 12) + 12) % 12
    return fmt(ny, nm, clampDay(ny, nm, dayList[0]))
  }

  // weekly
  const dow = isoWeekday(year, month0, day)
  const dowList = (days && days.length ? [...days] : [dow]).sort((a, b) => a - b)
  // Un jour de la liste, plus loin dans la semaine courante ?
  for (const wd of dowList) {
    if (wd > dow) return addDays(year, month0, day, wd - dow)
  }
  // Sinon, saut de `step` semaines jusqu'au premier jour de la liste.
  const toNextMonday = 8 - dow + (step - 1) * 7
  return addDays(year, month0, day, toNextMonday + (dowList[0] - 1))
}
