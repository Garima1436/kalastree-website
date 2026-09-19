// Shared by the admin panel, the admin API and the public Careers page.

export const EMPLOYMENT_TYPE_LABELS = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  internship: 'Internship',
  contract: 'Contract',
} as const

export type EmploymentType = keyof typeof EMPLOYMENT_TYPE_LABELS

export const EMPLOYMENT_TYPES = Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[]

// Lower-case, hyphenated, ASCII-only version of a title, for readable web addresses.
// Short, readable reference shown to people (the full uuid stays internal): KS-9139D2AA.
export function jobRef(id: string): string {
  return `KS-${id.slice(0, 8).toUpperCase()}`
}

// "Marketing Intern - KS-9139D2AA": how the role is named on the form and in the team email.
export function roleWithRef(opening: { id: string; title: string }): string {
  return `${opening.title} - ${jobRef(opening.id)}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/^-|-$/g, '')
}

// e.g. /careers/marketing-intern-9139d2aa-1440-4590-8630-7dcb85f7cae6. The readable
// title part is only for people; the trailing id is what identifies the role
// (see parseOpeningId), so the link keeps working if the title is later edited.
export function openingPath(opening: { id: string; title: string }): string {
  return `/careers/${slugify(opening.title) || 'position'}-${opening.id}`
}

// "today", "yesterday", "3 days ago" for anything under 30 days, then a plain date.
// Uses the browser-standard Intl formatters, so English and Hindi need no wording of our own.
export function relativePosted(createdAt: string, lang: 'en' | 'hi', now: number = Date.now()): string {
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN'
  const created = new Date(createdAt)
  const days = Math.max(0, Math.floor((now - created.getTime()) / 86_400_000))
  if (days < 30) return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-days, 'day')
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(created)
}

export type EmploymentTypeKey = 'typeFullTime' | 'typePartTime' | 'typeInternship' | 'typeContract'

// Builds the visitor-language label for each employment type from a translate function.
export function employmentTypeLabels(t: (key: EmploymentTypeKey) => string): Record<EmploymentType, string> {
  return {
    full_time: t('typeFullTime'),
    part_time: t('typePartTime'),
    internship: t('typeInternship'),
    contract: t('typeContract'),
  }
}

export interface JobOpening {
  id: string
  title: string
  title_hi: string | null
  location: string
  employment_type: EmploymentType
  description: string
  description_hi: string | null
  is_active: boolean
  created_at: string
}

export const APPLICATION_STATUSES = ['new', 'shortlisted', 'rejected'] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export interface JobApplication {
  id: string
  job_id: string | null
  role: string
  name: string
  email: string
  phone: string
  location: string
  link: string | null
  message: string
  resume_path: string | null
  resume_name: string | null
  status: ApplicationStatus
  created_at: string
}
