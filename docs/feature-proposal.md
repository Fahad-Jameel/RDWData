# Kentekenrapport Feature Proposal

## Purpose
This document proposes high-impact product features that can differentiate Kentekenrapport in the Netherlands vehicle-intelligence market.  
Each feature includes:
- what it is
- how it works
- whether external data is required

## Feature Proposals

### 1) Evidence Graph (Data Provenance & Confidence)
**What it is**  
A trust layer that shows the origin and reliability of every key data point in a vehicle report.

**How it works**  
Each field (e.g., APK expiry, NAP verdict, recall status) is linked to:
- source dataset/provider
- last update timestamp
- confidence level (`high`, `medium`, `low`)
- conflict status when two sources disagree

**External data needed**  
- Not mandatory for first version (can be built on RDW + internal enrichment metadata)
- Optional: additional providers for cross-source validation

---

### 2) Seller Claim Verifier
**What it is**  
A consistency checker between listing claims and known vehicle history.

**How it works**  
Extract seller claims from listing text (e.g., “no damage”, “first owner”, “dealer maintained”), then compare against report facts and produce:
- match / partial / mismatch results
- claim-level evidence links
- a final integrity score

**External data needed**  
- Required: listing feed access (marketplace API/scrape pipeline)
- Optional: VIN-level provider for deeper validation

---

### 3) Negotiation Copilot
**What it is**  
A buyer-facing assistant that converts report risk into practical negotiation guidance.

**How it works**  
Uses vehicle condition signals to generate:
- recommended offer range
- walk-away threshold
- talking points tied to report evidence
- repair reserve suggestions

**External data needed**  
- Optional but strongly recommended: live market comparable pricing feeds
- Can start with internal valuation model + RDW history

---

### 4) Model-Year APK Failure Intelligence
**What it is**  
A predictive reliability layer per model-year-engine, focused on APK outcomes.

**How it works**  
Aggregates historical defect patterns and outputs:
- most frequent recurring defect categories
- pass/fail probability profiles
- estimated repair band by defect group

**External data needed**  
- No new mandatory source if RDW defect/apk datasets are available
- Optional: parts/labor cost datasets to improve repair estimates

---

### 5) Post-Purchase Monitoring
**What it is**  
A persistent watch mode after vehicle purchase.

**How it works**  
Users “follow” a plate and receive alerts for:
- new recall status changes
- APK status/risk changes
- key compliance or risk shifts

**External data needed**  
- No mandatory new source for core alerts (RDW-based)
- Optional: city policy/zone APIs for compliance alerts

---

### 6) VIN-to-Reality Diff
**What it is**  
A mismatch detector between factory build information and currently advertised vehicle attributes.

**How it works**  
Compares VIN-derived configuration against listing-reported specs and photos:
- trim/options mismatch
- paint mismatch
- equipment discrepancy flags

**External data needed**  
- Required: VIN decode/build data provider
- Required for full value: listing data and images

---

### 7) Photo Forensics Score
**What it is**  
A computer-vision quality and anomaly score for listing images.

**How it works**  
Analyzes photos for:
- repaint likelihood / panel inconsistency
- flood/waterline indicators
- image tampering or low-trust photo sets

Outputs a transparent confidence score and reason codes.

**External data needed**  
- Required: listing photo feeds
- Optional: training data partnerships for stronger model quality

---

### 8) Ownership Behavior Pattern Classification
**What it is**  
A behavior profile derived from transfer history (not just owner count).

**How it works**  
Classifies ownership timeline into interpretable patterns such as:
- stable long-term private use
- frequent short-cycle flipping
- fleet/lease lifecycle pattern

Includes confidence and anomaly flags.

**External data needed**  
- No mandatory new source for baseline (can be inferred from current ownership timeline data)
- Optional: richer transfer metadata providers

---

### 9) Import Journey Reconstruction
**What it is**  
A confidence-scored timeline for imported vehicles with missing-period detection.

**How it works**  
Builds a journey graph of known registration events and detects gaps:
- likely origin and transfer checkpoints
- data silence windows
- risk level for undocumented periods

**External data needed**  
- Required for strong coverage: cross-border history providers
- Baseline can run with Dutch-side data only, but with limited certainty

---

### 10) Cost-of-Ownership Simulator
**What it is**  
A scenario engine for total ownership cost.

**How it works**  
Produces scenario-based monthly/annual projections combining:
- depreciation path
- expected maintenance burden
- fuel, insurance, and road tax estimates
- risk-adjusted “surprise cost” buffer

**External data needed**  
- Optional but recommended: insurance quote APIs, market price feeds, maintenance cost databases
- Baseline can start from internal estimates + known public signals

---

### 11) Recall Severity Prioritizer
**What it is**  
A practical ranking of recalls by urgency and user impact.

**How it works**  
Transforms raw recall records into:
- severity tier
- action priority
- expected inconvenience window

Instead of “count only”, users get an actionable queue.

**External data needed**  
- Baseline: existing recall datasets
- Optional: additional safety/recall metadata (EU/global recall sources)

---

### 12) Use-Case Fit Score
**What it is**  
A contextual suitability score for specific buyer intents.

**How it works**  
Scores vehicle fit for profiles such as:
- city commuter
- family car
- high-mileage driver
- light commercial use

Uses condition, efficiency, reliability, and cost indicators.

**External data needed**  
- No mandatory external source for first version
- Optional: regional driving/traffic and emissions-zone data

---

### 13) Maintenance Calendar Predictor
**What it is**  
A near-term maintenance forecast from vehicle profile + historical patterns.

**How it works**  
Predicts likely maintenance needs in upcoming periods:
- probable intervention categories
- chance percentage
- estimated cost bands

**External data needed**  
- Optional but recommended: parts/service interval databases (OEM or third-party)
- Baseline can be generated from internal heuristics

---

### 14) Regulatory/Emissions Risk Outlook
**What it is**  
A policy-friction indicator showing risk from emissions and local access rules.

**How it works**  
Combines emission standard and vehicle class with city policy layers to show:
- potential future access restrictions
- compliance risk by region
- practical ownership impact

**External data needed**  
- Required for full fidelity: municipal/regional policy data feeds

---

### 15) Comparable Alternatives Engine
**What it is**  
A recommendation layer suggesting safer or better-value alternatives.

**How it works**  
Given budget and target vehicle, recommends alternatives with:
- lower risk score
- better ownership cost profile
- comparable utility specs

**External data needed**  
- Required for strong relevance: active listing/market inventory data
- Optional: commercial valuation datasets

---

### 16) Resale Exit Advisor
**What it is**  
A forward-looking guidance module for optimal resale window.

**How it works**  
Projects value trajectory and suggests favorable exit conditions based on:
- depreciation path
- usage scenario
- risk trend direction

**External data needed**  
- Recommended: market pricing history feeds
- Baseline possible with internal depreciation modeling

## Strategic Notes
- Features that rely only on RDW + internal modeling can launch with less dependency risk.
- Features using listing feeds, VIN build data, and cross-border history create stronger differentiation but require provider integrations and data contracts.
- Highest product defensibility comes from combining: **Evidence Graph + Seller Claim Verifier + Predictive Intelligence + Actionable Decision UX**.
