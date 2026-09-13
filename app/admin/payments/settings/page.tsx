import Link from "next/link";
import { savePaymentSettings } from "@/app/admin/payments/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireAdmin } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PaymentSettingsPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const query = await searchParams;
  const { profile } = await requireAdmin("/admin/payments/settings");
  const supabase = await createServerSupabaseClient();
  const { data: settings } = await supabase.from("payment_settings").select("*").eq("id", true).maybeSingle();
  return <DashboardShell admin eyebrow="Enrollment payments" title="Payment details" profile={profile}>
    <Link href="/admin/payments" className="font-extrabold text-blue-700 hover:underline">← Payment reviews</Link>
    {query.notice && <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">Payment details saved.</div>}
    {query.error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">Check every required field and try again.</div>}
    <Card className="mt-6 max-w-3xl p-6 sm:p-8"><p className="leading-7 text-slate-600">The application starts with clearly labelled demo Easypaisa details. Replace them here whenever you are ready to accept real payments.</p><form action={savePaymentSettings} className="mt-6 space-y-5"><Field label="Payment method" name="payment_method" defaultValue={settings?.payment_method ?? "Easypaisa (Demo)"} placeholder="Bank transfer, Easypaisa, JazzCash" required /><Field label="Account title" name="account_title" defaultValue={settings?.account_title ?? "SkillSpring Demo Account"} required /><Field label="Account number / IBAN" name="account_number" defaultValue={settings?.account_number ?? "0300-0000000"} required /><div className="space-y-2"><Label htmlFor="instructions">Student instructions</Label><textarea id="instructions" name="instructions" defaultValue={settings?.instructions ?? "Demo payment flow only — do not send real money. Upload a payment screenshot for admin review."} rows={4} maxLength={2000} className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Include any reference students should add with their payment." /></div><label className="flex items-center gap-3 font-bold"><input type="checkbox" name="is_active" defaultChecked={settings?.is_active ?? true} className="h-4 w-4 accent-blue-600" />Allow new payment submissions</label><Button type="submit" className="min-h-11 bg-blue-600 px-6 font-extrabold hover:bg-blue-700">Save payment details</Button></form></Card>
  </DashboardShell>;
}

function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) { return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} className="h-12 rounded-xl" {...props} /></div>; }
