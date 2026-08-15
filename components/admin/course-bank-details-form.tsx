import { saveCourseBankDetailsFormAction } from '@/actions/admin/site-content'
import type { BankDetails } from '@/lib/bank-details'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function CourseBankDetailsForm({ details }: { details: BankDetails }) {
  return (
    <form action={saveCourseBankDetailsFormAction} className="space-y-5 rounded-lg border bg-card p-4 sm:p-6">
      <div>
        <Label className="text-lg font-semibold">Course Bank Details</Label>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          These account details appear on course payment and certificate payment pages. They are separate from shop checkout bank details.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="course-bank-name">Bank name</Label>
          <Input id="course-bank-name" name="bankName" defaultValue={details.bankName} className="rounded-lg" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="course-account-title">Account title</Label>
          <Input id="course-account-title" name="accountTitle" defaultValue={details.accountTitle} className="rounded-lg" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="course-account-number">Account number</Label>
          <Input id="course-account-number" name="accountNumber" defaultValue={details.accountNumber} className="rounded-lg" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="course-iban">IBAN</Label>
          <Input id="course-iban" name="iban" defaultValue={details.iban} className="rounded-lg" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="course-bank-instructions">Payment instructions</Label>
          <Textarea
            id="course-bank-instructions"
            name="instructions"
            defaultValue={details.instructions}
            rows={3}
            className="rounded-lg"
          />
        </div>
      </div>

      <Button type="submit" className="max-w-full rounded-lg bg-[#1D4ED8] whitespace-normal">
        Save Course Bank Details
      </Button>
    </form>
  )
}
