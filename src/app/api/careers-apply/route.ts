import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { getServerLang, getT } from '@/lib/i18n/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getLiveOpening } from '@/lib/careersData'
import { isUuid } from '@/lib/careersValidation'
import { openingPath, roleWithRef } from '@/lib/careers'

const CAREERS_RECIPIENTS = ['hrd@kalastree.com', 'ashish@kalastree.com', 'garima@kalastree.com']

const LIMITS = { name: 100, email: 200, phone: 30, location: 100, role: 100, link: 300, message: 3000 } as const

// Kept under typical serverless request-body limits (~4.5 MB) with headroom for the other fields.
const MAX_RESUME_BYTES = 4 * 1024 * 1024

// Extension -> content type plus the leading bytes a genuine file of that type starts with.
// Checking the bytes (not just the name) stops e.g. an .exe renamed to .pdf from being attached.
const RESUME_TYPES: Record<string, { contentType: string; magic: number[] }> = {
  pdf: { contentType: 'application/pdf', magic: [0x25, 0x50, 0x44, 0x46] },
  doc: { contentType: 'application/msword', magic: [0xd0, 0xcf, 0x11, 0xe0] },
  docx: { contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', magic: [0x50, 0x4b, 0x03, 0x04] },
}

// Best-effort per-IP throttle (in-memory, so it resets on cold start and isn't shared
// across instances) — same approach as the site's other public API routes. This route
// also sends a confirmation email to an address the visitor types, so unthrottled it
// could be used to mail strangers.
const rateLimitMap = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT_MAX = 8
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  if (rateLimitMap.size > 1000) {
    for (const [key, entry] of rateLimitMap) if (now > entry.reset) rateLimitMap.delete(key)
  }
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function field(form: FormData, key: string): string {
  const v = form.get(key)
  return typeof v === 'string' ? v.trim() : ''
}

function fail(status: number, code: string, error: string) {
  return NextResponse.json({ ok: false, code, error }, { status })
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) return fail(429, 'rate_limited', 'Too many applications')

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return fail(400, 'invalid', 'Invalid request')
  }

  // Honeypot: a real visitor never sees or fills this field. Report success so
  // a bot gets no signal to adapt to, but send nothing.
  if (field(form, 'website')) return NextResponse.json({ ok: true })

  const name = field(form, 'name')
  const email = field(form, 'email')
  const phone = field(form, 'phone')
  const location = field(form, 'location')
  let role = field(form, 'role')
  const link = field(form, 'link')
  const message = field(form, 'message')

  // Applying to a specific opening: the id must belong to a role that is still live, and the
  // role name then comes from the database, never from what the browser sent.
  const jobId = field(form, 'jobId')
  let jobUrl = ''
  if (jobId) {
    const opening = isUuid(jobId) ? await getLiveOpening(jobId) : null
    if (!opening) return fail(404, 'job_unavailable', 'This position is no longer open')
    role = roleWithRef(opening)
    jobUrl = `${new URL(req.url).origin}${openingPath(opening)}`
  }

  // Everything except the LinkedIn/portfolio link is required.
  if (!name || !email || !phone || !location || !role || !message) {
    return fail(400, 'invalid', 'All fields except the link are required')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, 'invalid', 'Invalid email address')
  const tooLong = (Object.keys(LIMITS) as (keyof typeof LIMITS)[]).find(k => (k === 'role' && jobId ? '' : field(form, k)).length > LIMITS[k])
  if (tooLong) return fail(400, 'invalid', `${tooLong} is too long`)
  // Only http(s) links are rendered as clickable in the email.
  const linkIsUrl = /^https?:\/\//i.test(link)

  // Resume (required)
  const resume = form.get('resume')
  if (!(resume instanceof File) || resume.size === 0) return fail(400, 'invalid', 'Resume is required')
  if (resume.size > MAX_RESUME_BYTES) return fail(413, 'file_too_large', 'Resume too large')
  const ext = resume.name.split('.').pop()?.toLowerCase() ?? ''
  const type = RESUME_TYPES[ext]
  if (!type) return fail(400, 'file_type', 'Unsupported resume type')
  const content = Buffer.from(await resume.arrayBuffer())
  if (!type.magic.every((byte, i) => content[i] === byte)) return fail(400, 'file_type', 'Unsupported resume type')
  const safeBase = resume.name.replace(/\.[^.]*$/, '').replace(/[^\w\- ()]/g, '_').slice(0, 80) || 'resume'
  const attachment = { filename: `${safeBase}.${ext}`, content, contentType: type.contentType }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured')
    return fail(500, 'server', 'Email service not configured')
  }
  const resend = new Resend(apiKey)

  const rows: [string, string][] = [
    ['Name', escapeHtml(name)],
    ['Email', `<a href="mailto:${escapeHtml(email)}" style="color:#D4A000;">${escapeHtml(email)}</a>`],
    ['Phone', escapeHtml(phone)],
    ['Location', escapeHtml(location)],
    ['Role', escapeHtml(role)],
    ...(jobId ? [['Job ID', escapeHtml(jobId)] as [string, string], ['Job page', `<a href="${escapeHtml(jobUrl)}" style="color:#D4A000;">${escapeHtml(jobUrl)}</a>`] as [string, string]] : []),
    [
      'Link',
      !link ? '—' : linkIsUrl
        ? `<a href="${escapeHtml(link)}" style="color:#D4A000;">${escapeHtml(link)}</a>`
        : escapeHtml(link),
    ],
    ['Resume', `Attached (${escapeHtml(attachment.filename)})`],
  ]

  // Header-injection guard: strip line breaks from anything that lands in the subject.
  const subjectName = name.replace(/[\r\n]+/g, ' ')
  const subjectRole = role.replace(/[\r\n]+/g, ' ')

  try {
    const { error } = await resend.emails.send({
      from: 'KalaStree Careers <team@kalastree.com>',
      to: CAREERS_RECIPIENTS,
      // Replying goes straight to the applicant, not to the sending address.
      replyTo: email,
      subject: `New Career Application — ${subjectName} (${subjectRole})`,
      attachments: [attachment],
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;background:#1B2E4A;border-radius:10px;">
          <h2 style="color:#D4A000;margin-top:0;">New Career Application 💼</h2>
          <table style="width:100%;border-collapse:collapse;">
            ${rows.map(([k, v]) => `
              <tr>
                <td style="color:#D4A000;padding:8px 12px;font-size:13px;font-weight:bold;width:100px;vertical-align:top;">${k}</td>
                <td style="color:#fff;padding:8px 12px;font-size:14px;">${v}</td>
              </tr>
            `).join('')}
            <tr>
              <td style="color:#D4A000;padding:8px 12px;font-size:13px;font-weight:bold;vertical-align:top;">Message</td>
              <td style="color:rgba(255,255,255,0.85);padding:8px 12px;font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</td>
            </tr>
          </table>
        </div>
      `,
    })

    // Resend returns { data, error } rather than throwing
    if (error) {
      console.error('Careers email error:', error)
      return fail(500, 'server', 'Could not send application')
    }
  } catch (err) {
    console.error('Careers email error:', err)
    return fail(500, 'server', 'Could not send application')
  }

  // Keep a record for the admin panel (private resume file + a row). The team already
  // has the email, so a storage failure is logged and never fails the application.
  try {
    const applicationId = crypto.randomUUID()
    const resumePath = `${applicationId}/${attachment.filename}`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('resumes')
      .upload(resumePath, content, { contentType: type.contentType })
    if (uploadError) console.error('Could not store resume:', uploadError.message)
    const { error: insertError } = await supabaseAdmin.from('job_applications').insert({
      id: applicationId,
      job_id: jobId || null,
      role,
      name,
      email,
      phone,
      location,
      link: link || null,
      message,
      resume_path: uploadError ? null : resumePath,
      resume_name: attachment.filename,
    })
    if (insertError) console.error('Could not store application:', insertError.message)
  } catch (err) {
    console.error('Could not store application:', err)
  }

  // Confirmation to the candidate, in the language they browsed in. The wording is
  // fixed — only their first name (escaped) is interpolated — and it is sent only
  // after the team notification succeeded. A failure here must not fail the
  // application, which the team already has.
  let confirmed = false
  try {
    const lang = await getServerLang()
    const t = getT('careers', lang)
    const firstName = escapeHtml(name.split(/\s+/)[0])
    const { error } = await resend.emails.send({
      from: 'KalaStree <team@kalastree.com>',
      to: email,
      replyTo: 'hrd@kalastree.com',
      subject: t('confirmSubject'),
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;background:#FFF8EE;border:1.5px solid #DDB840;border-radius:10px;">
          <div style="text-align:center;margin-bottom:24px;">
            <img src="https://kalastree.com/kalastree-logo.png" alt="KalaStree — Heritage by Her" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
          </div>
          <h2 style="color:#1B2E4A;font-size:22px;">${t('confirmGreeting')} ${firstName} 🙏</h2>
          <p style="color:#6B4820;line-height:1.8;">${t('confirmBody')}</p>
          <p style="color:#6B4820;line-height:1.8;">— ${t('confirmSignoff')}</p>
          <hr style="border:none;border-top:1px solid #DDB840;margin:24px 0;"/>
          <p style="color:#A07840;font-size:12px;text-align:center;">
            KalaStree · <em>"Heritage by Her"</em>
          </p>
        </div>
      `,
    })
    if (error) console.error('Careers confirmation email error:', error)
    else confirmed = true
  } catch (err) {
    console.error('Careers confirmation email error:', err)
  }

  return NextResponse.json({ ok: true, confirmed })
}
