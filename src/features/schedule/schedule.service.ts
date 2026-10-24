import type { FastifyRequest } from 'fastify'
import * as weeks from '@/db/datamappers/schedule-week.datamapper'
import { findAppointments } from '@/db/datamappers/appointment.datamapper'
import { findProjectById } from '@/db/datamappers/project.datamapper'
import { findContactById } from '@/db/datamappers/contact.datamapper'
import { findCrmDailyActivity } from '@/db/datamappers/stats.datamapper'
import { toMinutes } from './schedule.schema'
import type { Appointment, ScheduleOwner, WeekView } from './schedule.types'

export function ownerOf(req: FastifyRequest): ScheduleOwner {
  return { organizationId: req.organizationId, userId: req.session.user.id }
}

/** 'YYYY-MM-DD' + n jours, en restant sur des dates civiles (aucun fuseau en jeu). */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * Les clés étrangères ne vérifient que l'existence d'un projet ou d'un contact,
 * pas leur appartenance au workspace : sans ce contrôle, un id deviné suffirait
 * à rattacher un créneau au projet d'autrui (et à y verser du temps passé).
 */
export async function foreignReference(
  organizationId: string,
  refs: { project_id?: string | null; contact_id?: string | null }
): Promise<string | null> {
  if (refs.project_id && !(await findProjectById(refs.project_id, organizationId))) return 'Projet introuvable'
  if (refs.contact_id && !(await findContactById(refs.contact_id, organizationId))) return 'Contact introuvable'
  return null
}

/** Une mise à jour partielle (début seul, fin seule) doit rester cohérente avec la valeur en base. */
export function invertedTimes(
  input: { start_time?: string; end_time?: string },
  current: { start_time: string; end_time: string }
): boolean {
  const start = input.start_time ?? current.start_time
  const end   = input.end_time ?? current.end_time
  return toMinutes(end) <= toMinutes(start)
}

/** Fenêtre occupée par un rendez-vous, en minutes : du départ (trajet aller) au retour, marge comprise. */
export function appointmentWindow(a: Appointment): { from: number; to: number } {
  const start = toMinutes(a.start_time)
  return {
    from: start - a.travel_before_minutes,
    to:   start + a.duration_minutes + a.buffer_minutes + a.travel_after_minutes,
  }
}

/**
 * Créneaux chevauchés par un rendez-vous du même jour. Calculés à chaque
 * lecture, jamais stockés : rien n'est modifié automatiquement, l'écran se
 * contente de signaler. Un rendez-vous annulé n'occupe plus rien.
 */
function findConflicts(
  slots: { key: string; date: string; start_time: string; end_time: string }[],
  appointments: Appointment[]
): string[] {
  const active = appointments.filter((a) => a.status !== 'cancelled')
  return slots
    .filter((slot) => active.some((a) => {
      if (a.date !== slot.date) return false
      const w = appointmentWindow(a)
      return toMinutes(slot.start_time) < w.to && toMinutes(slot.end_time) > w.from
    }))
    .map((slot) => slot.key)
}

/**
 * Une semaine telle que l'écran l'affiche. Non créée, elle est PROJETÉE depuis
 * la semaine type sans rien écrire : consulter une semaine future ne doit pas la
 * figer sur un modèle qui aura changé d'ici là.
 */
export async function buildWeekView(owner: ScheduleOwner, weekStart: string): Promise<WeekView> {
  const weekEnd = addDays(weekStart, 6)
  const [week, appointments, publicHolidays, crmActivity] = await Promise.all([
    weeks.findWeekByStart(owner, weekStart),
    findAppointments(owner, { from: weekStart, to: weekEnd }),
    weeks.findPublicHolidays(weekStart),
    // Le CRM est commun au workspace : l'activité n'est pas filtrée par utilisateur
    // (une interaction ne porte pas encore son auteur).
    findCrmDailyActivity(owner.organizationId, weekStart, weekEnd),
  ])

  if (week) {
    const [daysOff, blocks] = await Promise.all([weeks.findDaysOff(week.id), weeks.findBlocks(week.id)])
    return {
      week_start: weekStart,
      created: true,
      week,
      days_off: daysOff,
      blocks,
      projected: [],
      appointments,
      public_holidays: publicHolidays,
      conflicts: findConflicts(blocks.map((b) => ({ ...b, key: b.id })), appointments),
      crm_activity: crmActivity,
    }
  }

  // En projection, les fériés des jours ouvrés sont présentés chômés, comme ils
  // le seront à la création.
  const proposedOff = new Set(
    publicHolidays.filter((h) => new Date(`${h.date}T12:00:00Z`).getUTCDay() % 6 !== 0).map((h) => h.date)
  )
  const projected = (await weeks.projectWeek(owner, weekStart)).filter((b) => !proposedOff.has(b.date))

  return {
    week_start: weekStart,
    created: false,
    week: null,
    days_off: [],
    blocks: [],
    projected,
    appointments,
    public_holidays: publicHolidays,
    conflicts: findConflicts(
      projected.map((b) => ({ ...b, key: `${b.template_block_id}:${b.date}` })),
      appointments
    ),
    crm_activity: crmActivity,
  }
}
