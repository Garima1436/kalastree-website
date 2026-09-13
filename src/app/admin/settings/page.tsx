import { getSiteSetting } from '@/lib/site-settings'
import SettingsForm from './SettingsForm'

export default async function AdminSettingsPage() {
  const [whatsappNumber, whatsappMessage] = await Promise.all([
    getSiteSetting('whatsapp_number'),
    getSiteSetting('whatsapp_default_message'),
  ])

  return (
    <div>
      <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A', marginBottom: '2rem' }}>
        Site Settings
      </h1>
      <SettingsForm initialWhatsappNumber={whatsappNumber ?? ''} initialWhatsappMessage={whatsappMessage ?? ''} />
    </div>
  )
}
