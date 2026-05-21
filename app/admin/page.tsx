"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Palette,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Sparkles,
  CheckCircle,
  TrendingUp,
  Trash2,
  Users,
  X,
  Eye,
} from "lucide-react";
import type { PublicSiteSettings } from "@/lib/site-settings/defaults";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ─────────────────────── Types ───────────────────────
type SessionResponse = { authenticated: boolean; admin?: { id: string; email: string } };
type AdminUser = { _id: string; email: string; createdAt: string; savedVehicles: number; reports: number; payments: number };
type CmsPage = { _id: string; title: string; slug: string; content: string; published: boolean; showInHeader: boolean; showInFooter: boolean };
type AnalyticsResponse = {
  range?: "7d" | "30d" | "all";
  searchesByDay: Array<{ day: string; count: number }>;
  topPlates: Array<{ plate: string; count: number }>;
  recentSearches: Array<{ plate: string; userId: string | null; resultFrom: "cache" | "api"; createdAt: string }>;
  sectionTotals: Array<{ section: string; totalMs: number; views: number }>;
  sectionHeatmap: Array<{ day: string; section: string; totalMs: number; views: number }>;
  pagination?: {
    top: { page: number; limit: number; total: number; hasMore: boolean };
    recent: { page: number; limit: number; total: number; hasMore: boolean };
    section: { page: number; limit: number; total: number; hasMore: boolean };
    heatmap: { page: number; limit: number; total: number; hasMore: boolean };
  };
};
type PaymentAnalyticsResponse = {
  range: "7d" | "30d" | "all";
  summary: {
    totalOrders: number;
    completedOrders: number;
    conversionRate: number;
    totalRevenue: number;
    discountedCount: number;
  };
  topPromoCodes: Array<{ code: string; count: number }>;
  transactions: Array<{
    id: string;
    plate: string;
    email: string | null;
    amount: string;
    currency: string;
    promoCode: string | null;
    discountType: string | null;
    discountValue: string | null;
    createdAt: string;
  }>;
  pagination: { page: number; limit: number; total: number; hasMore: boolean };
};

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  children?: { id: string; label: string }[];
};

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  {
    id: "content",
    label: "Content",
    icon: BookOpen,
    children: [
      { id: "landing", label: "Landing Page" },
      { id: "pages", label: "Custom Pages" },
    ],
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
    children: [
      { id: "brand", label: "Colors & Brand" },
      { id: "nav-ui", label: "Navigation & UI" },
    ],
  },
  {
    id: "commerce",
    label: "Commerce",
    icon: CircleDollarSign,
    children: [
      { id: "payment", label: "Payment" },
      { id: "locks", label: "Section Locks" },
    ],
  },
  {
    id: "site",
    label: "Site Settings",
    icon: Settings2,
    children: [
      { id: "seo", label: "SEO & Meta" },
      { id: "email", label: "Email Templates" },
    ],
  },
  { id: "users", label: "Users", icon: Users },
];

// ─────────────────────── Defaults ───────────────────────
const emptySettings: PublicSiteSettings = {
  paymentEnabled: true,
  payment: {
    amount: "9.95",
    currency: "EUR",
    allowBypassPayment: false,
    specialDiscountEnabled: false,
    specialDiscountPercent: 10,
    promoCodes: []
  },
  lockSections: { riskOverview: true, mileageHistory: true, marketAnalysis: true, vehicleComparison: true, damageHistory: true, technicalSpecs: false, inspectionTimeline: false, ownershipHistory: false, reportDownload: true },
  ui: { showFeaturesLink: true, showSampleLink: true, showPricingLink: true, showLoginButton: true },
  content: { platformName: "Kentekenrapport", landingHeroTitleA: "", landingHeroTitleB: "", landingHeroSubtitle: "", landingCtaTitle: "", landingCtaSubtitle: "", landingCtaButton: "", landingCtaUrl: "", landingHeroImageUrl: "", footerDescription: "" },
  landing: { badgeTop: "", trustedSourcesLabel: "", featureSectionLabel: "", featureSectionTitle: "", howSectionLabel: "", howSectionTitle: "", sectionVisibility: { features: true, workflow: true, cta: true }, features: [], workflow: [], footer: { productTitle: "Product", companyTitle: "Company", legalTitle: "Legal", productLinks: [], companyLinks: [], legalLinks: [] } },
  seo: { metaTitle: "", metaDescription: "", ogImage: "", googleAnalyticsId: "", microsoftClarityId: "", faviconUrl: "" },
  appearance: { primaryColor: "#2563eb", accentColor: "#dbeafe", fontFamily: "Inter", logoUrl: "", logoText: "Kentekenrapport" },
  email: { fromName: "Kentekenrapport", fromAddress: "noreply@kentekenrapport.nl", reportSubjectNl: "", reportSubjectEn: "", welcomeBodyNl: "", welcomeBodyEn: "" },
};

// ─────────────────────── Micro Components ───────────────────────
function Input({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-300">{label}</span>
      <input type={type} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:bg-white/8 focus:ring-1 focus:ring-blue-500/50" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function Textarea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-300">{label}</span>
      <textarea rows={rows} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:bg-white/8 focus:ring-1 focus:ring-blue-500/50 resize-none" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/8 bg-white/4 px-4 py-3 transition hover:border-white/15 hover:bg-white/7">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        {description && <div className="mt-0.5 text-xs text-slate-400">{description}</div>}
      </div>
      <div className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-slate-600"}`} onClick={() => onChange(!checked)}>
        <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? "left-6" : "left-1"}`} />
      </div>
    </label>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  void title;
  void subtitle;
  return null;
}

/* Legacy section heading kept intentionally disabled to avoid duplicate page titles.
function SectionTitleLegacy({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
    </div>
  );
}
*/

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 p-5 ${className}`}>
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 to-white/4 p-5">
      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  );
}

function slugifyClient(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function reorder<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

// ─────────────────────── Main Component ───────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [settings, setSettings] = useState<PublicSiteSettings>(emptySettings);
  const [savedSettings, setSavedSettings] = useState<PublicSiteSettings>(emptySettings);
  const [hasDraft, setHasDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [paymentAnalyticsLoading, setPaymentAnalyticsLoading] = useState(false);
  const [dashboardChartLoading, setDashboardChartLoading] = useState(false);
  const [dashboardRange, setDashboardRange] = useState<"7d" | "30d" | "all">("7d");
  const [dashboardSearchesByDay, setDashboardSearchesByDay] = useState<Array<{ day: string; count: number }>>([]);
  const [analyticsRange, setAnalyticsRange] = useState<"7d" | "30d" | "all">("7d");
  const [paymentAnalyticsRange, setPaymentAnalyticsRange] = useState<"7d" | "30d" | "all">("7d");
  const [paymentAnalyticsPage, setPaymentAnalyticsPage] = useState(1);
  const [paymentAnalytics, setPaymentAnalytics] = useState<PaymentAnalyticsResponse>({
    range: "7d",
    summary: { totalOrders: 0, completedOrders: 0, conversionRate: 0, totalRevenue: 0, discountedCount: 0 },
    topPromoCodes: [],
    transactions: [],
    pagination: { page: 1, limit: 20, total: 0, hasMore: false }
  });
  const [analyticsTab, setAnalyticsTab] = useState<"searches" | "engagement">("searches");
  const [analyticsView, setAnalyticsView] = useState<"overview" | "top-plates" | "recent-searches" | "section-totals" | "section-heatmap">("overview");
  const [topPage, setTopPage] = useState(1);
  const [recentPage, setRecentPage] = useState(1);
  const [sectionPage, setSectionPage] = useState(1);
  const [heatmapPage, setHeatmapPage] = useState(1);
  const [analytics, setAnalytics] = useState<AnalyticsResponse>({
    searchesByDay: [],
    topPlates: [],
    recentSearches: [],
    sectionTotals: [],
    sectionHeatmap: [],
    pagination: {
      top: { page: 1, limit: 20, total: 0, hasMore: false },
      recent: { page: 1, limit: 30, total: 0, hasMore: false },
      section: { page: 1, limit: 20, total: 0, hasMore: false },
      heatmap: { page: 1, limit: 40, total: 0, hasMore: false }
    }
  });
  const [userSearch, setUserSearch] = useState("");
  const [pageSearch, setPageSearch] = useState("");
  const [pagesPage, setPagesPage] = useState(1);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [expandedNav, setExpandedNav] = useState<string[]>(["content", "commerce"]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newPage, setNewPage] = useState({ title: "", slug: "", content: "", published: false, showInHeader: false, showInFooter: false });
  const [newPageSlugTouched, setNewPageSlugTouched] = useState(false);
  const recentSentinelRef = useRef<HTMLDivElement | null>(null);
  const heatmapSentinelRef = useRef<HTMLDivElement | null>(null);
  const dragFeatureIndexRef = useRef<number | null>(null);
  const dragWorkflowIndexRef = useRef<number | null>(null);
  const dragFooterIndexRef = useRef<{ group: "productLinks" | "companyLinks" | "legalLinks"; index: number } | null>(null);

  const legalSlugs = useMemo(() => new Set(["privacy-policy", "terms-and-conditions"]), []);
  const iconOptions = useMemo(() => ["CarFront", "Gauge", "TrendingUp", "Users", "FileCheck", "FileSpreadsheet", "Sparkles", "ShieldCheck"], []);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      const sessionRes = await fetch("/api/admin/session", { cache: "no-store" });
      if (!sessionRes.ok) { router.replace("/admin/login"); return; }
      const session = (await sessionRes.json()) as SessionResponse;
      if (!session.authenticated || !session.admin) { router.replace("/admin/login"); return; }
      const [settingsRes, pagesRes] = await Promise.all([
        fetch("/api/admin/settings", { cache: "no-store" }),
        fetch("/api/admin/pages", { cache: "no-store" }),
      ]);
      const usersRes = await fetch("/api/admin/users?page=1", { cache: "no-store" });
      if (!settingsRes.ok) { router.replace("/admin/login"); return; }
      const settingsPayload = (await settingsRes.json()) as PublicSiteSettings;
      const pagesPayload = pagesRes.ok ? (await pagesRes.json()) as CmsPage[] : [];
      const usersPayload = usersRes.ok
        ? (await usersRes.json()) as { items: AdminUser[]; total: number }
        : { items: [], total: 0 };
      if (!active) return;
      setAdminEmail(session.admin.email);
      setSettings(settingsPayload);
      setSavedSettings(settingsPayload);
      const draftRaw = localStorage.getItem("admin_settings_draft_v1");
      if (draftRaw) setHasDraft(true);
      setPages(pagesPayload);
      setUsers(usersPayload.items);
      setUsersTotal(usersPayload.total);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [router]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    const res = await fetch("/api/admin/users?page=1", { cache: "no-store" });
    if (res.ok) {
      const payload = (await res.json()) as { items: AdminUser[]; total: number };
      setUsers(payload.items);
      setUsersTotal(payload.total);
    }
    setUsersLoading(false);
  }, []);

  const loadAnalytics = useCallback(async (opts?: {
    range?: "7d" | "30d" | "all";
    topPage?: number;
    recentPage?: number;
    sectionPage?: number;
    heatmapPage?: number;
    appendRecent?: boolean;
    appendHeatmap?: boolean;
  }) => {
    const nextRange = opts?.range ?? analyticsRange;
    const nextTopPage = opts?.topPage ?? topPage;
    const nextRecentPage = opts?.recentPage ?? recentPage;
    const nextSectionPage = opts?.sectionPage ?? sectionPage;
    const nextHeatmapPage = opts?.heatmapPage ?? heatmapPage;

    setAnalyticsLoading(true);
    const params = new URLSearchParams({
      range: nextRange,
      topPage: String(nextTopPage),
      topLimit: "20",
      recentPage: String(nextRecentPage),
      recentLimit: "30",
      sectionPage: String(nextSectionPage),
      sectionLimit: "20",
      heatmapPage: String(nextHeatmapPage),
      heatmapLimit: "40"
    });
    const res = await fetch(`/api/admin/analytics?${params.toString()}`, { cache: "no-store" });
    if (res.ok) {
      const payload = (await res.json()) as AnalyticsResponse;
      setAnalytics((prev) => ({
        ...payload,
        recentSearches: opts?.appendRecent
          ? [...prev.recentSearches, ...payload.recentSearches]
          : payload.recentSearches,
        sectionHeatmap: opts?.appendHeatmap
          ? [...prev.sectionHeatmap, ...payload.sectionHeatmap]
          : payload.sectionHeatmap
      }));
      setAnalyticsRange(nextRange);
      setTopPage(nextTopPage);
      setRecentPage(nextRecentPage);
      setSectionPage(nextSectionPage);
      setHeatmapPage(nextHeatmapPage);
    }
    setAnalyticsLoading(false);
  }, [analyticsRange, topPage, recentPage, sectionPage, heatmapPage]);

  const loadDashboardChart = useCallback(async (range?: "7d" | "30d" | "all") => {
    const nextRange = range ?? dashboardRange;
    setDashboardChartLoading(true);
    const params = new URLSearchParams({
      range: nextRange,
      topPage: "1",
      topLimit: "1",
      recentPage: "1",
      recentLimit: "1",
      sectionPage: "1",
      sectionLimit: "1",
      heatmapPage: "1",
      heatmapLimit: "1"
    });
    const res = await fetch(`/api/admin/analytics?${params.toString()}`, { cache: "no-store" });
    if (res.ok) {
      const payload = (await res.json()) as AnalyticsResponse;
      setDashboardSearchesByDay(payload.searchesByDay);
      setDashboardRange(nextRange);
    }
    setDashboardChartLoading(false);
  }, [dashboardRange]);

  const loadPaymentAnalytics = useCallback(async (opts?: { range?: "7d" | "30d" | "all"; page?: number }) => {
    const nextRange = opts?.range ?? paymentAnalyticsRange;
    const nextPage = opts?.page ?? paymentAnalyticsPage;
    setPaymentAnalyticsLoading(true);
    const params = new URLSearchParams({
      range: nextRange,
      page: String(nextPage),
      limit: "20"
    });
    const res = await fetch(`/api/admin/payments/analytics?${params.toString()}`, { cache: "no-store" });
    if (res.ok) {
      const payload = (await res.json()) as PaymentAnalyticsResponse;
      setPaymentAnalytics(payload);
      setPaymentAnalyticsRange(nextRange);
      setPaymentAnalyticsPage(nextPage);
    }
    setPaymentAnalyticsLoading(false);
  }, [paymentAnalyticsRange, paymentAnalyticsPage]);

  useEffect(() => {
    if (activeSection === "users") void loadUsers();
  }, [activeSection, loadUsers]);

  useEffect(() => {
    setPagesPage(1);
  }, [pageSearch]);

  useEffect(() => {
    if (newPageSlugTouched) return;
    setNewPage((prev) => ({ ...prev, slug: slugifyClient(prev.title) }));
  }, [newPage.title, newPageSlugTouched]);

  useEffect(() => {
    if (loading) return;
    localStorage.setItem("admin_settings_draft_v1", JSON.stringify(settings));
    setHasDraft(true);
  }, [settings, loading]);

  useEffect(() => {
    if (activeSection === "dashboard" || activeSection === "analytics") void loadAnalytics();
  }, [activeSection, loadAnalytics]);

  useEffect(() => {
    if (activeSection === "dashboard") void loadDashboardChart();
  }, [activeSection, loadDashboardChart]);

  useEffect(() => {
    if (activeSection === "payment") void loadPaymentAnalytics();
  }, [activeSection, loadPaymentAnalytics]);

  useEffect(() => {
    if (activeSection !== "analytics" || analyticsTab !== "searches") return;
    const node = recentSentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (!first?.isIntersecting) return;
      if (!analytics.pagination?.recent.hasMore || analyticsLoading) return;
      void loadAnalytics({ recentPage: recentPage + 1, appendRecent: true });
    }, { rootMargin: "200px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeSection, analyticsTab, analytics.pagination?.recent.hasMore, analyticsLoading, loadAnalytics, recentPage]);

  useEffect(() => {
    if (activeSection !== "analytics" || analyticsTab !== "engagement") return;
    const node = heatmapSentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (!first?.isIntersecting) return;
      if (!analytics.pagination?.heatmap.hasMore || analyticsLoading) return;
      void loadAnalytics({ heatmapPage: heatmapPage + 1, appendHeatmap: true });
    }, { rootMargin: "200px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeSection, analyticsTab, analytics.pagination?.heatmap.hasMore, analyticsLoading, loadAnalytics, heatmapPage]);

  const saveSettings = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    setSaving(false);
    if (res.ok) {
      setSavedSettings(settings);
      localStorage.removeItem("admin_settings_draft_v1");
      setHasDraft(false);
      showToast("success", "All changes saved successfully.");
    }
    else { showToast("error", "Failed to save settings. Please try again."); }
  };

  const discardUnsavedSettings = () => {
    setSettings(savedSettings);
    showToast("success", "Unsaved changes were discarded.");
  };

  const restoreDraftSettings = () => {
    const draftRaw = localStorage.getItem("admin_settings_draft_v1");
    if (!draftRaw) {
      showToast("error", "No saved draft found.");
      return;
    }
    try {
      const parsed = JSON.parse(draftRaw) as PublicSiteSettings;
      setSettings(parsed);
      showToast("success", "Draft restored.");
    } catch {
      showToast("error", "Draft is invalid and could not be restored.");
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  const createPage = async () => {
    const payload = { ...newPage, slug: newPageSlug };
    const res = await fetch("/api/admin/pages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
      setNewPage({ title: "", slug: "", content: "", published: false, showInHeader: false, showInFooter: false });
      setNewPageSlugTouched(false);
      const pagesRes = await fetch("/api/admin/pages", { cache: "no-store" });
      if (pagesRes.ok) setPages((await pagesRes.json()) as CmsPage[]);
      showToast("success", "Page created successfully.");
    } else {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      showToast("error", payload.error ?? "Failed to create page.");
    }
  };

  const updatePage = async (id: string, patch: Partial<CmsPage>) => {
    const res = await fetch(`/api/admin/pages/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      showToast("error", payload.error ?? "Failed to update page.");
      return;
    }
    const pagesRes = await fetch("/api/admin/pages", { cache: "no-store" });
    if (pagesRes.ok) setPages((await pagesRes.json()) as CmsPage[]);
    showToast("success", "Page updated.");
  };

  const deletePage = async (id: string) => {
    const selected = pages.find((p) => p._id === id);
    if (selected && legalSlugs.has(selected.slug)) { showToast("error", "Legal pages cannot be deleted."); return; }
    await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
    setPages((prev) => prev.filter((p) => p._id !== id));
    showToast("success", "Page deleted.");
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u._id !== id));
    showToast("success", "User deleted.");
  };

  const toggleNav = (id: string) => {
    setExpandedNav((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const navigate = (id: string) => {
    setActiveSection(id);
    setSidebarOpen(false);
  };

  const filteredUsers = users.filter((u) => u.email.toLowerCase().includes(userSearch.toLowerCase()));
  const customPages = pages.filter((p) => !legalSlugs.has(p.slug));
  const filteredCustomPages = customPages.filter((p) =>
    `${p.title} ${p.slug}`.toLowerCase().includes(pageSearch.toLowerCase())
  );
  const pageSize = 8;
  const maxPages = Math.max(1, Math.ceil(filteredCustomPages.length / pageSize));
  const currentPagesPage = Math.min(pagesPage, maxPages);
  const pagedCustomPages = filteredCustomPages.slice((currentPagesPage - 1) * pageSize, currentPagesPage * pageSize);
  const newPageSlug = slugifyClient((newPage.slug || newPage.title).trim());
  const newPageSlugTaken = customPages.some((p) => p.slug.toLowerCase() === newPageSlug.toLowerCase());
  const chartData = dashboardSearchesByDay.map((item) => ({
    day: dashboardRange === "7d"
      ? new Date(item.day).toLocaleDateString("en-US", { weekday: "short" })
      : new Date(item.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    searches: item.count
  }));
  const formatMinutes = (ms: number) => `${Math.round(ms / 60000)} min`;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f1e]">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
          <span className="text-sm">Loading admin panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0f1e] font-sans">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-semibold shadow-2xl backdrop-blur transition-all ${toast.type === "success" ? "border-emerald-500/30 bg-emerald-900/80 text-emerald-300" : "border-red-500/30 bg-red-900/80 text-red-300"}`}>
          {toast.type === "success" ? <Sparkles className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/8 bg-[#0d1426] transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Brand */}
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Admin</div>
              <div className="text-[10px] text-slate-500 truncate max-w-[110px]">{adminEmail}</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV.map((item) => {
            const isActive = activeSection === item.id || item.children?.some((c) => c.id === activeSection);
            const isExpanded = expandedNav.includes(item.id);
            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (item.children) { toggleNav(item.id); if (!isExpanded) navigate(item.children[0].id); }
                    else navigate(item.id);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive ? "bg-blue-600/20 text-blue-400" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.children && (
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  )}
                </button>
                {item.children && isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/8 pl-3">
                    {item.children.map((child) => (
                      <button key={child.id} onClick={() => navigate(child.id)}
                        className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition-all ${activeSection === child.id ? "bg-blue-600/15 text-blue-400 font-medium" : "text-slate-500 hover:text-white"}`}
                      >
                        <ChevronRight className="mr-1.5 h-3 w-3" /> {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-white/8 p-4 space-y-2">
          <Link href="/" target="_blank" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-all">
            <Eye className="h-4 w-4" /> View Site
          </Link>
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/8 bg-[#0a0f1e]/80 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold text-white capitalize">
              {NAV.flatMap((n) => [n, ...(n.children ?? [])]).find((n) => n.id === activeSection)?.label ?? "Admin"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/legal" className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-white/20 hover:text-white transition sm:flex">
              <BookOpen className="h-4 w-4" /> Legal Pages
            </Link>
            <button onClick={restoreDraftSettings} disabled={!hasDraft}
              className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-white/20 hover:text-white disabled:opacity-40 transition sm:flex">
              Restore Draft
            </button>
            <button onClick={discardUnsavedSettings}
              className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-white/20 hover:text-white transition sm:flex">
              Undo Changes
            </button>
            <button onClick={saveSettings} disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow shadow-blue-500/20 hover:bg-blue-500 disabled:opacity-60 transition">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto px-6 py-8">

          {/* ── DASHBOARD ── */}
          {activeSection === "dashboard" && (
            <div className="space-y-6">
              <SectionTitle title="Dashboard" subtitle="Platform overview and quick stats" />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={Users} label="Total users" value={usersTotal} color="bg-blue-600" />
                <StatCard icon={CircleDollarSign} label="Payment enabled" value={settings.paymentEnabled ? `${settings.payment.amount} ${settings.payment.currency}` : "Disabled"} color="bg-emerald-600" />
                <StatCard icon={Lock} label="Locked sections" value={Object.values(settings.lockSections).filter(Boolean).length} color="bg-purple-600" />
                <StatCard icon={FileText} label="Custom pages" value={pages.length} color="bg-amber-600" />
              </div>
              <Card>
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <BarChart3 className="h-4 w-4 text-blue-400" /> Search activity (last 7 days)
                </div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {[
                    { key: "7d", label: "1 Week" },
                    { key: "30d", label: "30 Days" },
                    { key: "all", label: "All Time" }
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => void loadDashboardChart(item.key as "7d" | "30d" | "all")}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                        dashboardRange === item.key
                          ? "bg-blue-600 text-white"
                          : "border border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                {dashboardChartLoading ? (
                  <div className="py-8 text-sm text-slate-500">Loading chart...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }} />
                      <Bar dataKey="searches" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
              <Card>
                <div className="mb-3 text-sm font-semibold text-white">Latest Users</div>
                <div className="space-y-2">
                  {users.length === 0 ? (
                    <div className="text-sm text-slate-500">No users found yet.</div>
                  ) : (
                    users.slice(0, 8).map((u) => (
                      <div key={u._id} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/4 px-3 py-2.5">
                        <span className="truncate text-sm text-white">{u.email}</span>
                        <span className="ml-3 whitespace-nowrap text-xs text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString("nl-NL")}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
              <Card>
                <div className="mb-3 text-sm font-semibold text-white">Platform Identity</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Name</span><span className="font-medium text-white">{settings.content.platformName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Primary color</span><span className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ background: settings.appearance.primaryColor }} /><span className="font-medium text-white">{settings.appearance.primaryColor}</span></span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Font</span><span className="font-medium text-white">{settings.appearance.fontFamily}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Payment</span><span className={`font-medium ${settings.paymentEnabled ? "text-emerald-400" : "text-red-400"}`}>{settings.paymentEnabled ? "Active" : "Disabled"}</span></div>
                </div>
              </Card>
            </div>
          )}

          {/* ── BRAND ── */}
          {activeSection === "brand" && (
            <div className="space-y-6">
              <SectionTitle title="Colors & Brand" subtitle="Customize the visual identity of your platform" />
              <Card>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm">
                      <span className="mb-1.5 block font-medium text-slate-300">Primary Color</span>
                      <div className="flex items-center gap-3">
                        <input type="color" className="h-10 w-16 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0.5" value={settings.appearance.primaryColor} onChange={(e) => setSettings((p) => ({ ...p, appearance: { ...p.appearance, primaryColor: e.target.value } }))} />
                        <input className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" value={settings.appearance.primaryColor} onChange={(e) => setSettings((p) => ({ ...p, appearance: { ...p.appearance, primaryColor: e.target.value } }))} />
                      </div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm">
                      <span className="mb-1.5 block font-medium text-slate-300">Accent Color</span>
                      <div className="flex items-center gap-3">
                        <input type="color" className="h-10 w-16 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0.5" value={settings.appearance.accentColor} onChange={(e) => setSettings((p) => ({ ...p, appearance: { ...p.appearance, accentColor: e.target.value } }))} />
                        <input className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" value={settings.appearance.accentColor} onChange={(e) => setSettings((p) => ({ ...p, appearance: { ...p.appearance, accentColor: e.target.value } }))} />
                      </div>
                    </label>
                  </div>
                  <Input label="Logo Text" value={settings.appearance.logoText} onChange={(v) => setSettings((p) => ({ ...p, appearance: { ...p.appearance, logoText: v } }))} placeholder="Kentekenrapport" />
                  <Input label="Logo Image URL (optional)" value={settings.appearance.logoUrl} onChange={(v) => setSettings((p) => ({ ...p, appearance: { ...p.appearance, logoUrl: v } }))} placeholder="https://..." />
                  <div className="md:col-span-2">
                    <label className="block text-sm">
                      <span className="mb-1.5 block font-medium text-slate-300">Font Family</span>
                      <select className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" value={settings.appearance.fontFamily} onChange={(e) => setSettings((p) => ({ ...p, appearance: { ...p.appearance, fontFamily: e.target.value } }))}>
                        {["Inter", "Outfit", "Roboto", "DM Sans", "Plus Jakarta Sans"].map((f) => <option key={f} value={f} className="bg-slate-800">{f}</option>)}
                      </select>
                    </label>
                  </div>
                </div>
                <div className="mt-5 rounded-xl border border-white/8 bg-white/4 p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Preview</div>
                  <button className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow" style={{ background: settings.appearance.primaryColor }}>
                    {settings.appearance.logoText}
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* ── NAV UI ── */}
          {activeSection === "nav-ui" && (
            <div className="space-y-6">
              <SectionTitle title="Navigation & UI" subtitle="Control what appears in site navigation" />
              <Card>
                <div className="grid gap-3 md:grid-cols-2">
                  <Toggle label="Show Features link" checked={settings.ui.showFeaturesLink} onChange={(v) => setSettings((p) => ({ ...p, ui: { ...p.ui, showFeaturesLink: v } }))} />
                  <Toggle label="Show Sample link" checked={settings.ui.showSampleLink} onChange={(v) => setSettings((p) => ({ ...p, ui: { ...p.ui, showSampleLink: v } }))} />
                  <Toggle label="Show Pricing link" checked={settings.ui.showPricingLink} onChange={(v) => setSettings((p) => ({ ...p, ui: { ...p.ui, showPricingLink: v } }))} />
                  <Toggle label="Show Login button" checked={settings.ui.showLoginButton} onChange={(v) => setSettings((p) => ({ ...p, ui: { ...p.ui, showLoginButton: v } }))} />
                </div>
              </Card>
            </div>
          )}

          {/* ── PAYMENT ── */}
          {activeSection === "payment" && (
            <div className="space-y-6">
              <SectionTitle title="Payment Settings" subtitle="Control the paywall and checkout pricing" />
              <Card>
                <div className="grid gap-4 md:grid-cols-3">
                  <Toggle label="Enable payment locking" description="Users must pay to access premium sections" checked={settings.paymentEnabled} onChange={(v) => setSettings((p) => ({ ...p, paymentEnabled: v }))} />
                  <Input label="Price per search" value={settings.payment.amount} onChange={(v) => setSettings((p) => ({ ...p, payment: { ...p.payment, amount: v } }))} placeholder="9.95" />
                  <Input label="Currency" value={settings.payment.currency} onChange={(v) => setSettings((p) => ({ ...p, payment: { ...p.payment, currency: v.toUpperCase() } }))} placeholder="EUR" />
                </div>
                <div className="mt-4">
                  <Toggle
                    label="Allow payment bypass from admin"
                    description="When enabled, users can unlock premium without paying."
                    checked={Boolean(settings.payment.allowBypassPayment)}
                    onChange={(v) => setSettings((p) => ({ ...p, payment: { ...p.payment, allowBypassPayment: v } }))}
                  />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Toggle
                    label="Enable special discount"
                    description="Auto applies discount when no promo code is used."
                    checked={Boolean(settings.payment.specialDiscountEnabled)}
                    onChange={(v) => setSettings((p) => ({ ...p, payment: { ...p.payment, specialDiscountEnabled: v } }))}
                  />
                  <Input
                    label="Special discount (%)"
                    value={String(settings.payment.specialDiscountPercent ?? 0)}
                    onChange={(v) =>
                      setSettings((p) => ({
                        ...p,
                        payment: { ...p.payment, specialDiscountPercent: Number(v) || 0 }
                      }))
                    }
                    placeholder="10"
                    type="number"
                  />
                </div>
              </Card>

              <Card>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-white">Payment Analytics</div>
                  <div className="flex items-center gap-2">
                    {[
                      { key: "7d", label: "1 Week" },
                      { key: "30d", label: "30 Days" },
                      { key: "all", label: "All Time" }
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => void loadPaymentAnalytics({ range: item.key as "7d" | "30d" | "all", page: 1 })}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                          paymentAnalyticsRange === item.key
                            ? "bg-blue-600 text-white"
                            : "border border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-5">
                  <StatCard icon={CircleDollarSign} label="Revenue" value={`${paymentAnalytics.summary.totalRevenue.toFixed(2)} ${settings.payment.currency}`} color="bg-emerald-600" />
                  <StatCard icon={BarChart3} label="Total Orders" value={paymentAnalytics.summary.totalOrders} color="bg-indigo-600" />
                  <StatCard icon={CheckCircle} label="Completed" value={paymentAnalytics.summary.completedOrders} color="bg-blue-600" />
                  <StatCard icon={TrendingUp} label="Conversion" value={`${paymentAnalytics.summary.conversionRate}%`} color="bg-purple-600" />
                  <StatCard icon={Sparkles} label="Discounted" value={paymentAnalytics.summary.discountedCount} color="bg-amber-600" />
                </div>
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 text-sm font-semibold text-white">Top Promo Codes</div>
                  {paymentAnalytics.topPromoCodes.length === 0 ? (
                    <div className="text-sm text-slate-500">No promo code usage in selected range.</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {paymentAnalytics.topPromoCodes.map((row) => (
                        <span key={row.code} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-200">
                          {row.code} ({row.count})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                  <table className="min-w-full divide-y divide-white/10 text-sm">
                    <thead className="bg-white/5 text-slate-300">
                      <tr>
                        <th className="px-3 py-2 text-left">Plate</th>
                        <th className="px-3 py-2 text-left">Amount</th>
                        <th className="px-3 py-2 text-left">Promo</th>
                        <th className="px-3 py-2 text-left">Discount</th>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paymentAnalytics.transactions.map((tx) => (
                        <tr key={tx.id} className="bg-white/0">
                          <td className="px-3 py-2 font-mono text-slate-200">{tx.plate}</td>
                          <td className="px-3 py-2 text-slate-200">{tx.amount} {tx.currency}</td>
                          <td className="px-3 py-2 text-slate-300">{tx.promoCode ?? "-"}</td>
                          <td className="px-3 py-2 text-slate-300">{tx.discountType ? `${tx.discountType} (${tx.discountValue ?? "0.00"})` : "-"}</td>
                          <td className="px-3 py-2 text-slate-400">{tx.email ?? "-"}</td>
                          <td className="px-3 py-2 text-slate-400">{new Date(tx.createdAt).toLocaleString("nl-NL")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 disabled:opacity-50"
                    disabled={paymentAnalytics.pagination.page <= 1 || paymentAnalyticsLoading}
                    onClick={() => void loadPaymentAnalytics({ page: Math.max(1, paymentAnalytics.pagination.page - 1) })}
                  >
                    Prev
                  </button>
                  <span className="text-xs text-slate-400">Page {paymentAnalytics.pagination.page}</span>
                  <button
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 disabled:opacity-50"
                    disabled={!paymentAnalytics.pagination.hasMore || paymentAnalyticsLoading}
                    onClick={() => void loadPaymentAnalytics({ page: paymentAnalytics.pagination.page + 1 })}
                  >
                    Next
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* ── LOCKS ── */}
          {activeSection === "locks" && (
            <div className="space-y-6">
              <SectionTitle title="Section Locks" subtitle="Enable or disable premium gate per feature section" />
              <Card>
                <div className="grid gap-3 md:grid-cols-2">
                  {(Object.entries(settings.lockSections) as Array<[keyof PublicSiteSettings["lockSections"], boolean]>).map(([key, value]) => (
                    <Toggle key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())} description="Enabled = requires payment" checked={value} onChange={(v) => setSettings((p) => ({ ...p, lockSections: { ...p.lockSections, [key]: v } }))} />
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ── SEO ── */}
          {activeSection === "seo" && (
            <div className="space-y-6">
              <SectionTitle title="SEO & Meta" subtitle="Configure search engine visibility and social sharing" />
              <Card>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2"><Input label="Meta Title" value={settings.seo.metaTitle} onChange={(v) => setSettings((p) => ({ ...p, seo: { ...p.seo, metaTitle: v } }))} placeholder="Kentekenrapport - Nederlandse Inzichten" /></div>
                  <div className="md:col-span-2"><Textarea label="Meta Description" value={settings.seo.metaDescription} onChange={(v) => setSettings((p) => ({ ...p, seo: { ...p.seo, metaDescription: v } }))} rows={2} /></div>
                  <Input label="OG Image URL" value={settings.seo.ogImage} onChange={(v) => setSettings((p) => ({ ...p, seo: { ...p.seo, ogImage: v } }))} placeholder="https://..." />
                  <Input label="Google Analytics ID" value={settings.seo.googleAnalyticsId} onChange={(v) => setSettings((p) => ({ ...p, seo: { ...p.seo, googleAnalyticsId: v } }))} placeholder="G-XXXXXXXXXX" />
                  <Input label="Microsoft Clarity ID" value={settings.seo.microsoftClarityId} onChange={(v) => setSettings((p) => ({ ...p, seo: { ...p.seo, microsoftClarityId: v } }))} placeholder="xxxxxxxxxx" />
                  <div className="md:col-span-2"><Input label="Favicon URL" value={settings.seo.faviconUrl} onChange={(v) => setSettings((p) => ({ ...p, seo: { ...p.seo, faviconUrl: v } }))} placeholder="https://..." /></div>
                </div>
              </Card>
            </div>
          )}

          {/* ── EMAIL ── */}
          {activeSection === "email" && (
            <div className="space-y-6">
              <SectionTitle title="Email Templates" subtitle="Configure outgoing email sender details and content" />
              <Card>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="From Name" value={settings.email.fromName} onChange={(v) => setSettings((p) => ({ ...p, email: { ...p.email, fromName: v } }))} placeholder="Kentekenrapport" />
                  <Input label="From Email Address" value={settings.email.fromAddress} onChange={(v) => setSettings((p) => ({ ...p, email: { ...p.email, fromAddress: v } }))} placeholder="noreply@..." />
                  <Input label="Report Subject (NL)" value={settings.email.reportSubjectNl} onChange={(v) => setSettings((p) => ({ ...p, email: { ...p.email, reportSubjectNl: v } }))} />
                  <Input label="Report Subject (EN)" value={settings.email.reportSubjectEn} onChange={(v) => setSettings((p) => ({ ...p, email: { ...p.email, reportSubjectEn: v } }))} />
                  <Textarea label="Welcome Body (NL)" value={settings.email.welcomeBodyNl} onChange={(v) => setSettings((p) => ({ ...p, email: { ...p.email, welcomeBodyNl: v } }))} rows={4} />
                  <Textarea label="Welcome Body (EN)" value={settings.email.welcomeBodyEn} onChange={(v) => setSettings((p) => ({ ...p, email: { ...p.email, welcomeBodyEn: v } }))} rows={4} />
                </div>
              </Card>
            </div>
          )}

          {/* ── LANDING ── */}
          {activeSection === "landing" && (
            <div className="space-y-6">
              <SectionTitle title="Landing Page" subtitle="Edit all content on the public landing page" />

              <Card>
                <div className="mb-4 text-sm font-semibold text-white">Global Content</div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Platform name" value={settings.content.platformName} onChange={(v) => setSettings((p) => ({ ...p, content: { ...p.content, platformName: v } }))} />
                  <Input label="Hero image URL" value={settings.content.landingHeroImageUrl} onChange={(v) => setSettings((p) => ({ ...p, content: { ...p.content, landingHeroImageUrl: v } }))} />
                  <Input label="Hero title line 1" value={settings.content.landingHeroTitleA} onChange={(v) => setSettings((p) => ({ ...p, content: { ...p.content, landingHeroTitleA: v } }))} />
                  <Input label="Hero title line 2" value={settings.content.landingHeroTitleB} onChange={(v) => setSettings((p) => ({ ...p, content: { ...p.content, landingHeroTitleB: v } }))} />
                  <div className="md:col-span-2"><Textarea label="Hero subtitle" value={settings.content.landingHeroSubtitle} onChange={(v) => setSettings((p) => ({ ...p, content: { ...p.content, landingHeroSubtitle: v } }))} rows={2} /></div>
                  <Input label="CTA title" value={settings.content.landingCtaTitle} onChange={(v) => setSettings((p) => ({ ...p, content: { ...p.content, landingCtaTitle: v } }))} />
                  <Input label="CTA button label" value={settings.content.landingCtaButton} onChange={(v) => setSettings((p) => ({ ...p, content: { ...p.content, landingCtaButton: v } }))} />
                  <Input label="CTA button URL" value={settings.content.landingCtaUrl} onChange={(v) => setSettings((p) => ({ ...p, content: { ...p.content, landingCtaUrl: v } }))} placeholder="/pricing or https://..." />
                  <div className="md:col-span-2"><Textarea label="CTA subtitle" value={settings.content.landingCtaSubtitle} onChange={(v) => setSettings((p) => ({ ...p, content: { ...p.content, landingCtaSubtitle: v } }))} rows={2} /></div>
                  <div className="md:col-span-2"><Textarea label="Footer description" value={settings.content.footerDescription} onChange={(v) => setSettings((p) => ({ ...p, content: { ...p.content, footerDescription: v } }))} rows={2} /></div>
                </div>
              </Card>

              <Card>
                <div className="mb-4 text-sm font-semibold text-white">Section Labels</div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Top badge text" value={settings.landing.badgeTop} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, badgeTop: v } }))} />
                  <Input label="Trusted sources label" value={settings.landing.trustedSourcesLabel} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, trustedSourcesLabel: v } }))} />
                  <Input label="Features section label" value={settings.landing.featureSectionLabel} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, featureSectionLabel: v } }))} />
                  <Input label="Features section title" value={settings.landing.featureSectionTitle} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, featureSectionTitle: v } }))} />
                  <Input label="Workflow section label" value={settings.landing.howSectionLabel} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, howSectionLabel: v } }))} />
                  <Input label="Workflow section title" value={settings.landing.howSectionTitle} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, howSectionTitle: v } }))} />
                </div>
              </Card>

              <Card>
                <div className="mb-4 text-sm font-semibold text-white">Section Visibility</div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Toggle label="Features section" checked={settings.landing.sectionVisibility.features} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, sectionVisibility: { ...p.landing.sectionVisibility, features: v } } }))} />
                  <Toggle label="Workflow section" checked={settings.landing.sectionVisibility.workflow} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, sectionVisibility: { ...p.landing.sectionVisibility, workflow: v } } }))} />
                  <Toggle label="CTA section" checked={settings.landing.sectionVisibility.cta} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, sectionVisibility: { ...p.landing.sectionVisibility, cta: v } } }))} />
                </div>
              </Card>

              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">Feature Cards</div>
                  <button onClick={() => { const next = [...settings.landing.features, { id: String(Date.now()), icon: "Sparkles", title: "New Feature", desc: "Describe this feature." }]; setSettings((p) => ({ ...p, landing: { ...p.landing, features: next } })); }} className="rounded-lg bg-blue-600/20 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-600/30 transition">+ Add Card</button>
                </div>
                <div className="space-y-3">
                  {settings.landing.features.map((item, i) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => { dragFeatureIndexRef.current = i; }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        const from = dragFeatureIndexRef.current;
                        if (from === null) return;
                        setSettings((p) => ({ ...p, landing: { ...p.landing, features: reorder(p.landing.features, from, i) } }));
                        dragFeatureIndexRef.current = null;
                      }}
                      className="grid gap-2 rounded-xl border border-white/8 bg-white/4 p-4 md:grid-cols-4"
                    >
                      <select className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-white" value={item.icon} onChange={(e) => { const next = [...settings.landing.features]; next[i] = { ...next[i], icon: e.target.value }; setSettings((p) => ({ ...p, landing: { ...p.landing, features: next } })); }}>
                        {iconOptions.map((o) => <option key={o} value={o} className="bg-slate-800">{o}</option>)}
                      </select>
                      <input className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-white placeholder:text-slate-500" value={item.title} placeholder="Title" onChange={(e) => { const next = [...settings.landing.features]; next[i] = { ...next[i], title: e.target.value }; setSettings((p) => ({ ...p, landing: { ...p.landing, features: next } })); }} />
                      <input className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-white placeholder:text-slate-500 md:col-span-2" value={item.desc} placeholder="Description" onChange={(e) => { const next = [...settings.landing.features]; next[i] = { ...next[i], desc: e.target.value }; setSettings((p) => ({ ...p, landing: { ...p.landing, features: next } })); }} />
                      <button onClick={() => setSettings((p) => ({ ...p, landing: { ...p.landing, features: p.landing.features.filter((_, idx) => idx !== i) } }))} className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20 transition md:col-span-4"><Trash2 className="h-3 w-3" /> Remove</button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">Workflow Steps</div>
                  <button onClick={() => { const next = [...settings.landing.workflow, { id: String(Date.now()), title: "New Step", desc: "Describe this step." }]; setSettings((p) => ({ ...p, landing: { ...p.landing, workflow: next } })); }} className="rounded-lg bg-blue-600/20 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-600/30 transition">+ Add Step</button>
                </div>
                <div className="space-y-3">
                  {settings.landing.workflow.map((item, i) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => { dragWorkflowIndexRef.current = i; }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        const from = dragWorkflowIndexRef.current;
                        if (from === null) return;
                        setSettings((p) => ({ ...p, landing: { ...p.landing, workflow: reorder(p.landing.workflow, from, i) } }));
                        dragWorkflowIndexRef.current = null;
                      }}
                      className="grid gap-2 rounded-xl border border-white/8 bg-white/4 p-4 md:grid-cols-2"
                    >
                      <input className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-white" value={item.title} placeholder="Step title" onChange={(e) => { const next = [...settings.landing.workflow]; next[i] = { ...next[i], title: e.target.value }; setSettings((p) => ({ ...p, landing: { ...p.landing, workflow: next } })); }} />
                      <input className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-white" value={item.desc} placeholder="Step description" onChange={(e) => { const next = [...settings.landing.workflow]; next[i] = { ...next[i], desc: e.target.value }; setSettings((p) => ({ ...p, landing: { ...p.landing, workflow: next } })); }} />
                      <button onClick={() => setSettings((p) => ({ ...p, landing: { ...p.landing, workflow: p.landing.workflow.filter((_, idx) => idx !== i) } }))} className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20 transition md:col-span-2"><Trash2 className="h-3 w-3" /> Remove</button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="mb-4 text-sm font-semibold text-white">Footer Columns</div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Input label="Product column title" value={settings.landing.footer.productTitle} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, footer: { ...p.landing.footer, productTitle: v } } }))} />
                  <Input label="Company column title" value={settings.landing.footer.companyTitle} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, footer: { ...p.landing.footer, companyTitle: v } } }))} />
                  <Input label="Legal column title" value={settings.landing.footer.legalTitle} onChange={(v) => setSettings((p) => ({ ...p, landing: { ...p.landing, footer: { ...p.landing.footer, legalTitle: v } } }))} />
                  <div className="md:col-span-3 grid gap-4 md:grid-cols-3">
                    {([
                      { key: "productLinks", label: "Product Links" },
                      { key: "companyLinks", label: "Company Links" },
                      { key: "legalLinks", label: "Legal Links" }
                    ] as const).map((group) => (
                      <div key={group.key} className="rounded-xl border border-white/8 bg-white/4 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="text-xs font-semibold text-white">{group.label}</div>
                          <button
                            onClick={() => setSettings((p) => ({
                              ...p,
                              landing: {
                                ...p.landing,
                                footer: {
                                  ...p.landing.footer,
                                  [group.key]: [...p.landing.footer[group.key], { label: "New Link", href: "/" }]
                                }
                              }
                            }))}
                            className="rounded-lg bg-blue-600/20 px-2 py-1 text-[11px] font-semibold text-blue-400"
                          >
                            + Add
                          </button>
                        </div>
                        <div className="space-y-2">
                          {settings.landing.footer[group.key].map((row, index) => (
                            <div
                              key={`${group.key}-${index}`}
                              draggable
                              onDragStart={() => { dragFooterIndexRef.current = { group: group.key, index }; }}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => {
                                const from = dragFooterIndexRef.current;
                                if (!from || from.group !== group.key) return;
                                setSettings((p) => ({
                                  ...p,
                                  landing: {
                                    ...p.landing,
                                    footer: {
                                      ...p.landing.footer,
                                      [group.key]: reorder(p.landing.footer[group.key], from.index, index)
                                    }
                                  }
                                }));
                                dragFooterIndexRef.current = null;
                              }}
                              className="rounded-lg border border-white/10 bg-white/5 p-2"
                            >
                              <input
                                className="mb-2 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white"
                                value={row.label}
                                placeholder="Label"
                                onChange={(e) => setSettings((p) => ({
                                  ...p,
                                  landing: {
                                    ...p.landing,
                                    footer: {
                                      ...p.landing.footer,
                                      [group.key]: p.landing.footer[group.key].map((x, i) => i === index ? { ...x, label: e.target.value } : x)
                                    }
                                  }
                                }))}
                              />
                              <input
                                className="mb-2 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white"
                                value={row.href}
                                placeholder="/path or https://..."
                                onChange={(e) => setSettings((p) => ({
                                  ...p,
                                  landing: {
                                    ...p.landing,
                                    footer: {
                                      ...p.landing.footer,
                                      [group.key]: p.landing.footer[group.key].map((x, i) => i === index ? { ...x, href: e.target.value } : x)
                                    }
                                  }
                                }))}
                              />
                              <button
                                onClick={() => setSettings((p) => ({
                                  ...p,
                                  landing: {
                                    ...p.landing,
                                    footer: {
                                      ...p.landing.footer,
                                      [group.key]: p.landing.footer[group.key].filter((_, i) => i !== index)
                                    }
                                  }
                                }))}
                                className="rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 text-[11px] text-red-400"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ── CUSTOM PAGES ── */}
          {activeSection === "pages" && (
            <div className="space-y-6">
              <SectionTitle title="Custom Pages" subtitle="Create and manage pages under /p/[slug]" />
              <Card>
                <div className="mb-4 text-sm font-semibold text-white">Create New Page</div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Title" value={newPage.title} onChange={(v) => setNewPage((p) => ({ ...p, title: v }))} />
                  <Input label="Slug (optional)" value={newPage.slug} onChange={(v) => { setNewPageSlugTouched(true); setNewPage((p) => ({ ...p, slug: v })); }} placeholder="auto-generated" />
                  <div className="md:col-span-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-xs text-slate-400">
                    Preview: <span className="text-white">/p/{newPageSlug || "(empty)"}</span>
                    {" · "}
                    <span className={newPageSlugTaken ? "text-red-400" : "text-emerald-400"}>
                      {newPageSlugTaken ? "Slug already in use" : "Slug available"}
                    </span>
                  </div>
                  <div className="md:col-span-2"><Textarea label="Content" rows={4} value={newPage.content} onChange={(v) => setNewPage((p) => ({ ...p, content: v }))} /></div>
                  <Toggle label="Published" checked={newPage.published} onChange={(v) => setNewPage((p) => ({ ...p, published: v }))} />
                  <Toggle label="Show in header" checked={newPage.showInHeader} onChange={(v) => setNewPage((p) => ({ ...p, showInHeader: v }))} />
                  <Toggle label="Show in footer" checked={newPage.showInFooter} onChange={(v) => setNewPage((p) => ({ ...p, showInFooter: v }))} />
                  <button onClick={createPage} disabled={!newPage.title.trim() || !newPageSlug || newPageSlugTaken} className="flex items-center gap-2 justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition md:col-span-2">
                    <FileText className="h-4 w-4" /> Create Page
                  </button>
                </div>
              </Card>
              <Card>
                <div className="mb-4 flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500" placeholder="Search pages by title or slug..." value={pageSearch} onChange={(e) => setPageSearch(e.target.value)} />
                  </div>
                  <div className="text-xs text-slate-400">{filteredCustomPages.length} pages</div>
                </div>
              </Card>
              <div className="space-y-3">
                {pagedCustomPages.map((page) => (
                  <Card key={page._id}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="grid flex-1 gap-2 md:grid-cols-2">
                        <Input label="Title" value={page.title} onChange={(v) => setPages((prev) => prev.map((p) => p._id === page._id ? { ...p, title: v } : p))} />
                        <Input label="Slug" value={page.slug} onChange={(v) => setPages((prev) => prev.map((p) => p._id === page._id ? { ...p, slug: v } : p))} />
                        <div className="md:col-span-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-xs text-slate-400">
                          {(() => {
                            const normalized = slugifyClient(page.slug || page.title);
                            const taken = customPages.some((p) => p._id !== page._id && p.slug.toLowerCase() === normalized.toLowerCase());
                            return (
                              <>
                                Preview: <span className="text-white">/p/{normalized || "(empty)"}</span>
                                {" · "}
                                <span className={taken ? "text-red-400" : "text-emerald-400"}>
                                  {taken ? "Slug already in use" : "Slug available"}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/p/${page.slug}`} target="_blank" className="rounded-lg bg-blue-600/20 px-2.5 py-1 text-xs font-semibold text-blue-400 hover:bg-blue-600/30 transition">Open</Link>
                        <button onClick={() => deletePage(page._id)} className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition">Delete</button>
                      </div>
                    </div>
                    <textarea rows={3} className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none resize-none focus:border-blue-500"
                      value={page.content} onChange={(e) => setPages((prev) => prev.map((p) => p._id === page._id ? { ...p, content: e.target.value } : p))} />
                    <div className="flex flex-wrap items-center gap-3">
                      <Toggle label="Published" checked={page.published} onChange={(v) => setPages((prev) => prev.map((p) => p._id === page._id ? { ...p, published: v } : p))} />
                      <Toggle label="In Header" checked={page.showInHeader} onChange={(v) => setPages((prev) => prev.map((p) => p._id === page._id ? { ...p, showInHeader: v } : p))} />
                      <Toggle label="In Footer" checked={page.showInFooter} onChange={(v) => setPages((prev) => prev.map((p) => p._id === page._id ? { ...p, showInFooter: v } : p))} />
                      <button
                        onClick={() => updatePage(page._id, page)}
                        disabled={customPages.some((p) => p._id !== page._id && p.slug.toLowerCase() === slugifyClient(page.slug || page.title).toLowerCase())}
                        className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition"
                      >
                        Save Page
                      </button>
                    </div>
                  </Card>
                ))}
                {pagedCustomPages.length === 0 ? <Card><div className="text-sm text-slate-500">No pages found.</div></Card> : null}
              </div>
              <Card>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Page {currentPagesPage} of {maxPages}</span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPagesPage <= 1}
                      onClick={() => setPagesPage((p) => Math.max(1, p - 1))}
                      className="rounded-lg border border-white/10 px-2 py-1 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      disabled={currentPagesPage >= maxPages}
                      onClick={() => setPagesPage((p) => Math.min(maxPages, p + 1))}
                      className="rounded-lg border border-white/10 px-2 py-1 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ── USERS ── */}
          {activeSection === "users" && (
            <div className="space-y-6">
              <SectionTitle title="Users" subtitle={`${usersTotal} registered accounts`} />
              <Card>
                <div className="mb-4 flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500" placeholder="Search by email..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                  </div>
                  <button onClick={loadUsers} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:border-white/20 hover:text-white transition">
                    <RefreshCw className={`h-4 w-4 ${usersLoading ? "animate-spin" : ""}`} /> Refresh
                  </button>
                </div>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-12 text-slate-500">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading users...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/8 text-left">
                          <th className="pb-3 pr-4 font-semibold text-slate-400">Email</th>
                          <th className="pb-3 pr-4 font-semibold text-slate-400">Joined</th>
                          <th className="pb-3 pr-4 font-semibold text-slate-400 text-right">Saved</th>
                          <th className="pb-3 pr-4 font-semibold text-slate-400 text-right">Reports</th>
                          <th className="pb-3 pr-4 font-semibold text-slate-400 text-right">Payments</th>
                          <th className="pb-3 font-semibold text-slate-400 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredUsers.length === 0 ? (
                          <tr><td colSpan={6} className="py-8 text-center text-slate-500">No users found.</td></tr>
                        ) : filteredUsers.map((u) => (
                          <tr key={u._id} className="group hover:bg-white/3 transition">
                            <td className="py-3 pr-4"><div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400">{u.email[0].toUpperCase()}</div><span className="text-white">{u.email}</span></div></td>
                            <td className="py-3 pr-4 text-slate-400">{new Date(u.createdAt).toLocaleDateString("nl-NL")}</td>
                            <td className="py-3 pr-4 text-right text-slate-300">{u.savedVehicles}</td>
                            <td className="py-3 pr-4 text-right text-slate-300">{u.reports}</td>
                            <td className="py-3 pr-4 text-right"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${u.payments > 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-slate-500"}`}>{u.payments}</span></td>
                            <td className="py-3 text-right"><button onClick={() => deleteUser(u._id)} className="invisible rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition group-hover:visible"><Trash2 className="h-3 w-3" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ── ANALYTICS ── */}
          {activeSection === "analytics" && (
            <div className="space-y-6">
              <SectionTitle title="Analytics" subtitle="User activity, search trends, and section engagement" />
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { key: "7d", label: "1 Week" },
                      { key: "30d", label: "30 Days" },
                      { key: "all", label: "All Time" }
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => void loadAnalytics({ range: item.key as "7d" | "30d" | "all", topPage: 1, recentPage: 1, sectionPage: 1, heatmapPage: 1 })}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                          analyticsRange === item.key
                            ? "bg-blue-600 text-white"
                            : "border border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setAnalyticsTab("searches"); setAnalyticsView("overview"); }}
                      className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${analyticsTab === "searches" ? "bg-indigo-600 text-white" : "border border-white/10 bg-white/5 text-slate-300"}`}
                    >
                      Search Analytics
                    </button>
                    <button
                      onClick={() => { setAnalyticsTab("engagement"); setAnalyticsView("overview"); }}
                      className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${analyticsTab === "engagement" ? "bg-indigo-600 text-white" : "border border-white/10 bg-white/5 text-slate-300"}`}
                    >
                      Section Engagement
                    </button>
                  </div>
                </div>
              </Card>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={Search} label={`Searches (${analyticsRange})`} value={analytics.searchesByDay.reduce((sum, row) => sum + row.count, 0)} color="bg-blue-600" />
                <StatCard icon={BarChart3} label="Tracked Sections" value={analytics.sectionTotals.length} color="bg-indigo-600" />
                <StatCard icon={Users} label="Recent Searches" value={analytics.recentSearches.length} color="bg-emerald-600" />
                <StatCard icon={FileText} label={`Top Plates (${analyticsRange})`} value={analytics.topPlates.length} color="bg-amber-600" />
              </div>
              {analyticsView !== "overview" ? (
                <Card>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <button onClick={() => setAnalyticsView("overview")} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-white/20 hover:text-white transition">
                      Back to overview
                    </button>
                    <button onClick={() => void loadAnalytics()} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-white/20 hover:text-white transition">
                      <RefreshCw className={`h-3.5 w-3.5 ${analyticsLoading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                  </div>
                  {analyticsView === "top-plates" ? (
                    <div>
                      <div className="mb-3 text-sm font-semibold text-white">Most searched number plates ({analyticsRange})</div>
                      <div className="space-y-2">
                        {analytics.topPlates.map((row) => (
                          <div key={row.plate} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/4 px-3 py-2.5">
                            <span className="font-medium text-white">{row.plate}</span>
                            <span className="text-xs text-slate-400">{row.count} searches</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {analyticsView === "recent-searches" ? (
                    <div>
                      <div className="mb-3 text-sm font-semibold text-white">Recent search history ({analyticsRange})</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/8 text-left">
                              <th className="pb-3 pr-4 font-semibold text-slate-400">Plate</th>
                              <th className="pb-3 pr-4 font-semibold text-slate-400">Source</th>
                              <th className="pb-3 pr-4 font-semibold text-slate-400">User</th>
                              <th className="pb-3 font-semibold text-slate-400">Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {analytics.recentSearches.map((row, index) => (
                              <tr key={`${row.plate}-${row.createdAt}-${index}`} className="hover:bg-white/3 transition">
                                <td className="py-3 pr-4 font-medium text-white">{row.plate}</td>
                                <td className="py-3 pr-4 text-slate-300">{row.resultFrom}</td>
                                <td className="py-3 pr-4 text-slate-400">{row.userId ? row.userId.slice(0, 10) : "Guest"}</td>
                                <td className="py-3 text-slate-400">{new Date(row.createdAt).toLocaleString("nl-NL")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div ref={recentSentinelRef} className="h-6" />
                    </div>
                  ) : null}
                  {analyticsView === "section-totals" ? (
                    <div>
                      <div className="mb-3 text-sm font-semibold text-white">Section time totals ({analyticsRange})</div>
                      <div className="space-y-2">
                        {analytics.sectionTotals.map((row) => (
                          <div key={row.section} className="rounded-xl border border-white/8 bg-white/4 px-3 py-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-white">{row.section}</span>
                              <span className="text-xs text-slate-400">{formatMinutes(row.totalMs)}</span>
                            </div>
                            <div className="mt-1 text-xs text-slate-500">{row.views} tracked views</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {analyticsView === "section-heatmap" ? (
                    <div>
                      <div className="mb-3 text-sm font-semibold text-white">Section heatmap records ({analyticsRange})</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/8 text-left">
                              <th className="pb-3 pr-4 font-semibold text-slate-400">Day</th>
                              <th className="pb-3 pr-4 font-semibold text-slate-400">Section</th>
                              <th className="pb-3 pr-4 font-semibold text-slate-400">Views</th>
                              <th className="pb-3 font-semibold text-slate-400">Time Spent</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {analytics.sectionHeatmap.map((row, index) => (
                              <tr key={`${row.day}-${row.section}-${index}`} className="hover:bg-white/3 transition">
                                <td className="py-3 pr-4 text-slate-300">{row.day}</td>
                                <td className="py-3 pr-4 font-medium text-white">{row.section}</td>
                                <td className="py-3 pr-4 text-slate-300">{row.views}</td>
                                <td className="py-3 text-slate-300">{formatMinutes(row.totalMs)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div ref={heatmapSentinelRef} className="h-6" />
                    </div>
                  ) : null}
                </Card>
              ) : null}

              {analyticsTab === "searches" && analyticsView === "overview" ? (
              <div className="grid gap-4 xl:grid-cols-2">
                <Card>
                  <div className="mb-3 flex items-center justify-between gap-3 text-sm font-semibold text-white">
                    <span>Most searched number plates ({analyticsRange})</span>
                    <button onClick={() => setAnalyticsView("top-plates")} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-300 hover:border-white/20 hover:text-white">View all</button>
                  </div>
                  <div className="space-y-2">
                    {analytics.topPlates.length === 0 ? (
                      <div className="text-sm text-slate-500">No search records yet.</div>
                    ) : analytics.topPlates.map((row) => (
                      <div key={row.plate} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/4 px-3 py-2.5">
                        <span className="font-medium text-white">{row.plate}</span>
                        <span className="text-xs text-slate-400">{row.count} searches</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>Page {analytics.pagination?.top.page ?? 1}</span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={(analytics.pagination?.top.page ?? 1) <= 1 || analyticsLoading}
                        onClick={() => void loadAnalytics({ topPage: Math.max(1, (analytics.pagination?.top.page ?? 1) - 1) })}
                        className="rounded-lg border border-white/10 px-2 py-1 disabled:opacity-40"
                      >
                        Prev
                      </button>
                      <button
                        disabled={!analytics.pagination?.top.hasMore || analyticsLoading}
                        onClick={() => void loadAnalytics({ topPage: (analytics.pagination?.top.page ?? 1) + 1 })}
                        className="rounded-lg border border-white/10 px-2 py-1 disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="mb-3 flex items-center justify-between gap-3 text-sm font-semibold text-white">
                    <span>Recent search history ({analyticsRange})</span>
                    <button onClick={() => setAnalyticsView("recent-searches")} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-300 hover:border-white/20 hover:text-white">View all</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/8 text-left">
                          <th className="pb-3 pr-4 font-semibold text-slate-400">Plate</th>
                          <th className="pb-3 pr-4 font-semibold text-slate-400">Source</th>
                          <th className="pb-3 pr-4 font-semibold text-slate-400">User</th>
                          <th className="pb-3 font-semibold text-slate-400">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {analytics.recentSearches.length === 0 ? (
                          <tr><td colSpan={4} className="py-8 text-center text-slate-500">No recent searches yet.</td></tr>
                        ) : analytics.recentSearches.map((row, index) => (
                          <tr key={`${row.plate}-${row.createdAt}-${index}`} className="hover:bg-white/3 transition">
                            <td className="py-3 pr-4 font-medium text-white">{row.plate}</td>
                            <td className="py-3 pr-4 text-slate-300">{row.resultFrom}</td>
                            <td className="py-3 pr-4 text-slate-400">{row.userId ? row.userId.slice(0, 10) : "Guest"}</td>
                            <td className="py-3 text-slate-400">{new Date(row.createdAt).toLocaleString("nl-NL")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div ref={recentSentinelRef} className="h-6" />
                  <div className="mt-2 text-xs text-slate-500">
                    {analytics.pagination?.recent.hasMore ? "Scroll to load more..." : "All records loaded."}
                  </div>
                </Card>
              </div>
              ) : null}

              {analyticsTab === "engagement" && analyticsView === "overview" ? (
              <div className="grid gap-4 xl:grid-cols-2">
                <Card>
                  <div className="mb-3 flex items-center justify-between gap-3 text-sm font-semibold text-white">
                    <span>Section time totals ({analyticsRange})</span>
                    <button onClick={() => setAnalyticsView("section-totals")} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-300 hover:border-white/20 hover:text-white">View all</button>
                  </div>
                  <div className="space-y-2">
                    {analytics.sectionTotals.length === 0 ? (
                      <div className="text-sm text-slate-500">No section activity tracked yet.</div>
                    ) : analytics.sectionTotals.map((row) => (
                      <div key={row.section} className="rounded-xl border border-white/8 bg-white/4 px-3 py-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">{row.section}</span>
                          <span className="text-xs text-slate-400">{formatMinutes(row.totalMs)}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{row.views} tracked views</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>Page {analytics.pagination?.section.page ?? 1}</span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={(analytics.pagination?.section.page ?? 1) <= 1 || analyticsLoading}
                        onClick={() => void loadAnalytics({ sectionPage: Math.max(1, (analytics.pagination?.section.page ?? 1) - 1) })}
                        className="rounded-lg border border-white/10 px-2 py-1 disabled:opacity-40"
                      >
                        Prev
                      </button>
                      <button
                        disabled={!analytics.pagination?.section.hasMore || analyticsLoading}
                        onClick={() => void loadAnalytics({ sectionPage: (analytics.pagination?.section.page ?? 1) + 1 })}
                        className="rounded-lg border border-white/10 px-2 py-1 disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </Card>
                <Card>
                <div className="mb-3 flex items-center justify-between gap-3 text-sm font-semibold text-white">
                  <span>Section heatmap records ({analyticsRange})</span>
                  <button onClick={() => setAnalyticsView("section-heatmap")} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-300 hover:border-white/20 hover:text-white">View all</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/8 text-left">
                        <th className="pb-3 pr-4 font-semibold text-slate-400">Day</th>
                        <th className="pb-3 pr-4 font-semibold text-slate-400">Section</th>
                        <th className="pb-3 pr-4 font-semibold text-slate-400">Views</th>
                        <th className="pb-3 font-semibold text-slate-400">Time Spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {analytics.sectionHeatmap.length === 0 ? (
                        <tr><td colSpan={4} className="py-8 text-center text-slate-500">No heatmap data yet.</td></tr>
                      ) : analytics.sectionHeatmap.map((row, index) => (
                        <tr key={`${row.day}-${row.section}-${index}`} className="hover:bg-white/3 transition">
                          <td className="py-3 pr-4 text-slate-300">{row.day}</td>
                          <td className="py-3 pr-4 font-medium text-white">{row.section}</td>
                          <td className="py-3 pr-4 text-slate-300">{row.views}</td>
                          <td className="py-3 text-slate-300">{formatMinutes(row.totalMs)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div ref={heatmapSentinelRef} className="h-6" />
                <div className="mt-2 text-xs text-slate-500">
                  {analytics.pagination?.heatmap.hasMore ? "Scroll to load more..." : "All records loaded."}
                </div>
              </Card>
              </div>
              ) : null}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
