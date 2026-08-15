import { saveContactSettingsFormAction } from '@/actions/admin/site-content'
import type { ContactSettings } from '@/lib/contact-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function ContactSettingsForm({ settings }: { settings: ContactSettings }) {
  return (
    <form action={saveContactSettingsFormAction} className="space-y-5 rounded-lg border bg-card p-4 sm:p-6">
      <div>
        <Label className="text-lg font-semibold">Contact Phone & WhatsApp</Label>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Update the public contact number and the green WhatsApp buttons. You can enter a local number like
          0302 2220448 or an international number like +92 302 2220448.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-phone-display">Primary phone</Label>
          <Input
            id="contact-phone-display"
            name="phoneDisplay"
            defaultValue={settings.phoneDisplay}
            placeholder="0302 2220448"
            className="rounded-lg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone-alt-display">Secondary phone</Label>
          <Input
            id="contact-phone-alt-display"
            name="phoneAltDisplay"
            defaultValue={settings.phoneAltDisplay}
            placeholder="+92 300 8079480"
            className="rounded-lg"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="contact-whatsapp">WhatsApp number</Label>
          <Input
            id="contact-whatsapp"
            name="whatsapp"
            defaultValue={settings.whatsapp}
            placeholder="923022220448"
            className="rounded-lg"
          />
          <p className="text-xs text-muted-foreground">
            This number is used for every green WhatsApp button.
          </p>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="contact-whatsapp-message">WhatsApp pre-filled message</Label>
          <Textarea
            id="contact-whatsapp-message"
            name="whatsappMessage"
            defaultValue={settings.whatsappMessage}
            rows={3}
            className="rounded-lg"
          />
        </div>
      </div>

      <Button type="submit" className="max-w-full rounded-lg bg-[#1D4ED8] whitespace-normal">
        Save Contact Settings
      </Button>
    </form>
  )
}
