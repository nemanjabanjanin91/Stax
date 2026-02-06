import React, { useEffect, useMemo, useState } from "react";

// In-chat, self-contained functional wireframe preview.
// Uses Tailwind classes (Canvas preview supports them).

const STORAGE_KEY = "stax_onboarding_preview_v1";

const money = (n) =>
  (Number(n || 0) || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const now = () => new Date().toLocaleString();

const defaultState = {
  meta: { lastSavedAt: null, submittedAt: null },
  nav: { step: "p0" },
  portfolio: {
    items: [
      { id: "a", name: "MCG Madison Ridge DST", amount: 270000 },
      { id: "b", name: "CX Mode — Hyattsville", amount: 270000 },
      { id: "c", name: "NexPoint Semiconductor", amount: 270000 },
    ],
  },
  completionMode: "online",
  accountType: "",
  eligibility: { accredited: "", highRisk: "", illiquid: "" },
  investor: {
    legalName: "",
    country: "United States",
    address1: "",
    city: "",
    state: "",
    zip: "",
    businessType: "",
    emailPrimary: "",
    emailSecondary: "",
    phonePrimary: "",
    phoneSecondary: "",
    taxIdType: "SSN",
    taxId: "",
  },
  financials: {
    incomeRange: "",
    netWorthRange: "",
    liquidAssetsRange: "",
    taxBracket: "",
  },
  docs: {
    primaryIdUploaded: false,
    financialStatement: "Pending",
    identification: "Pending",
    newAccountForm: "Pending",
  },
  consent: { accuracy: false, checks: false },
};

const PHASES = [
  { name: "Portfolio", pct: 10 },
  { name: "Eligibility", pct: 30 },
  { name: "Investor", pct: 50 },
  { name: "Financials", pct: 70 },
  { name: "Verification", pct: 82 },
  { name: "Review", pct: 92 },
  { name: "Submitted", pct: 100 },
];

const RANGE = [
  "< $50k",
  "$50k–$100k",
  "$100k–$250k",
  "$250k–$500k",
  "$500k–$1M",
  "$1M–$5M",
  "> $5M",
];

function pillClass(active) {
  return active
    ? "text-slate-900 font-medium"
    : "text-slate-500 hover:text-slate-700";
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl border bg-white shadow-sm ${className}`}>{children}</div>
  );
}

function Label({ children }) {
  return <div className="text-sm font-medium text-slate-900">{children}</div>;
}

function Hint({ children }) {
  return <div className="text-xs text-slate-500">{children}</div>;
}

function Input({ value, onChange, placeholder = "" }) {
  return (
    <input
      className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none ring-slate-200 focus:ring-2"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function Select({ value, onChange, options, placeholder = "Select…" }) {
  return (
    <select
      className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none ring-slate-200 focus:ring-2"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function YesNo({ value, onChange }) {
  return (
    <div className="flex gap-4">
      {["Yes", "No"].map((v) => (
        <label key={v} className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={value === v}
            onChange={() => onChange(v)}
          />
          {v}
        </label>
      ))}
    </div>
  );
}

function Modal({ open, title, kicker, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-auto mt-24 w-[min(720px,92vw)] rounded-xl border bg-white shadow-lg">
        <div className="flex items-start justify-between gap-3 border-b p-5">
          <div>
            <div className="text-xs text-slate-500">{kicker}</div>
            <div className="text-base font-semibold">{title}</div>
          </div>
          <button
            className="rounded-md px-2 py-1 text-slate-700 hover:bg-slate-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="p-5 text-sm text-slate-700">{children}</div>
        <div className="flex justify-end border-t bg-slate-50 p-5">
          <button
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaxOnboardingPreview() {
  const [state, setState] = useState(defaultState);
  const [modal, setModal] = useState({ open: false, title: "", kicker: "", body: null });
  const [error, setError] = useState("");

  // Load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setState((s) => ({ ...s, ...parsed, meta: { ...s.meta, ...(parsed.meta || {}) } }));
    } catch {
      // ignore
    }
  }, []);

  const phaseIndex = useMemo(() => {
    const step = state.nav.step;
    if (["p0", "p0mode"].includes(step)) return 0;
    if (["p1", "p1elig"].includes(step)) return 1;
    if (["p2", "p2contact", "p2tax"].includes(step)) return 2;
    if (["p3fin"].includes(step)) return 3;
    if (["p4docs"].includes(step)) return 4;
    if (["p5review"].includes(step)) return 5;
    return 6;
  }, [state.nav.step]);

  const progressPct = PHASES[phaseIndex]?.pct ?? 10;

  const total = useMemo(
    () => state.portfolio.items.reduce((a, b) => a + Number(b.amount || 0), 0),
    [state.portfolio.items]
  );

  const branchPill = useMemo(() => {
    if (!state.accountType) return "Branch";
    return state.accountType === "individual"
      ? "INDIVIDUAL flow"
      : `${state.accountType.toUpperCase()} flow`;
  }, [state.accountType]);

  const saveNow = () => {
    const next = {
      ...state,
      meta: { ...state.meta, lastSavedAt: new Date().toISOString() },
    };
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(defaultState);
    setError("");
  };

  const openWhyWeAsk = () => {
    const step = state.nav.step;
    const text =
      step === "p2tax"
        ? "Tax ID is used for compliance checks and preparing purchase documentation. It’s stored securely."
        : step === "p4docs"
        ? "Documents are used to verify identity and meet regulatory requirements."
        : step === "p3fin"
        ? "Financial ranges are used for suitability assessment. We use ranges to reduce friction."
        : "We collect this information to support compliance, suitability, and a smooth transaction process.";
    setModal({
      open: true,
      kicker: "Why we ask this",
      title: "Context",
      body: <div className="text-slate-600">{text}</div>,
    });
  };

  const validateAndNext = () => {
    setError("");
    const step = state.nav.step;

    const fail = (msg) => {
      setError(msg);
      return false;
    };

    if (step === "p1" && !state.accountType) return fail("Select who is investing to continue.");

    if (step === "p1elig") {
      const e = state.eligibility;
      if (!e.accredited || !e.highRisk || !e.illiquid) return fail("Answer all three questions to continue.");
    }

    if (step === "p2") {
      const i = state.investor;
      const required = [i.legalName, i.country, i.address1, i.city, i.state, i.zip];
      if (required.some((v) => !String(v || "").trim())) return fail("Complete all required identity fields.");
      if ((state.accountType === "trust" || state.accountType === "entity") && !String(i.businessType || "").trim())
        return fail("Business type is required for Trust/Entity accounts.");
    }

    if (step === "p2contact") {
      const i = state.investor;
      if (!i.emailPrimary || !i.phonePrimary) return fail("Primary email and phone are required.");
    }

    if (step === "p2tax") {
      const i = state.investor;
      if (!i.taxIdType || !i.taxId) return fail("Tax ID type and Tax ID are required.");
    }

    if (step === "p3fin") {
      const f = state.financials;
      const required = [f.incomeRange, f.netWorthRange, f.liquidAssetsRange, f.taxBracket];
      if (required.some((v) => !String(v || "").trim())) return fail("Complete all required financial fields.");
    }

    if (step === "p4docs") {
      if (!state.docs.primaryIdUploaded) return fail("Upload your Primary ID to continue.");
    }

    if (step === "p5review") {
      if (!state.consent.accuracy || !state.consent.checks) return fail("Confirm both checkboxes to submit.");
      const submittedAt = new Date().toISOString();
      const next = { ...state, meta: { ...state.meta, submittedAt }, nav: { step: "p6" } };
      setState(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return;
    }

    const nextStep =
      step === "p0" ? "p0mode" :
      step === "p0mode" ? "p1" :
      step === "p1" ? "p1elig" :
      step === "p1elig" ? "p2" :
      step === "p2" ? "p2contact" :
      step === "p2contact" ? "p2tax" :
      step === "p2tax" ? "p3fin" :
      step === "p3fin" ? "p4docs" :
      step === "p4docs" ? "p5review" :
      step === "p6" ? "p6" :
      "p0";

    setState((s) => ({ ...s, nav: { step: nextStep } }));
    saveNow();
  };

  const back = () => {
    setError("");
    const step = state.nav.step;
    const prevStep =
      step === "p0mode" ? "p0" :
      step === "p1" ? "p0mode" :
      step === "p1elig" ? "p1" :
      step === "p2" ? "p1elig" :
      step === "p2contact" ? "p2" :
      step === "p2tax" ? "p2contact" :
      step === "p3fin" ? "p2tax" :
      step === "p4docs" ? "p3fin" :
      step === "p5review" ? "p4docs" :
      step === "p6" ? "p5review" :
      null;
    if (prevStep) setState((s) => ({ ...s, nav: { step: prevStep } }));
  };

  const header = useMemo(() => {
    const step = state.nav.step;
    if (step === "p0") return { kicker: "Portfolio", title: "You’re getting ready to invest", sub: "We’ll collect the information required to prepare your selected portfolio for purchase. You can save and return anytime." };
    if (step === "p0mode") return { kicker: "Portfolio", title: "How do you want to complete onboarding?", sub: "Choose a path. You can still schedule a call at any point." };
    if (step === "p1") return { kicker: "Eligibility", title: "Who is investing?", sub: "This determines required parties, documents, and signatures." };
    if (step === "p1elig") return { kicker: "Eligibility", title: "Quick eligibility check", sub: "These answers help route your onboarding and confirm what opportunities are available." };
    if (step === "p2") return { kicker: "Investor", title: "Investor information", sub: "Tell us who is investing and where they’re based." };
    if (step === "p2contact") return { kicker: "Investor", title: "Contact details", sub: "We’ll use these to send status updates and coordinate next steps." };
    if (step === "p2tax") return { kicker: "Investor", title: "Tax identification", sub: "Required for compliant transaction processing." };
    if (step === "p3fin") return { kicker: "Financials", title: "Financial overview", sub: "Used for suitability assessment for your selected investments." };
    if (step === "p4docs") return { kicker: "Verification", title: "Identity & documents", sub: "Upload verification items. You can submit with pending documents." };
    if (step === "p5review") return { kicker: "Review", title: "Review & submit", sub: "Confirm your details. You can edit any section before submission." };
    return { kicker: "Submitted", title: "Submitted — We’re reviewing your information", sub: "We’ll notify you when review is complete. Meanwhile, you can continue with next steps." };
  }, [state.nav.step]);

  const StepBody = () => {
    const step = state.nav.step;

    if (step === "p0") {
      return (
        <div className="space-y-6">
          <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
            <div className="font-medium text-slate-900">What happens next</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
              <li>Confirm your portfolio and how you want to complete onboarding.</li>
              <li>Answer required investor and compliance questions.</li>
              <li>Upload verification documents and submit for review.</li>
            </ul>
          </div>

          <Card className="p-4">
            <div className="font-medium">Portfolio summary</div>
            <div className="mt-3 space-y-2">
              {state.portfolio.items.map((it) => (
                <div key={it.id} className="flex items-center justify-between text-sm">
                  <div className="text-slate-700">{it.name}</div>
                  <div className="font-medium">{money(it.amount)}</div>
                </div>
              ))}
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <div className="font-medium">Total</div>
                <div className="font-semibold">{money(total)}</div>
              </div>
            </div>

            <button
              className="mt-4 text-sm text-slate-600 underline underline-offset-4 hover:text-slate-900"
              onClick={() =>
                setModal({
                  open: true,
                  kicker: "Portfolio",
                  title: "Edit portfolio amounts",
                  body: (
                    <div className="space-y-4">
                      {state.portfolio.items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between gap-3">
                          <div className="text-slate-900">{it.name}</div>
                          <input
                            className="w-40 rounded-md border px-3 py-2 text-sm"
                            value={it.amount}
                            onChange={(e) => {
                              const v = Number(String(e.target.value).replace(/[^0-9]/g, "")) || 0;
                              setState((s) => ({
                                ...s,
                                portfolio: {
                                  ...s.portfolio,
                                  items: s.portfolio.items.map((x) => (x.id === it.id ? { ...x, amount: v } : x)),
                                },
                              }));
                            }}
                          />
                        </div>
                      ))}
                      <Hint>This is a wireframe control; amounts update immediately.</Hint>
                    </div>
                  ),
                })
              }
            >
              Edit portfolio amounts
            </button>
          </Card>
        </div>
      );
    }

    if (step === "p0mode") {
      const Choice = ({ keyName, title, desc, tag }) => {
        const selected = state.completionMode === keyName;
        return (
          <button
            className={
              "text-left rounded-xl border p-5 hover:bg-slate-50 " +
              (selected ? "border-slate-900 ring-2 ring-slate-200" : "")
            }
            onClick={() => setState((s) => ({ ...s, completionMode: keyName }))}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="font-medium">{title}</div>
              {tag ? (
                <span className="rounded-full border bg-slate-100 px-2 py-1 text-xs text-slate-700">
                  {tag}
                </span>
              ) : null}
            </div>
            <div className="mt-1 text-sm text-slate-600">{desc}</div>
          </button>
        );
      };

      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Choice
              keyName="online"
              title="Complete online"
              desc="Finish at your own pace. Save and resume anytime."
              tag="Recommended"
            />
            <Choice
              keyName="specialist"
              title="Complete with a specialist"
              desc="Schedule a short call. We’ll guide you through required steps."
              tag="Assisted"
            />
          </div>

          <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
            <div className="font-medium">Tip</div>
            <div className="mt-1 text-slate-600">
              If you choose a call, you can still submit information online before or after.
            </div>
          </div>
        </div>
      );
    }

    if (step === "p1") {
      return (
        <div className="space-y-2">
          <Label>Account type</Label>
          <Select
            value={state.accountType}
            onChange={(v) => setState((s) => ({ ...s, accountType: v }))}
            options={["individual", "trust", "entity"]}
            placeholder="Select…"
          />
          <Hint>If you’re unsure, choose Individual — you can change later in review.</Hint>
        </div>
      );
    }

    if (step === "p1elig") {
      const e = state.eligibility;
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Are you an accredited investor?</Label>
            <YesNo value={e.accredited} onChange={(v) => setState((s) => ({ ...s, eligibility: { ...s.eligibility, accredited: v } }))} />
          </div>
          <div className="space-y-2">
            <Label>Comfortable with higher-risk investments?</Label>
            <YesNo value={e.highRisk} onChange={(v) => setState((s) => ({ ...s, eligibility: { ...s.eligibility, highRisk: v } }))} />
          </div>
          <div className="space-y-2">
            <Label>Comfortable with illiquid investments?</Label>
            <YesNo value={e.illiquid} onChange={(v) => setState((s) => ({ ...s, eligibility: { ...s.eligibility, illiquid: v } }))} />
          </div>

          <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
            <div className="font-medium">What this affects</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
              <li>Which products you can access</li>
              <li>Which disclosures and documents are required</li>
              <li>How quickly we can move your selected portfolio forward</li>
            </ul>
          </div>
        </div>
      );
    }

    if (step === "p2") {
      const i = state.investor;
      const isBiz = state.accountType === "trust" || state.accountType === "entity";
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Legal name / registered name</Label>
              <Input value={i.legalName} onChange={(v) => setState((s) => ({ ...s, investor: { ...s.investor, legalName: v } }))} placeholder="e.g., John A. Smith" />
            </div>
            <div className="space-y-1">
              <Label>Country</Label>
              <Input value={i.country} onChange={(v) => setState((s) => ({ ...s, investor: { ...s.investor, country: v } }))} placeholder="e.g., United States" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label>Street address</Label>
              <Input value={i.address1} onChange={(v) => setState((s) => ({ ...s, investor: { ...s.investor, address1: v } }))} placeholder="Street address" />
            </div>
            <div className="space-y-1">
              <Label>City</Label>
              <Input value={i.city} onChange={(v) => setState((s) => ({ ...s, investor: { ...s.investor, city: v } }))} placeholder="City" />
            </div>
            <div className="space-y-1">
              <Label>State / province</Label>
              <Input value={i.state} onChange={(v) => setState((s) => ({ ...s, investor: { ...s.investor, state: v } }))} placeholder="State" />
            </div>
            <div className="space-y-1">
              <Label>ZIP / postal code</Label>
              <Input value={i.zip} onChange={(v) => setState((s) => ({ ...s, investor: { ...s.investor, zip: v } }))} placeholder="ZIP" />
            </div>
          </div>

          {isBiz ? (
            <div className="space-y-1">
              <Label>Business type (required for this account type)</Label>
              <Input
                value={i.businessType}
                onChange={(v) => setState((s) => ({ ...s, investor: { ...s.investor, businessType: v } }))}
                placeholder="e.g., LLC / Revocable Trust"
              />
            </div>
          ) : null}
        </div>
      );
    }

    if (step === "p2contact") {
      const i = state.investor;
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Primary email</Label>
            <Input value={i.emailPrimary} onChange={(v) => setState((s) => ({ ...s, investor: { ...s.investor, emailPrimary: v } }))} placeholder="name@domain.com" />
          </div>
          <div className="space-y-1">
            <Label>Secondary email (optional)</Label>
            <Input value={i.emailSecondary} onChange={(v) => setState((s) => ({ ...s, investor: { ...s.investor, emailSecondary: v } }))} placeholder="name@domain.com" />
          </div>
          <div className="space-y-1">
            <Label>Primary phone</Label>
            <Input value={i.phonePrimary} onChange={(v) => setState((s) => ({ ...s, investor: { ...s.investor, phonePrimary: v } }))} placeholder="+1 (555) 123-4567" />
          </div>
          <div className="space-y-1">
            <Label>Secondary phone (optional)</Label>
            <Input value={i.phoneSecondary} onChange={(v) => setState((s) => ({ ...s, investor: { ...s.investor, phoneSecondary: v } }))} placeholder="+1 (555) 123-4567" />
          </div>
        </div>
      );
    }

    if (step === "p2tax") {
      const i = state.investor;
      return (
        <div className="space-y-4">
          <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">🔒</div>
              <div>
                <div className="font-medium">Why we ask this</div>
                <div className="mt-1 text-slate-600">
                  Tax ID is used for compliance checks and preparing purchase documentation. It’s stored securely.
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Tax ID type</Label>
              <Select
                value={i.taxIdType}
                onChange={(v) => setState((s) => ({ ...s, investor: { ...s.investor, taxIdType: v } }))}
                options={["SSN", "EIN"]}
              />
            </div>
            <div className="space-y-1">
              <Label>Tax ID</Label>
              <Input
                value={i.taxId}
                onChange={(v) => setState((s) => ({ ...s, investor: { ...s.investor, taxId: v } }))}
                placeholder={i.taxIdType === "SSN" ? "XXX-XX-XXXX" : "XX-XXXXXXX"}
              />
            </div>
          </div>
        </div>
      );
    }

    if (step === "p3fin") {
      const f = state.financials;
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Annual income (range)</Label>
            <Select value={f.incomeRange} onChange={(v) => setState((s) => ({ ...s, financials: { ...s.financials, incomeRange: v } }))} options={RANGE} />
          </div>
          <div className="space-y-1">
            <Label>Net worth (range)</Label>
            <Select value={f.netWorthRange} onChange={(v) => setState((s) => ({ ...s, financials: { ...s.financials, netWorthRange: v } }))} options={RANGE} />
          </div>
          <div className="space-y-1">
            <Label>Liquid assets (range)</Label>
            <Select value={f.liquidAssetsRange} onChange={(v) => setState((s) => ({ ...s, financials: { ...s.financials, liquidAssetsRange: v } }))} options={RANGE} />
          </div>
          <div className="space-y-1">
            <Label>Tax bracket</Label>
            <Input value={f.taxBracket} onChange={(v) => setState((s) => ({ ...s, financials: { ...s.financials, taxBracket: v } }))} placeholder="e.g., 24%" />
          </div>
          <div className="md:col-span-2 rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
            <div className="font-medium">Effort signaling</div>
            <div className="mt-1 text-slate-600">We use ranges to keep this step fast — you’ll only see follow-ups if needed.</div>
          </div>
        </div>
      );
    }

    if (step === "p4docs") {
      const d = state.docs;
      const pendingCount = [d.financialStatement, d.identification, d.newAccountForm].filter((x) => x !== "Uploaded").length;
      return (
        <div className="space-y-4">
          <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">🔒</div>
              <div>
                <div className="font-medium">Trust & legitimacy</div>
                <div className="mt-1 text-slate-600">Uploads are required to verify identity and satisfy compliance checks.</div>
              </div>
            </div>
          </div>

          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">Primary ID</div>
                <Hint>Status: {d.primaryIdUploaded ? "Uploaded" : "Not uploaded"}</Hint>
              </div>
              <button
                className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
                onClick={() => setState((s) => ({ ...s, docs: { ...s.docs, primaryIdUploaded: true, identification: "Uploaded" } }))}
              >
                Upload ID
              </button>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="font-medium">Required documents</div>
            {["financialStatement", "identification", "newAccountForm"].map((k) => (
              <div key={k} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">
                    {k === "financialStatement" ? "Financial statement" : k === "identification" ? "Identification" : "New account form"}
                  </div>
                  <Hint>Status: {d[k]}</Hint>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
                    onClick={() => setState((s) => ({ ...s, docs: { ...s.docs, [k]: "Uploaded" } }))}
                  >
                    Upload
                  </button>
                  <button
                    className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-slate-50"
                    onClick={() => setState((s) => ({ ...s, docs: { ...s.docs, [k]: "Pending" } }))}
                  >
                    Mark pending
                  </button>
                </div>
              </div>
            ))}

            <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
              <div className="font-medium">Submit with pending documents</div>
              <div className="mt-1 text-slate-600">
                You can submit now. If anything is missing, we’ll show exactly what’s needed on your status dashboard.
                {" "}Currently pending: <span className="font-medium">{pendingCount}</span>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    if (step === "p5review") {
      const i = state.investor;
      const e = state.eligibility;
      const f = state.financials;
      const d = state.docs;
      const pending = [d.financialStatement, d.identification, d.newAccountForm].filter((x) => x !== "Uploaded").length;
      return (
        <div className="space-y-4">
          <div className="rounded-lg border divide-y">
            <div className="flex items-start justify-between gap-3 p-4">
              <div>
                <div className="font-medium">Portfolio</div>
                <div className="text-sm text-slate-600">{state.portfolio.items.length} investments • Total {money(total)}</div>
              </div>
              <button className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-slate-50" onClick={() => setState((s) => ({ ...s, nav: { step: "p0" } }))}>Edit</button>
            </div>

            <div className="flex items-start justify-between gap-3 p-4">
              <div>
                <div className="font-medium">Eligibility</div>
                <div className="text-sm text-slate-600">Account type: <span className="font-medium">{state.accountType || "—"}</span> • Accredited: <span className="font-medium">{e.accredited || "—"}</span></div>
              </div>
              <button className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-slate-50" onClick={() => setState((s) => ({ ...s, nav: { step: "p1" } }))}>Edit</button>
            </div>

            <div className="flex items-start justify-between gap-3 p-4">
              <div>
                <div className="font-medium">Investor details</div>
                <div className="text-sm text-slate-600">{i.legalName || "—"} • {i.city || "—"}, {i.state || "—"} • {i.emailPrimary || "—"}</div>
              </div>
              <button className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-slate-50" onClick={() => setState((s) => ({ ...s, nav: { step: "p2" } }))}>Edit</button>
            </div>

            <div className="flex items-start justify-between gap-3 p-4">
              <div>
                <div className="font-medium">Financials</div>
                <div className="text-sm text-slate-600">Income: {f.incomeRange || "—"} • Net worth: {f.netWorthRange || "—"} • Liquid: {f.liquidAssetsRange || "—"}</div>
              </div>
              <button className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-slate-50" onClick={() => setState((s) => ({ ...s, nav: { step: "p3fin" } }))}>Edit</button>
            </div>

            <div className="flex items-start justify-between gap-3 p-4">
              <div>
                <div className="font-medium">Documents</div>
                <div className="text-sm text-slate-600">Primary ID: {d.primaryIdUploaded ? "Uploaded" : "Not uploaded"} • Pending: {pending}</div>
              </div>
              <button className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-slate-50" onClick={() => setState((s) => ({ ...s, nav: { step: "p4docs" } }))}>Edit</button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input type="checkbox" className="mt-1" checked={state.consent.accuracy} onChange={(e) => setState((s) => ({ ...s, consent: { ...s.consent, accuracy: e.target.checked } }))} />
              <div className="text-slate-700">I confirm the information provided is accurate.</div>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input type="checkbox" className="mt-1" checked={state.consent.checks} onChange={(e) => setState((s) => ({ ...s, consent: { ...s.consent, checks: e.target.checked } }))} />
              <div className="text-slate-700">I acknowledge required disclosures and consent to compliance checks.</div>
            </label>
          </div>

          <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
            <div className="font-medium">After submission</div>
            <div className="mt-1 text-slate-600">Your information will be reviewed. We’ll show next steps and any missing items on your dashboard.</div>
          </div>
        </div>
      );
    }

    // p6
    const pending = Object.entries(state.docs)
      .filter(([k]) => ["financialStatement", "identification", "newAccountForm"].includes(k))
      .filter(([, v]) => v !== "Uploaded")
      .map(([k]) => (k === "financialStatement" ? "Financial statement" : k === "identification" ? "Identification" : "New account form"));

    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="font-medium">Status</div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-900" />
              Submitted
              <span className="text-xs text-slate-500">({state.meta.submittedAt ? new Date(state.meta.submittedAt).toLocaleString() : "—"})</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-slate-300" /> Under review
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-slate-300" /> Ready to proceed
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="font-medium">What Stax is doing now</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Reviewing investor information and disclosures</li>
            <li>Validating uploaded documents</li>
            <li>Preparing next steps for your selected portfolio</li>
          </ul>
          <Hint className="mt-3">Typical review time: 1–2 business days</Hint>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="font-medium">What you can do</div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
              onClick={() => setState((s) => ({ ...s, nav: { step: "p4docs" } }))}
            >
              Upload missing documents
            </button>
            <button
              className="rounded-md border bg-white px-4 py-2 text-sm hover:bg-slate-50"
              onClick={() => setModal({ open: true, kicker: "Schedule", title: "Schedule a call (wireframe)", body: <div className="text-slate-600">In production, this would open scheduling.</div> })}
            >
              Schedule a call
            </button>
            <button
              className="rounded-md border bg-white px-4 py-2 text-sm hover:bg-slate-50"
              onClick={() => setModal({ open: true, kicker: "Portfolio", title: "Back to portfolio (wireframe)", body: <div className="text-slate-600">In production, this would return to the marketplace/portfolio builder.</div> })}
            >
              Back to portfolio
            </button>
          </div>

          {pending.length ? (
            <div className="rounded-lg border bg-slate-50 p-4 text-sm">
              <div className="font-medium">Pending documents</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
                {pending.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-sm text-slate-600">All documents are uploaded. You’re all set while we review.</div>
          )}
        </Card>
      </div>
    );
  };

  const canGoBack = !["p0"].includes(state.nav.step);

  const primaryLabel = state.nav.step === "p5review" ? "Submit for review →" : state.nav.step === "p6" ? "Stay on dashboard" : "Continue →";

  const lastSavedLabel = state.meta.lastSavedAt ? new Date(state.meta.lastSavedAt).toLocaleString() : "—";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-900" />
            <div className="font-semibold tracking-tight">STAX CAPITAL</div>
            <span className="ml-2 text-xs text-slate-500">Wireframe preview</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-sm text-slate-600 underline underline-offset-4 hover:text-slate-900" onClick={() => setModal({ open: true, kicker: "Help", title: "Need help?", body: <div className="text-slate-600">In production, this would open support/chat or scheduling.</div> })}>
              Need help?
            </button>
            <button className="text-sm text-slate-600 hover:text-slate-900" onClick={() => { saveNow(); setModal({ open: true, kicker: "Saved", title: "Saved for later", body: <div className="text-slate-600">Progress saved. You can resume anytime.</div> }); }}>
              Save & finish later
            </button>
            <button className="text-sm text-red-600 hover:text-red-700" onClick={() => reset()}>
              Reset
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-4">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {PHASES.map((p, idx) => (
              <span key={p.name} className={pillClass(idx === phaseIndex)}>
                {p.name}
              </span>
            ))}
          </div>
          <div className="mt-2 h-2 rounded bg-slate-200">
            <div className="h-2 rounded bg-slate-900" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="lg:col-span-8">
            <Card>
              <div className="border-b p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500">{header.kicker}</div>
                    <h1 className="text-xl font-semibold tracking-tight">{header.title}</h1>
                    <p className="text-sm text-slate-600">{header.sub}</p>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <span className="rounded-full border bg-slate-100 px-2 py-1 text-xs text-slate-700">{branchPill}</span>
                    <span className="rounded-full bg-slate-900 px-2 py-1 text-xs text-white">Required</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <StepBody />
              </div>

              <div className="rounded-b-xl border-t bg-slate-50 p-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <button
                    className="rounded-md border bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canGoBack}
          