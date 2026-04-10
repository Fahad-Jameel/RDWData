export type ClaudeInsightResult = {
  summary: string;
  positives: string[];
  risks: string[];
  recommendation: string;
};

export type ClaudeValuationResult = {
  currency: "EUR";
  estimatedValueNow: number;
  estimatedValueMin: number;
  estimatedValueMax: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  factors: string[];
  explanation: string;
};

export type ClaudeVehicleReportResult = {
  insights: ClaudeInsightResult;
  valuation: ClaudeValuationResult;
};

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

function getRequiredAnthropicEnv() {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest";
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY.");
  }
  return { apiKey, model };
}

function safeTruncate(value: string, max = 7000): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

function extractTextContent(content: unknown): string {
  if (!Array.isArray(content)) return "";
  const textParts: string[] = [];
  for (const part of content) {
    if (!part || typeof part !== "object") continue;
    const maybeText = (part as { type?: string; text?: string }).text;
    const type = (part as { type?: string }).type;
    if (type === "text" && typeof maybeText === "string") {
      textParts.push(maybeText);
    }
  }
  return textParts.join("\n").trim();
}

function parseClaudeJson(text: string): ClaudeVehicleReportResult | null {
  try {
    const parsed = JSON.parse(text) as Partial<ClaudeVehicleReportResult>;
    if (!parsed || typeof parsed !== "object") return null;
    const rawInsights = (parsed.insights ?? {}) as Partial<ClaudeInsightResult>;
    const rawValuation = (parsed.valuation ?? {}) as Partial<ClaudeValuationResult>;

    const insights: ClaudeInsightResult = {
      summary: typeof rawInsights.summary === "string" ? rawInsights.summary : "",
      positives: Array.isArray(rawInsights.positives) ? rawInsights.positives.filter((x): x is string => typeof x === "string") : [],
      risks: Array.isArray(rawInsights.risks) ? rawInsights.risks.filter((x): x is string => typeof x === "string") : [],
      recommendation: typeof rawInsights.recommendation === "string" ? rawInsights.recommendation : ""
    };

    const now = Number(rawValuation.estimatedValueNow);
    const min = Number(rawValuation.estimatedValueMin);
    const max = Number(rawValuation.estimatedValueMax);
    const confidence = rawValuation.confidence === "HIGH" || rawValuation.confidence === "MEDIUM" ? rawValuation.confidence : "LOW";
    const valuation: ClaudeValuationResult = {
      currency: "EUR",
      estimatedValueNow: Number.isFinite(now) ? Math.max(0, Math.round(now)) : 0,
      estimatedValueMin: Number.isFinite(min) ? Math.max(0, Math.round(min)) : 0,
      estimatedValueMax: Number.isFinite(max) ? Math.max(0, Math.round(max)) : 0,
      confidence,
      factors: Array.isArray(rawValuation.factors) ? rawValuation.factors.filter((x): x is string => typeof x === "string").slice(0, 8) : [],
      explanation: typeof rawValuation.explanation === "string" ? rawValuation.explanation : ""
    };

    if (!insights.summary && !insights.recommendation && insights.positives.length === 0 && insights.risks.length === 0) return null;
    if (valuation.estimatedValueNow <= 0) return null;
    if (valuation.estimatedValueMin <= 0 || valuation.estimatedValueMax <= 0 || valuation.estimatedValueMin > valuation.estimatedValueMax) return null;
    return { insights, valuation };
  } catch {
    return null;
  }
}

export async function generateVehicleAiReport(args: {
  plate: string;
  locale: "nl" | "en";
  vehicleData: unknown;
}): Promise<ClaudeVehicleReportResult> {
  const { apiKey, model } = getRequiredAnthropicEnv();
  const dataJson = safeTruncate(JSON.stringify(args.vehicleData, null, 2), 12000);
  const isNl = args.locale === "nl";

  const systemPrompt = isNl
    ? "Je bent een senior auto-inspectie analist en voertuigwaarderingsspecialist. Antwoord alleen in geldige JSON zonder markdown of extra tekst."
    : "You are a senior vehicle inspection analyst and valuation specialist. Respond only in valid JSON with no markdown or extra text.";

  const userPrompt = isNl
    ? `Analyseer dit voertuigrapport voor kenteken ${args.plate}. Lever zowel risicosamenvatting als realistische voertuigwaardering op basis van de aanwezige data.
Geef exact dit JSON-formaat terug:
{
  "insights": {
    "summary": "...",
    "positives": ["..."],
    "risks": ["..."],
    "recommendation": "..."
  },
  "valuation": {
    "currency": "EUR",
    "estimatedValueNow": 0,
    "estimatedValueMin": 0,
    "estimatedValueMax": 0,
    "confidence": "LOW|MEDIUM|HIGH",
    "factors": ["..."],
    "explanation": "..."
  }
}
Regels:
- positives maximaal 4 punten
- risks maximaal 4 punten
- factors maximaal 8 punten
- waardes als gehele getallen in EUR
- estimatedValueMin <= estimatedValueNow <= estimatedValueMax
- feitelijk blijven op basis van de data
- geen juridische claims, geen absolute garanties
- als onzeker: vergroot bandbreedte en confidence verlagen

DATA:
${dataJson}`
    : `Analyze this vehicle report for plate ${args.plate}. Return both risk summary and realistic vehicle valuation based on the available data.
Return exactly this JSON shape:
{
  "insights": {
    "summary": "...",
    "positives": ["..."],
    "risks": ["..."],
    "recommendation": "..."
  },
  "valuation": {
    "currency": "EUR",
    "estimatedValueNow": 0,
    "estimatedValueMin": 0,
    "estimatedValueMax": 0,
    "confidence": "LOW|MEDIUM|HIGH",
    "factors": ["..."],
    "explanation": "..."
  }
}
Rules:
- positives max 4 bullets
- risks max 4 bullets
- factors max 8 bullets
- values must be integer EUR numbers
- estimatedValueMin <= estimatedValueNow <= estimatedValueMax
- stay factual based on data
- no legal claims, no absolute guarantees
- if uncertain: widen range and lower confidence

DATA:
${dataJson}`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      max_tokens: 700,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Anthropic request failed (${response.status}): ${detail}`);
  }

  const payload = (await response.json()) as { content?: unknown };
  const text = extractTextContent(payload.content);
  const parsed = parseClaudeJson(text);
  if (!parsed) {
    throw new Error("Anthropic response was not valid JSON in expected format.");
  }
  return parsed;
}

export async function generateVehicleAiInsights(args: {
  plate: string;
  locale: "nl" | "en";
  vehicleData: unknown;
}): Promise<ClaudeInsightResult> {
  const report = await generateVehicleAiReport(args);
  return report.insights;
}

function readNestedNumber(record: Record<string, unknown>, path: string[]): number | null {
  let current: unknown = record;
  for (const key of path) {
    if (!current || typeof current !== "object") return null;
    current = (current as Record<string, unknown>)[key];
  }
  const value = Number(current);
  return Number.isFinite(value) ? value : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function buildFallbackVehicleAiReport(args: {
  locale: "nl" | "en";
  vehicleData: unknown;
}): ClaudeVehicleReportResult {
  const isNl = args.locale === "nl";
  const data = (args.vehicleData ?? {}) as Record<string, unknown>;
  const vehicle = (data.vehicle ?? {}) as Record<string, unknown>;
  const enriched = (data.enriched ?? {}) as Record<string, unknown>;
  const defects = Array.isArray(data.defects) ? data.defects.length : 0;
  const recalls = Array.isArray(data.recalls) ? data.recalls.length : 0;
  const ageMonths = readNestedNumber(data, ["enriched", "ageInMonths"]) ?? 0;

  const directEstimate = readNestedNumber(enriched, ["estimatedValueNow"]);
  const maintenanceRisk = readNestedNumber(enriched, ["maintenanceRiskScore"]) ?? 6;
  const apkPassChance = readNestedNumber(enriched, ["apkPassChance"]) ?? 70;
  const cataloguePrice = readNestedNumber(vehicle, ["cataloguePrice"]);

  const ageYears = ageMonths > 0 ? ageMonths / 12 : 10;
  const depreciation = clamp(1 - ageYears * 0.06, 0.18, 0.75);
  const derivedFromCatalogue = cataloguePrice ? Math.round(cataloguePrice * depreciation) : null;
  const estimatedValueNow = Math.max(1500, Math.round(directEstimate ?? derivedFromCatalogue ?? 6500));

  const defectPenalty = defects * 0.03;
  const recallPenalty = recalls > 0 ? 0.04 : 0;
  const riskPenalty = maintenanceRisk * 0.01;
  const uncertainty = clamp(0.14 + defectPenalty + recallPenalty + riskPenalty, 0.14, 0.38);
  const estimatedValueMin = Math.max(1000, Math.round(estimatedValueNow * (1 - uncertainty)));
  const estimatedValueMax = Math.round(estimatedValueNow * (1 + uncertainty));
  const confidence: "LOW" | "MEDIUM" | "HIGH" = uncertainty > 0.28 ? "LOW" : uncertainty > 0.2 ? "MEDIUM" : "HIGH";

  const positives: string[] = [];
  const risks: string[] = [];
  const factors: string[] = [];

  if (apkPassChance >= 70) {
    positives.push(isNl ? "APK slagingskans ligt relatief hoog." : "APK pass chance is relatively strong.");
  }
  if (readNestedNumber(vehicle, ["owners", "count"]) !== null) {
    positives.push(
      isNl
        ? `Aantal vorige eigenaren bekend: ${String((vehicle.owners as Record<string, unknown> | undefined)?.count ?? "-")}.`
        : `Previous owner count available: ${String((vehicle.owners as Record<string, unknown> | undefined)?.count ?? "-")}.`
    );
  }
  if (recalls === 0) {
    positives.push(isNl ? "Geen openstaande terugroepacties zichtbaar." : "No open recalls currently visible.");
  }

  if (defects > 0) {
    risks.push(
      isNl
        ? `${defects} geregistreerde defect(en) in historie kunnen herstelkosten verhogen.`
        : `${defects} recorded defect(s) in history can increase repair costs.`
    );
  }
  if (maintenanceRisk >= 7) {
    risks.push(
      isNl
        ? "Onderhoudsrisico is bovengemiddeld volgens het profiel."
        : "Maintenance risk is above average based on profile indicators."
    );
  }
  if (ageYears >= 12) {
    risks.push(isNl ? "Hogere leeftijd verhoogt kans op slijtagecomponenten." : "Vehicle age raises wear-and-tear probability.");
  }
  if (apkPassChance < 60) {
    risks.push(isNl ? "APK slagingskans onder gemiddelde bandbreedte." : "APK pass chance is below average range.");
  }

  factors.push(
    isNl ? `Leeftijd: ${Math.round(ageYears * 10) / 10} jaar` : `Age: ${Math.round(ageYears * 10) / 10} years`,
    isNl ? `Onderhoudsrisico: ${maintenanceRisk}/10` : `Maintenance risk: ${maintenanceRisk}/10`,
    isNl ? `APK kans: ${apkPassChance}%` : `APK pass chance: ${apkPassChance}%`,
    isNl ? `Defecten: ${defects}` : `Defects: ${defects}`,
    isNl ? `Terugroepacties: ${recalls}` : `Recalls: ${recalls}`
  );
  if (cataloguePrice) {
    factors.push(isNl ? `Catalogusprijs: EUR ${cataloguePrice}` : `Catalogue price: EUR ${cataloguePrice}`);
  }

  const summary = isNl
    ? "Waardering is berekend op basis van leeftijd, onderhoudsrisico, APK-signalen, defecthistorie en bekende marktindicaties."
    : "Valuation is derived from age, maintenance risk, APK signals, defect history, and available market indicators.";
  const recommendation = isNl
    ? "Gebruik deze indicatie als onderhandelingsbasis en combineer met fysieke inspectie en proefrit."
    : "Use this estimate as negotiation guidance and combine it with physical inspection and test drive.";
  const explanation = isNl
    ? "Dit is een data-gedreven schatting, geen taxatierapport. Bandbreedte is vergroot bij hogere onzekerheid."
    : "This is a data-driven estimate, not a formal appraisal. The range widens as uncertainty increases.";

  return {
    insights: {
      summary,
      positives: positives.slice(0, 4),
      risks: risks.slice(0, 4),
      recommendation
    },
    valuation: {
      currency: "EUR",
      estimatedValueNow,
      estimatedValueMin,
      estimatedValueMax,
      confidence,
      factors: factors.slice(0, 8),
      explanation
    }
  };
}
