"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleDollarSign, Eye, FileText, LayoutGrid, Lock, LogOut, Save, Settings2, Sparkles } from "lucide-react";
import type { PublicSiteSettings } from "@/lib/site-settings/defaults";

type SessionResponse = {
  authenticated: boolean;
  admin?: { id: string; email: string };
};

type CmsPage = {
  _id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  showInHeader: boolean;
  showInFooter: boolean;
};

const emptySettings: PublicSiteSettings = {
  paymentEnabled: true,
  payment: { amount: "9.95", currency: "EUR" },
  lockSections: {
    riskOverview: true,
    mileageHistory: true,
    marketAnalysis: true,
    damageHistory: true,
    technicalSpecs: false,
    inspectionTimeline: false,
    ownershipHistory: false,
    reportDownload: true
  },
  ui: {
    showFeaturesLink: true,
    showSampleLink: true,
    showPricingLink: true,
    showLoginButton: true
  },
  content: {
    platformName: "Kentekenrapport",
    landingHeroTitleA: "Koop je volgende auto niet blind.",
    landingHeroTitleB: "Ken de echte geschiedenis.",
    landingHeroSubtitle: "Ontdek direct verborgen schade, kilometerfraude, marktwaarde en eigendomsgeschiedenis met alleen een kenteken.",
    landingCtaTitle: "Klaar om met vertrouwen te kopen?",
    landingCtaSubtitle: "Sluit je aan bij meer dan 1.000.000 slimme kopers die hun auto checkten voor de deal.",
    landingCtaButton: "Start je check nu",
    landingHeroImageUrl: "https://storage.googleapis.com/banani-generated-images/generated-images/ad953e96-ea70-4d4d-ab60-fc21c7b01fb4.jpg",
    footerDescription: "Het meest complete en transparante voertuiggeschiedenisplatform voor kopers en dealers."
  },
  landing: {
    badgeTop: "Het #1 beoordeelde voertuiggeschiedenisplatform",
    trustedSourcesLabel: "Vertrouwde databronnen",
    featureSectionLabel: "Volledige data",
    featureSectionTitle: "Alles wat je nodig hebt voor een veilige aankoop",
    howSectionLabel: "Hoe het werkt",
    howSectionTitle: "Drie simpele stappen naar volledige zekerheid",
    sectionVisibility: { features: true, workflow: true, cta: true },
    features: [],
    workflow: [],
    footer: {
      productTitle: "Product",
      companyTitle: "Company",
      legalTitle: "Legal",
      productLinks: [],
      companyLinks: [],
      legalLinks: []
    }
  }
};

function Panel({
  id,
  icon: Icon,
  title,
  subtitle,
  children
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="mb-4 flex items-start gap-3 border-b border-slate-100 pb-4">
        <div className="mt-0.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
          <Icon className="h-4.5 w-4.5 text-brand-700" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  rows,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  rows?: number;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <textarea
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        rows={rows ?? 3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition hover:border-slate-300 hover:bg-slate-100">
      <span className="font-medium text-slate-700">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
    </label>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [settings, setSettings] = useState<PublicSiteSettings>(emptySettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [pagesLoading, setPagesLoading] = useState(true);

  const [newPage, setNewPage] = useState({
    title: "",
    slug: "",
    content: "",
    published: false,
    showInHeader: false,
    showInFooter: false
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      const sessionRes = await fetch("/api/admin/session", { cache: "no-store" });
      if (!sessionRes.ok) {
        router.replace("/admin/login");
        return;
      }
      const session = (await sessionRes.json()) as SessionResponse;
      if (!session.authenticated || !session.admin) {
        router.replace("/admin/login");
        return;
      }

      const [settingsRes, pagesRes] = await Promise.all([
        fetch("/api/admin/settings", { cache: "no-store" }),
        fetch("/api/admin/pages", { cache: "no-store" })
      ]);

      if (!settingsRes.ok || !pagesRes.ok) {
        router.replace("/admin/login");
        return;
      }

      const settingsPayload = (await settingsRes.json()) as PublicSiteSettings;
      const pagesPayload = (await pagesRes.json()) as CmsPage[];

      if (!active) return;
      setAdminEmail(session.admin.email);
      setSettings(settingsPayload);
      setPages(pagesPayload);
      setLoading(false);
      setPagesLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [router]);

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(payload.error ?? "Failed to save settings.");
      setSaving(false);
      return;
    }
    setMessage("All changes saved successfully.");
    setSaving(false);
  };

  const reloadPages = async () => {
    setPagesLoading(true);
    const response = await fetch("/api/admin/pages", { cache: "no-store" });
    if (!response.ok) {
      setPagesLoading(false);
      return;
    }
    const payload = (await response.json()) as CmsPage[];
    setPages(payload);
    setPagesLoading(false);
  };

  const createPage = async () => {
    const response = await fetch("/api/admin/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPage)
    });
    if (!response.ok) return;
    setNewPage({ title: "", slug: "", content: "", published: false, showInHeader: false, showInFooter: false });
    await reloadPages();
  };

  const updatePage = async (id: string, patch: Partial<CmsPage>) => {
    await fetch(`/api/admin/pages/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    await reloadPages();
  };

  const deletePage = async (id: string) => {
    const selected = pages.find((page) => page._id === id);
    if (selected && legalSlugs.has(selected.slug)) {
      setMessage("Legal pages cannot be deleted. Edit them in the Legal Pages section.");
      return;
    }
    await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
    await reloadPages();
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  const iconOptions = useMemo(
    () => ["CarFront", "Gauge", "TrendingUp", "Users", "FileCheck", "FileSpreadsheet", "Sparkles", "ShieldCheck"],
    []
  );
  const legalSlugs = useMemo(() => new Set(["privacy-policy", "terms-and-conditions"]), []);

  if (loading) {
    return <div className="mx-auto max-w-3xl px-6 py-16 text-sm text-slate-500">Loading admin panel...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-100">
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
              <Sparkles className="h-3.5 w-3.5" /> Admin Workspace
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Site Control Center</h1>
            <p className="text-sm text-slate-500">Signed in as {adminEmail}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/legal" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              Legal Pages
            </Link>
            <button
              type="button"
              onClick={saveSettings}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-[92px]">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Categories</div>
          <nav className="space-y-1 text-sm">
            <a href="#payment" className="block rounded-lg px-2.5 py-2 transition hover:bg-slate-100">Payment</a>
            <a href="#locks" className="block rounded-lg px-2.5 py-2 transition hover:bg-slate-100">Locks</a>
            <a href="#navigation" className="block rounded-lg px-2.5 py-2 transition hover:bg-slate-100">Navigation</a>
            <a href="#content" className="block rounded-lg px-2.5 py-2 transition hover:bg-slate-100">Global Content</a>
            <a href="#components" className="block rounded-lg px-2.5 py-2 transition hover:bg-slate-100">Landing Components</a>
            <a href="#pages" className="block rounded-lg px-2.5 py-2 transition hover:bg-slate-100">Custom Pages</a>
          </nav>
          <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/60 p-3 text-xs text-slate-700">
            <p className="font-semibold text-brand-800">Quick guidance</p>
            <p className="mt-1">1. Edit sections on the right.</p>
            <p>2. Click Save to publish config.</p>
            <p>3. Add pages under <code>/p/slug</code>.</p>
          </div>
        </aside>

        <main className="space-y-6">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payment</div>
              <div className="mt-1 text-lg font-bold text-slate-900">
                {settings.payment.amount} {settings.payment.currency}
              </div>
              <p className="text-xs text-slate-500">{settings.paymentEnabled ? "Paywall enabled" : "Paywall disabled"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Locked Sections</div>
              <div className="mt-1 text-lg font-bold text-slate-900">
                {Object.values(settings.lockSections).filter(Boolean).length}
              </div>
              <p className="text-xs text-slate-500">Sections currently behind payment</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Landing Blocks</div>
              <div className="mt-1 text-lg font-bold text-slate-900">{settings.landing.features.length + settings.landing.workflow.length}</div>
              <p className="text-xs text-slate-500">Features + workflow entries</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Custom Pages</div>
              <div className="mt-1 text-lg font-bold text-slate-900">{pages.length}</div>
              <p className="text-xs text-slate-500">Managed under `/p/[slug]`</p>
            </div>
          </section>

          {message ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div>
          ) : null}

          <Panel id="payment" icon={CircleDollarSign} title="Payment" subtitle="Global payment behavior and checkout price">
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              Configure the amount users pay to unlock a search and access locked sections/download features.
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Toggle label="Enable payment locking" checked={settings.paymentEnabled} onChange={(v) => setSettings((p) => ({ ...p, paymentEnabled: v }))} />
              <TextInput label="Price per search" value={settings.payment.amount} onChange={(v) => setSettings((p) => ({ ...p, payment: { ...p.payment, amount: v } }))} />
              <TextInput label="Currency" value={settings.payment.currency} onChange={(v) => setSettings((p) => ({ ...p, payment: { ...p.payment, currency: v.toUpperCase() } }))} />
            </div>
          </Panel>

          <Panel id="locks" icon={Lock} title="Section Locks" subtitle="Enable or disable premium lock per section">
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              Fine-grained access control for each report section. Enabled means users must pay first.
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {(Object.entries(settings.lockSections) as Array<[keyof PublicSiteSettings["lockSections"], boolean]>).map(([key, value]) => (
                <Toggle key={key} label={key} checked={value} onChange={(v) => setSettings((p) => ({ ...p, lockSections: { ...p.lockSections, [key]: v } }))} />
              ))}
            </div>
          </Panel>

          <Panel id="navigation" icon={Eye} title="Header & Navigation" subtitle="Control what appears in site navigation">
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              Toggle visibility of navigation items and account entry points from the public header.
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <Toggle label="Show features link" checked={settings.ui.showFeaturesLink} onChange={(v) => setSettings((p) => ({ ...p, ui: { ...p.ui, showFeaturesLink: v } }))} />
              <Toggle label="Show sample link" checked={settings.ui.showSampleLink} onChange={(v) => setSettings((p) => ({ ...p, ui: { ...p.ui, showSampleLink: v } }))} />
              <Toggle label="Show pricing link" checked={settings.ui.showPricingLink} onChange={(v) => setSettings((p) => ({ ...p, ui: { ...p.ui, showPricingLink: v } }))} />
              <Toggle label="Show login button" checked={settings.ui.showLoginButton} onChange={(v) => setSettings((p) => ({ ...p, ui: { ...p.ui, showLoginButton: v } }))} />
            </div>
          </Panel>

          <Panel id="content" icon={Settings2} title="Global Content" subtitle="Branding, hero and CTA text">
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              Main site copy, hero messaging, footer description, and brand name updates.
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <TextInput label="Platform name" value={settings.content.platformName} onChange={(v) => setSettings((p) => ({ ...p, content: { ...p.content, platformName: v } }))} />
              <TextInput label="Hero image URL" value={settings.content.landingHeroImageUrl} onChange={(v) => setSettings((p) => ({ ...p, content: { ...p.content, landingHeroImageUrl: v } }))} />
              <TextInput label="Hero title line 1" value={settings.content.landingHeroTitleA} onChange={(v) => setSettings((p) => ({ ...p, content: { ...p.content, landingHeroTitleA: v } }))} />
              <TextInput label="Hero title line 2" value={settings.content.landingHeroTitleB} onChange={(v) => setSettings((p) => ({ ...p, content: { ...p.content, landingHeroTitleB: v } }))} />
              <TextArea label="Hero subtitle" rows={2} value={settings.content.landingHeroSubtitle} onChange={(v) => setSettings((p) => ({ ...p, content: { ...p.content, landingHeroSubtitle: v } }))} />
              <TextArea label="Footer description" rows={2} value={settings.content.footerDescription} onChange={(v) => setSettings((p) => ({ ...p, content: { ...p.content, footerDescription: v } }))} />
              <TextInput label="CTA title" value={settings.content.landingCtaTitle} onChange={(v) => setSettings((p) => ({ ...p, content: { ...p.content, landingCtaTitle: v } }))} />
              <TextInput label="CTA button label" value={settings.content.landingCtaButton} onChange={(v) => setSettings((p) => ({ ...p, content: { ...p.content, landingCtaButton: v } }))} />
              <div className="md:col-span-2">
                <TextArea label="CTA subtitle" rows={2} value={settings.content.landingCtaSubtitle} onChange={(v) => setSettings((p) => ({ ...p, content: { ...p.content, landingCtaSubtitle: v } }))} />
              </div>
            </div>
          </Panel>

          <Panel id="components" icon={LayoutGrid} title="Landing Components" subtitle="Add/remove feature cards, workflow steps, and footer columns">
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              Manage modular landing page blocks. Add, remove, and reorder content quickly through structured forms.
            </div>
            <div className="mb-4 grid gap-2 md:grid-cols-3">
              <Toggle label="Show features section" checked={settings.landing.sectionVisibility.features} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, sectionVisibility: { ...p.landing.sectionVisibility, features: v } } }))} />
              <Toggle label="Show workflow section" checked={settings.landing.sectionVisibility.workflow} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, sectionVisibility: { ...p.landing.sectionVisibility, workflow: v } } }))} />
              <Toggle label="Show CTA section" checked={settings.landing.sectionVisibility.cta} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, sectionVisibility: { ...p.landing.sectionVisibility, cta: v } } }))} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <TextInput label="Top badge text" value={settings.landing.badgeTop} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, badgeTop: v } }))} />
              <TextInput label="Trusted sources label" value={settings.landing.trustedSourcesLabel} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, trustedSourcesLabel: v } }))} />
              <TextInput label="Features section label" value={settings.landing.featureSectionLabel} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, featureSectionLabel: v } }))} />
              <TextInput label="Features section title" value={settings.landing.featureSectionTitle} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, featureSectionTitle: v } }))} />
              <TextInput label="Workflow section label" value={settings.landing.howSectionLabel} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, howSectionLabel: v } }))} />
              <TextInput label="Workflow section title" value={settings.landing.howSectionTitle} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, howSectionTitle: v } }))} />
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Feature Cards</h3>
              <div className="space-y-2">
                {settings.landing.features.map((item, index) => (
                  <div key={item.id} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-4">
                    <select
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                      value={item.icon}
                      onChange={(e) => {
                        const next = [...settings.landing.features];
                        next[index] = { ...next[index], icon: e.target.value };
                        setSettings((p) => ({ ...p, landing: { ...p.landing, features: next } }));
                      }}
                    >
                      {iconOptions.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                    </select>
                    <input
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                      value={item.title}
                      onChange={(e) => {
                        const next = [...settings.landing.features];
                        next[index] = { ...next[index], title: e.target.value };
                        setSettings((p) => ({ ...p, landing: { ...p.landing, features: next } }));
                      }}
                    />
                    <input
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm md:col-span-2"
                      value={item.desc}
                      onChange={(e) => {
                        const next = [...settings.landing.features];
                        next[index] = { ...next[index], desc: e.target.value };
                        setSettings((p) => ({ ...p, landing: { ...p.landing, features: next } }));
                      }}
                    />
                    <button
                      type="button"
                      className="rounded-lg border border-red-300 bg-white px-2 py-1 text-xs text-red-700 md:col-span-4"
                      onClick={() => {
                        const next = settings.landing.features.filter((_, i) => i !== index);
                        setSettings((p) => ({ ...p, landing: { ...p.landing, features: next } }));
                      }}
                    >
                      Remove card
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  onClick={() => {
                    const next = [...settings.landing.features, { id: String(Date.now()), icon: "Sparkles", title: "New feature", desc: "Describe this feature." }];
                    setSettings((p) => ({ ...p, landing: { ...p.landing, features: next } }));
                  }}
                >
                  Add feature card
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Workflow Steps</h3>
              <div className="space-y-2">
                {settings.landing.workflow.map((item, index) => (
                  <div key={item.id} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                      value={item.title}
                      onChange={(e) => {
                        const next = [...settings.landing.workflow];
                        next[index] = { ...next[index], title: e.target.value };
                        setSettings((p) => ({ ...p, landing: { ...p.landing, workflow: next } }));
                      }}
                    />
                    <input
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                      value={item.desc}
                      onChange={(e) => {
                        const next = [...settings.landing.workflow];
                        next[index] = { ...next[index], desc: e.target.value };
                        setSettings((p) => ({ ...p, landing: { ...p.landing, workflow: next } }));
                      }}
                    />
                    <button
                      type="button"
                      className="rounded-lg border border-red-300 bg-white px-2 py-1 text-xs text-red-700 md:col-span-2"
                      onClick={() => {
                        const next = settings.landing.workflow.filter((_, i) => i !== index);
                        setSettings((p) => ({ ...p, landing: { ...p.landing, workflow: next } }));
                      }}
                    >
                      Remove step
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  onClick={() => {
                    const next = [...settings.landing.workflow, { id: String(Date.now()), title: "Nieuwe stap", desc: "Beschrijving van de stap." }];
                    setSettings((p) => ({ ...p, landing: { ...p.landing, workflow: next } }));
                  }}
                >
                  Add workflow step
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Footer Columns</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <TextInput label="Product title" value={settings.landing.footer.productTitle} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, footer: { ...p.landing.footer, productTitle: v } } }))} />
                <TextInput label="Company title" value={settings.landing.footer.companyTitle} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, footer: { ...p.landing.footer, companyTitle: v } } }))} />
                <TextInput label="Legal title" value={settings.landing.footer.legalTitle} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, footer: { ...p.landing.footer, legalTitle: v } } }))} />
                <TextArea label="Product links (one per line)" rows={5} value={settings.landing.footer.productLinks.join("\n")} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, footer: { ...p.landing.footer, productLinks: v.split("\n").map((x) => x.trim()).filter(Boolean) } } }))} />
                <TextArea label="Company links (one per line)" rows={5} value={settings.landing.footer.companyLinks.join("\n")} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, footer: { ...p.landing.footer, companyLinks: v.split("\n").map((x) => x.trim()).filter(Boolean) } } }))} />
                <TextArea label="Legal links (one per line)" rows={5} value={settings.landing.footer.legalLinks.join("\n")} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, footer: { ...p.landing.footer, legalLinks: v.split("\n").map((x) => x.trim()).filter(Boolean) } } }))} />
              </div>
            </div>
          </Panel>

          <Panel id="pages" icon={FileText} title="Custom Pages" subtitle="Create and manage pages under /p/[slug]">
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              Build dynamic content pages and decide if each page appears in header/footer menus.
            </div>
            <div className="mb-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
              <TextInput label="Title" value={newPage.title} onChange={(v) => setNewPage((p) => ({ ...p, title: v }))} />
              <TextInput label="Slug (optional)" value={newPage.slug} onChange={(v) => setNewPage((p) => ({ ...p, slug: v }))} />
              <div className="md:col-span-2">
                <TextArea label="Content" rows={4} value={newPage.content} onChange={(v) => setNewPage((p) => ({ ...p, content: v }))} />
              </div>
              <Toggle label="Published" checked={newPage.published} onChange={(v) => setNewPage((p) => ({ ...p, published: v }))} />
              <Toggle label="Show in header" checked={newPage.showInHeader} onChange={(v) => setNewPage((p) => ({ ...p, showInHeader: v }))} />
              <Toggle label="Show in footer" checked={newPage.showInFooter} onChange={(v) => setNewPage((p) => ({ ...p, showInFooter: v }))} />
              <button type="button" className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white" onClick={createPage}>Create page</button>
            </div>

            {pagesLoading ? <p className="text-sm text-slate-500">Loading pages...</p> : null}
            <div className="space-y-3">
              {pages.filter((page) => !legalSlugs.has(page.slug)).map((page) => (
                <div key={page._id} className="rounded-xl border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-800">{page.title} <span className="font-normal text-slate-400">/p/{page.slug}</span></div>
                    <div className="flex items-center gap-2">
                      <Link href={`/p/${page.slug}`} className="text-xs text-brand-700 underline" target="_blank">
                        Open
                      </Link>
                      <button type="button" className="text-xs text-red-700" onClick={() => deletePage(page._id)}>Delete</button>
                    </div>
                  </div>
                  <textarea
                    className="mb-2 w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    rows={3}
                    value={page.content}
                    onChange={(e) => setPages((prev) => prev.map((p) => (p._id === page._id ? { ...p, content: e.target.value } : p)))}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Toggle label="Published" checked={page.published} onChange={(v) => setPages((prev) => prev.map((p) => (p._id === page._id ? { ...p, published: v } : p)))} />
                    <Toggle label="Header" checked={page.showInHeader} onChange={(v) => setPages((prev) => prev.map((p) => (p._id === page._id ? { ...p, showInHeader: v } : p)))} />
                    <Toggle label="Footer" checked={page.showInFooter} onChange={(v) => setPages((prev) => prev.map((p) => (p._id === page._id ? { ...p, showInFooter: v } : p)))} />
                    <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs" onClick={() => updatePage(page._id, page)}>Save page</button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </main>
      </div>
    </div>
  );
}
