import { COMPANY } from '@/lib/company'
import { getCurrencySettings } from '@/lib/currency-settings'
import { getEnabledPaymentMethodSettings } from '@/lib/payment-method-settings'
import { getContactSettings, getCourseBankDetails } from '@/lib/site-content'
import { createServiceClient } from '@/lib/supabase/server'
import { SHIPPING_FEE_PKR } from '@/lib/commerce'
import { createMobileApiResponse, createMobileRequestId, handleMobileApiError } from '@/lib/mobile-api/response'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { APP_URL } from '@/lib/constants'

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : APP_URL)
  ).replace(/\/$/, '')
}

export async function GET(request: Request) {
  const requestId = createMobileRequestId(request)

  try {
    enforceMobileRateLimit(request, 'config', { limit: 120, windowMs: 60_000 })

    const [currencySettings, paymentMethods, contactSettings, courseBankDetails] = await Promise.all([
      getCurrencySettings(),
      getEnabledPaymentMethodSettings(),
      getContactSettings(),
      getCourseBankDetails(),
    ])
    const supabase = await createServiceClient()
    const { data: mobileSettings } = await supabase
      .from('mobile_app_settings')
      .select('minimum_supported_version, maintenance_mode, maintenance_message, feature_flags')
      .eq('id', 1)
      .maybeSingle()

    return createMobileApiResponse(
      {
        currencies: {
          supported: currencySettings.usdEnabled ? ['PKR', 'USD'] : ['PKR'],
          default: currencySettings.defaultCurrency,
          usdToPkrDisplayRate: currencySettings.usdToPkrRate,
          lastUpdatedAt: currencySettings.lastUpdatedAt,
        },
        delivery: {
          feePkr: SHIPPING_FEE_PKR,
        },
        paymentMethods: paymentMethods.map((method) => ({
          id: method.method,
          displayName: method.displayName,
          customerInstructions: method.customerInstructions,
          supportedCurrency: method.supportedCurrency,
          proofUploadRequired: method.proofUploadRequired,
        })),
        courseBankDetails: {
          bankName: courseBankDetails.bankName,
          accountTitle: courseBankDetails.accountTitle,
          accountNumber: courseBankDetails.accountNumber,
          iban: courseBankDetails.iban,
          instructions: courseBankDetails.instructions,
        },
        support: {
          email: COMPANY.email,
          phone: contactSettings.phoneDisplay,
          privacyPolicyUrl: `${appBaseUrl()}/privacy`,
          termsUrl: `${appBaseUrl()}/terms`,
          accountDeletionUrl: `${appBaseUrl()}/account-deletion`,
        },
        app: {
          minimumSupportedVersion: mobileSettings?.minimum_supported_version ?? '1.0.0',
          maintenanceMode: Boolean(mobileSettings?.maintenance_mode),
          maintenanceMessage: mobileSettings?.maintenance_message ?? null,
          featureFlags: mobileSettings?.feature_flags ?? {},
        },
      },
      { headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
