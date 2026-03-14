import { ChangeEvent, useId, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ClipboardPaste,
  Copy,
  FileText,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AVATAR_TEMPLATES, REMOTION_TEMPLATES } from "@/lib/templates";
import { WizardState } from "@/store/wizardStore";

const RESET_GENERATION_STATE = {
  generatedVideo: null,
  styledVideoUrl: "",
  styledVideoPath: "",
  subtitleSource: "disabled" as const,
  generationStatus: "idle" as const,
  generationError: "",
};

type WizardFieldKey =
  | "customerName"
  | "lan"
  | "clientName"
  | "tos"
  | "loanAmount"
  | "contactDetails"
  | "productType";

interface FieldDefinition {
  key: WizardFieldKey;
  label: string;
  tags: string[];
  placeholder: string;
  required?: boolean;
}

const FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    key: "customerName",
    label: "Customer Name",
    tags: ["customer_name", "customer"],
    placeholder: "Ramesh Kumar",
    required: true,
  },
  {
    key: "lan",
    label: "Loan Account Number",
    tags: ["lan", "account_number"],
    placeholder: "LAN12345",
    required: true,
  },
  {
    key: "clientName",
    label: "Client Name",
    tags: ["client_name", "client"],
    placeholder: "ABC Finance",
    required: true,
  },
  {
    key: "tos",
    label: "Total Outstanding",
    tags: ["tos", "balance", "outstanding"],
    placeholder: "38,450",
    required: true,
  },
  {
    key: "loanAmount",
    label: "Loan Amount",
    tags: ["loan_amount", "loan_amt", "amt"],
    placeholder: "1,20,000",
  },
  {
    key: "contactDetails",
    label: "Helpline / Contact",
    tags: ["contact_details", "helpline", "contact"],
    placeholder: "1800-XXX-XXXX",
  },
  {
    key: "productType",
    label: "Product Type",
    tags: ["product_type", "product"],
    placeholder: "loan / insurance / credit card",
  },
];

const DEMO_FIELD_VALUES: Partial<Record<WizardFieldKey, string>> = {
  customerName: "Ramesh Kumar",
  lan: "LAN12345",
  clientName: "ABC Finance",
  tos: "38450",
  loanAmount: "120000",
  contactDetails: "1800-123-456",
  productType: "loan",
};

interface StepTranscriptProps {
  state: WizardState;
  update: (partial: Partial<WizardState>) => void;
}

function transcriptUsesPlaceholder(transcript: string, tags: string[]): boolean {
  const normalized = transcript.toLowerCase();
  return tags.some((tag) => {
    const lowerTag = tag.toLowerCase();
    return (
      normalized.includes(`{${lowerTag}}`) ||
      normalized.includes(`{{${lowerTag}}}`) ||
      normalized.includes(`{{ ${lowerTag} }}`)
    );
  });
}

function getFieldValue(state: WizardState, key: WizardFieldKey): string {
  switch (key) {
    case "customerName":
      return state.customerName;
    case "lan":
      return state.lan;
    case "clientName":
      return state.clientName;
    case "tos":
      return state.tos;
    case "loanAmount":
      return state.loanAmount;
    case "contactDetails":
      return state.contactDetails;
    case "productType":
      return state.productType;
  }
}

function updateField(
  update: (partial: Partial<WizardState>) => void,
  key: WizardFieldKey,
  value: string,
): void {
  switch (key) {
    case "customerName":
      update({ customerName: value, ...RESET_GENERATION_STATE });
      return;
    case "lan":
      update({ lan: value, ...RESET_GENERATION_STATE });
      return;
    case "clientName":
      update({ clientName: value, ...RESET_GENERATION_STATE });
      return;
    case "tos":
      update({ tos: value, ...RESET_GENERATION_STATE });
      return;
    case "loanAmount":
      update({ loanAmount: value, ...RESET_GENERATION_STATE });
      return;
    case "contactDetails":
      update({ contactDetails: value, ...RESET_GENERATION_STATE });
      return;
    case "productType":
      update({ productType: value, ...RESET_GENERATION_STATE });
      return;
  }
}

export function StepTranscript({ state, update }: StepTranscriptProps) {
  const importInputId = useId();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [showAllFields, setShowAllFields] = useState(false);
  const isRemotion = state.videoType === "remotion";
  const activeTemplates = isRemotion ? REMOTION_TEMPLATES : AVATAR_TEMPLATES;
  const transcript = isRemotion ? state.remotionTranscript : state.transcript;
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const duration = Math.max(1, Math.round(wordCount / 130));
  const isLongTranscript = wordCount > 300;

  const visibleFields = useMemo(
    () =>
      FIELD_DEFINITIONS.filter(
        (field) =>
          showAllFields || field.required || transcriptUsesPlaceholder(transcript, field.tags),
      ),
    [showAllFields, transcript],
  );

  const getErrorClass = (value: string, required = false) =>
    required && !value.trim()
      ? "ring-1 ring-destructive border-transparent focus-visible:ring-destructive bg-destructive/5"
      : "bg-secondary border-border";

  const handleTranscriptChange = (value: string) => {
    if (isRemotion) {
      update({ remotionTranscript: value, ...RESET_GENERATION_STATE });
      return;
    }
    update({ transcript: value, ...RESET_GENERATION_STATE });
  };

  const handleApplyTemplate = (script: string) => {
    handleTranscriptChange(script);
    toast.success("Transcript template applied.");
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText.trim()) {
        toast.info("Clipboard is empty.");
        return;
      }
      handleTranscriptChange(clipboardText);
      toast.success("Transcript pasted from clipboard.");
    } catch {
      toast.error("Clipboard access is not available in this browser.");
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      handleTranscriptChange(text);
      toast.success(`${file.name} imported.`);
    } catch {
      toast.error("Unable to read that transcript file.");
    } finally {
      event.target.value = "";
    }
  };

  const handleDemoTab =
    (fieldKey: WizardFieldKey) => (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        event.key !== "Tab" ||
        event.shiftKey ||
        event.altKey ||
        event.metaKey ||
        event.ctrlKey
      ) {
        return;
      }

      const currentValue = getFieldValue(state, fieldKey).trim();
      const demoValue = DEMO_FIELD_VALUES[fieldKey];
      if (!demoValue || currentValue) {
        return;
      }

      updateField(update, fieldKey, demoValue);
    };

  return (
    <div className="max-w-5xl">
      <Accordion type="single" collapsible className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-4">
        <AccordionItem value="library" className="border-0">
          <AccordionTrigger className="py-4 hover:no-underline">
            <div className="flex items-center gap-3 text-left">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Reference Transcript Library</p>
                <p className="text-xs text-muted-foreground">
                  {Object.keys(activeTemplates).length} starter scripts for {isRemotion ? "ScriptMotion" : "avatar"} mode
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 pt-2">
              {Object.entries(activeTemplates).map(([language, script]) => (
                <div key={language} className="surface-card p-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{language}</p>
                      <p className="text-xs text-muted-foreground">
                        {script.trim().split(/\s+/).length} words
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleApplyTemplate(script)}>
                      Apply
                    </Button>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground line-clamp-5">{script}</p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="surface-card p-5 space-y-5 mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Lead Personalization</p>
            <p className="text-xs text-muted-foreground">
              Required lead fields stay pinned. Extra fields appear when their placeholders are detected in the transcript.
            </p>
            <p className="mt-1 text-xs text-primary/80">
              Demo shortcut: press Tab in an empty field to auto-fill sample data.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Show All Fields</p>
              <p className="text-xs text-muted-foreground">Reveal optional placeholders even if they are not used yet.</p>
            </div>
            <Switch checked={showAllFields} onCheckedChange={setShowAllFields} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleFields.map((field) => (
            <Field key={field.key} label={field.label} required={field.required}>
              <Input
                value={getFieldValue(state, field.key)}
                onChange={(event) => updateField(update, field.key, event.target.value)}
                onKeyDown={handleDemoTab(field.key)}
                placeholder={field.placeholder}
                className={getErrorClass(getFieldValue(state, field.key), field.required)}
              />
            </Field>
          ))}

          <Field label="Title Prefix">
            <Input
              value={state.titlePrefix}
              onChange={(event) => update({ titlePrefix: event.target.value, ...RESET_GENERATION_STATE })}
              placeholder="Loan Recall"
              className="bg-secondary border-border"
            />
          </Field>

          <Field label="Fallback Template">
            <select
              value={state.templateName}
              onChange={(event) => update({ templateName: event.target.value, ...RESET_GENERATION_STATE })}
              className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="legal_notice_safe_hi.txt">legal_notice_safe_hi.txt</option>
              <option value="legal_notice_raw_hi.txt">legal_notice_raw_hi.txt</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Button size="sm" type="button" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-purple-sm">
          <Sparkles className="mr-1.5 h-4 w-4" />
          AI Prompting Soon
        </Button>
        <Button size="sm" type="button" variant="outline" onClick={() => void handlePaste()}>
          <ClipboardPaste className="mr-1.5 h-4 w-4" />
          Paste Script
        </Button>
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => importInputRef.current?.click()}
        >
          <FileText className="mr-1.5 h-4 w-4" />
          Import .txt
        </Button>
        <input
          ref={importInputRef}
          id={importInputId}
          type="file"
          accept=".txt,text/plain"
          className="sr-only"
          onChange={handleImport}
        />
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => handleTranscriptChange("")}
          className="border-border text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          Clear
        </Button>
      </div>

      <Textarea
        value={transcript}
        onChange={(event) => handleTranscriptChange(event.target.value)}
        placeholder={`Type or paste your script here...\n\nBoth {tag} and {{tag}} placeholder styles are supported.`}
        className={`${getErrorClass(transcript, true)} min-h-[300px] resize-none rounded-xl text-sm leading-relaxed`}
      />

      <div className="mt-4 rounded-xl border border-secondary bg-secondary/30 p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm font-semibold text-foreground">Supported Placeholders</p>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Click a tag to copy it
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {FIELD_DEFINITIONS.map((field) => (
            <PlaceholderTag
              key={field.key}
              tag={field.tags[0]}
              shorthand={field.tags.slice(1).join(", ")}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-3 text-xs">
        <span className={isLongTranscript ? "text-amber-500 font-medium flex items-center" : "text-muted-foreground"}>
          {isLongTranscript && <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
          {wordCount} words {isLongTranscript ? "(Generation may take longer)" : ""}
        </span>
        <span className="text-muted-foreground">~{duration} min video</span>
      </div>
    </div>
  );
}

function PlaceholderTag({ tag, shorthand }: { tag: string; shorthand?: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`{{${tag}}}`);
      toast.success(`Copied {{${tag}}}`);
    } catch {
      toast.error("Clipboard access failed.");
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="inline-flex items-start gap-2 rounded-lg border border-border bg-background/80 px-3 py-2 text-left hover:border-primary/40 hover:bg-background"
    >
      <Copy className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
      <span>
        <code className="block text-[12px] font-semibold text-primary">{`{{${tag}}}`}</code>
        {shorthand ? <span className="text-[10px] text-muted-foreground">alt: {shorthand}</span> : null}
      </span>
    </button>
  );
}

function Field({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      {children}
    </div>
  );
}
