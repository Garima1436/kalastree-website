import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const body = await req.json()
  const { name, email, craft, state, phone, story } = body

  try {
    const [conf, notif] = await Promise.all([
      // Confirmation to applicant
      resend.emails.send({
        from: 'KalaStree <team@kalastree.com>',
        to: email,
        subject: 'Application Received — KalaStree',
        html: `
          <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;background:#FDF6E3;border:1.5px solid #D9C9A8;border-radius:10px;">
            <div style="text-align:center;margin-bottom:24px;">
              <h1 style="font-size:28px;color:#C94B1A;margin:0;">Kala<em style="color:#B8860B;">Stree</em></h1>
              <p style="color:#5C5542;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:4px 0 0;">Heritage by Her</p>
            </div>
            <h2 style="color:#1B2E4A;font-size:22px;">Namaste ${name} 🙏</h2>
            <p style="color:#5C5542;line-height:1.8;">
              We have received your application to sell on <strong>KalaStree</strong>. Your craft <strong>${craft}</strong> from <strong>${state}</strong> sounds beautiful, and we are honoured you chose us.
            </p>
            <div style="background:#F2E8D5;border-left:4px solid #C94B1A;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;">
              <p style="margin:0;color:#1B2E4A;font-weight:bold;">What happens next?</p>
              <ol style="color:#5C5542;line-height:2;margin:8px 0 0;padding-left:20px;">
                <li>Garima's team reviews your application (within 48 hours)</li>
                <li>We schedule a short call to verify your GI credentials</li>
                <li>Your artisan profile goes live on KalaStree</li>
                <li>Start receiving orders — paid directly to you</li>
              </ol>
            </div>
            <p style="color:#5C5542;line-height:1.8;">
              Questions? Reply to this email or write to <a href="mailto:garima@kalastree.com" style="color:#C94B1A;">garima@kalastree.com</a>
            </p>
            <hr style="border:none;border-top:1px solid #D9C9A8;margin:24px 0;"/>
            <p style="color:#9A8E7A;font-size:12px;text-align:center;">
              KalaStree · India's first GI-verified marketplace for women artisans<br/>
              IIT Patna Research Initiative · <em>"Heritage by Her"</em>
            </p>
          </div>
        `,
      }),

      // Notification to Garima
      resend.emails.send({
        from: 'KalaStree Applications <team@kalastree.com>',
        to: ['iammishu1436@gmail.com', 'ashishkumar19975@gmail.com'],
        subject: `New Artisan Application — ${name} (${craft}, ${state})`,
        html: `
          <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;background:#1B2E4A;border-radius:10px;">
            <h2 style="color:#B8860B;margin-top:0;">New Artisan Application 🌾</h2>
            <table style="width:100%;border-collapse:collapse;">
              ${[
                ['Name', name],
                ['Email', email],
                ['Phone', phone || '—'],
                ['Craft', craft],
                ['State', state],
              ].map(([k, v]) => `
                <tr>
                  <td style="color:#B8860B;padding:8px 12px;font-size:13px;font-weight:bold;width:100px;vertical-align:top;">${k}</td>
                  <td style="color:#fff;padding:8px 12px;font-size:14px;">${v}</td>
                </tr>
              `).join('')}
              ${story ? `
                <tr>
                  <td style="color:#B8860B;padding:8px 12px;font-size:13px;font-weight:bold;vertical-align:top;">Story</td>
                  <td style="color:rgba(255,255,255,0.8);padding:8px 12px;font-size:14px;line-height:1.7;">${story}</td>
                </tr>
              ` : ''}
            </table>
          </div>
        `,
      }),
    ])

    // Resend v6 returns { data, error } instead of throwing
    if (conf.error) console.error('Confirmation email error:', conf.error)
    if (notif.error) console.error('Notification email error:', notif.error)

    if (conf.error && notif.error) {
      return NextResponse.json({ ok: false, error: conf.error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Email error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
