export type ScheduleCategory     = 'pro' | 'perso'
export type SchedulePeriodRule   = 'always' | 'school_days' | 'school_holidays'
export type ScheduleBlockStatus  = 'planned' | 'done' | 'partial' | 'skipped'
export type ScheduleDayOffReason = 'public_holiday' | 'personal'
export type AppointmentStatus    = 'planned' | 'done' | 'cancelled'

/** Mesure facultative saisie au bilan (« Contacts », nombre). Libellé unique dans un créneau. */
export interface ScheduleMeasure {
  label: string
  type: 'number' | 'text'
  unit: string | null
}

export type MeasureValues = Record<string, number | string>

export interface ScheduleTemplateBlock {
  id: string
  organization_id: string
  user_id: string
  weekday: number
  start_time: string
  end_time: string
  label: string
  category: ScheduleCategory
  project_id: string | null
  period_rule: SchedulePeriodRule
  measures: ScheduleMeasure[]
  created_at: Date
  updated_at: Date
}

export interface SchoolHolidayPeriod {
  id: string
  organization_id: string
  user_id: string
  label: string
  start_date: string
  end_date: string
  created_at: Date
}

export interface ScheduleWeek {
  id: string
  organization_id: string
  user_id: string
  week_start: string
  review_went_well: string | null
  review_blocked: string | null
  review_notes: string | null
  reviewed_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface ScheduleDayOff {
  id: string
  week_id: string
  date: string
  reason: ScheduleDayOffReason
}

export interface ScheduleBlock {
  id: string
  week_id: string
  template_block_id: string | null
  date: string
  start_time: string
  end_time: string
  label: string
  category: ScheduleCategory
  project_id: string | null
  status: ScheduleBlockStatus
  actual_minutes: number | null
  measures: ScheduleMeasure[]
  measure_values: MeasureValues
  note: string | null
  created_at: Date
  updated_at: Date
}

/** Créneau d'une semaine non encore créée : calculé depuis le modèle, rien en base. */
export interface ProjectedBlock {
  template_block_id: string
  date: string
  start_time: string
  end_time: string
  label: string
  category: ScheduleCategory
  project_id: string | null
  measures: ScheduleMeasure[]
}

export interface AppointmentTemplate {
  id: string
  organization_id: string
  user_id: string
  name: string
  category: ScheduleCategory
  travel_before_minutes: number
  travel_before_label: string | null
  duration_minutes: number
  buffer_minutes: number
  travel_after_minutes: number
  travel_after_label: string | null
  created_at: Date
  updated_at: Date
}

export interface Appointment {
  id: string
  organization_id: string
  user_id: string
  template_id: string | null
  title: string
  date: string
  start_time: string
  category: ScheduleCategory
  travel_before_minutes: number
  travel_before_label: string | null
  duration_minutes: number
  buffer_minutes: number
  travel_after_minutes: number
  travel_after_label: string | null
  project_id: string | null
  contact_id: string | null
  count_travel_time: boolean
  location: string | null
  notes: string | null
  status: AppointmentStatus
  actual_end_time: string | null
  created_at: Date
  updated_at: Date
}

export interface PublicHoliday {
  date: string
  label: string
}

/**
 * Une semaine telle que l'écran l'affiche. `week` est null tant qu'elle n'est
 * pas créée : `blocks` est alors vide et `projected` contient ce qu'elle serait.
 * `conflicts` liste les créneaux (id, ou `template_block_id:date` en projection)
 * chevauchés par un rendez-vous.
 */
export interface WeekView {
  week_start: string
  created: boolean
  week: ScheduleWeek | null
  days_off: ScheduleDayOff[]
  blocks: ScheduleBlock[]
  projected: ProjectedBlock[]
  appointments: Appointment[]
  public_holidays: PublicHoliday[]
  conflicts: string[]
}

/** Une semaine appartient à un utilisateur DANS un workspace : toute requête filtre sur les deux. */
export interface ScheduleOwner {
  organizationId: string
  userId: string
}
