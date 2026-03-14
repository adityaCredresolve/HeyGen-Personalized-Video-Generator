import { Sparkles, ClipboardPaste, FileText, Trash2, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WizardState } from "@/store/wizardStore";
import { toast } from "sonner";
import { REMOTION_TEMPLATES } from "@/lib/templates";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const RESET_GENERATION_STATE = {
  generatedVideo: null,
  generationStatus: "idle" as const,
  generationError: "",
};

interface StepTranscriptProps {
  state: WizardState;
  update: (partial: Partial<WizardState>) => void;
}

export function StepTranscript({ state, update }: StepTranscriptProps) {
  const isRemotion = state.videoType === "remotion";
  const transcript = isRemotion ? state.remotionTranscript : state.transcript;
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const duration = Math.max(1, Math.round(wordCount / 130));
  const isLongTranscript = wordCount > 300;
  
  const getErrorClass = (val: string) => 
    !val.trim() 
      ? "ring-1 ring-destructive border-transparent focus-visible:ring-destructive bg-destructive/5" 
      : "bg-secondary border-border";

  const [showLibrary, setShowLibrary] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);

  const handleTranscriptChange = (value: string) => {
    if (isRemotion) {
      update({ remotionTranscript: value, ...RESET_GENERATION_STATE });
    } else {
      update({ transcript: value, ...RESET_GENERATION_STATE });
    }
  };

  const applyTemplate = (script: string) => {
    handleTranscriptChange(script);
    setShowLibrary(false);
    toast.success("Template applied!");
  };

  const hasPlaceholder = (tags: string[]) => {
    if (showAllFields) return true;
    const lowerTranscript = transcript.toLowerCase();
    return tags.some(tag => 
      lowerTranscript.includes(`{${tag.toLowerCase()}}`) || 
      lowerTranscript.includes(`{{${tag.toLowerCase()}}}`) ||
      lowerTranscript.includes(`{{ ${tag.toLowerCase()} }}`)
    );
  };

  const fields = {
    customerName: { label: "Customer Name", tags: ["customer_name", "customer"], placeholder: "Ramesh Kumar", required: true },
    lan: { label: "Loan Account Number", tags: ["lan", "account_number"], placeholder: "LAN12345", required: true },
    clientName: { label: "Client Name", tags: ["client_name", "client"], placeholder: "ABC Finance", required: true },
    tos: { label: "Total Outstanding", tags: ["tos", "balance", "outstanding"], placeholder: "38450", required: true },
    loanAmount: { label: "Loan Amount", tags: ["loan_amount", "loan_amt", "amt"], placeholder: "120000" },
    contactDetails: { label: "Helpline / Contact", tags: ["contact_details", "helpline", "contact"], placeholder: "1800-XXX-XXXX" },
    productType: { label: "Product Type", tags: ["product_type", "product"], placeholder: "loan / insurance / credit card" },
  };

  return (
    <div className="max-w-4xl">
      {/* Reference Library Section */}
      <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
        <button 
          onClick={() => setShowLibrary(!showLibrary)}
          className="w-full flex items-center justify-between p-4 hover:bg-primary/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Reference Transcript Library</span>
            <span className="text-xs text-muted-foreground ml-2 px-2 py-0.5 rounded-full bg-secondary border border-border">10+ Templates</span>
          </div>
          {showLibrary ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {showLibrary && (
          <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 border-t border-primary/10">
            {Object.entries(REMOTION_TEMPLATES).map(([lang, script]) => (
              <div key={lang} className="surface-card p-3 flex flex-col justify-between hover:border-primary/50 transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold">{lang}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{script.length} chars</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3 mb-4 italic">
                    "{script.substring(0, 100)}..."
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full h-8 text-xs border-primary/20 hover:bg-primary hover:text-primary-foreground"
                  onClick={() => applyTemplate(script)}
                >
                  Apply {lang}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h3 className="text-lg font-bold text-foreground">Lead Personalization</h3>
          <p className="text-xs text-muted-foreground">Fields below appear dynamically based on your transcript placeholders.</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-lg border border-border">
          <span className="text-xs font-semibold">Show All Fields</span>
          <input 
            type="checkbox" 
            checked={showAllFields} 
            onChange={(e) => setShowAllFields(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-secondary"
          />
        </div>
      </div>

      <div className="surface-card p-6 mb-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hasPlaceholder(fields.customerName.tags) && (
            <Field label={fields.customerName.label} required={fields.customerName.required}>
              <Input
                value={state.customerName}
                onChange={(event) => update({ customerName: event.target.value, ...RESET_GENERATION_STATE })}
<<<<<<< Updated upstream
                placeholder="Ramesh Kumar"
                className={getErrorClass(state.customerName)}
              />
            </Field>
            <Field label="Loan Account Number" required>
              <Input
                value={state.lan}
                onChange={(event) => update({ lan: event.target.value, ...RESET_GENERATION_STATE })}
                placeholder="LAN12345"
                className={getErrorClass(state.lan)}
              />
            </Field>
            <Field label="Client Name" required>
              <Input
                value={state.clientName}
                onChange={(event) => update({ clientName: event.target.value, ...RESET_GENERATION_STATE })}
                placeholder="ABC Finance"
                className={getErrorClass(state.clientName)}
=======
                placeholder={fields.customerName.placeholder}
                className="bg-secondary border-border"
              />
            </Field>
          )}

          {hasPlaceholder(fields.clientName.tags) && (
            <Field label={fields.clientName.label} required={fields.clientName.required}>
              <Input
                value={state.clientName}
                onChange={(event) => update({ clientName: event.target.value, ...RESET_GENERATION_STATE })}
                placeholder={fields.clientName.placeholder}
                className="bg-secondary border-border"
>>>>>>> Stashed changes
              />
            </Field>
          )}

          {hasPlaceholder(fields.lan.tags) && (
            <Field label={fields.lan.label} required={fields.lan.required}>
              <Input
                value={state.lan}
                onChange={(event) => update({ lan: event.target.value, ...RESET_GENERATION_STATE })}
                placeholder={fields.lan.placeholder}
                className="bg-secondary border-border"
              />
            </Field>
          )}

          {hasPlaceholder(fields.tos.tags) && (
            <Field label={fields.tos.label} required={fields.tos.required}>
              <Input
                value={state.tos}
                onChange={(event) => update({ tos: event.target.value, ...RESET_GENERATION_STATE })}
<<<<<<< Updated upstream
                placeholder="38450"
                className={getErrorClass(state.tos)}
=======
                placeholder={fields.tos.placeholder}
                className="bg-secondary border-border"
>>>>>>> Stashed changes
              />
            </Field>
          )}

          {hasPlaceholder(fields.loanAmount.tags) && (
            <Field label={fields.loanAmount.label}>
              <Input
                value={state.loanAmount}
                onChange={(event) => update({ loanAmount: event.target.value, ...RESET_GENERATION_STATE })}
                placeholder={fields.loanAmount.placeholder}
                className="bg-secondary border-border"
              />
            </Field>
          )}

          {hasPlaceholder(fields.contactDetails.tags) && (
            <Field label={fields.contactDetails.label}>
              <Input
                value={state.contactDetails}
                onChange={(event) => update({ contactDetails: event.target.value, ...RESET_GENERATION_STATE })}
                placeholder={fields.contactDetails.placeholder}
                className="bg-secondary border-border"
              />
            </Field>
          )}

          {hasPlaceholder(fields.productType.tags) && (
            <Field label={fields.productType.label}>
              <Input
                value={state.productType}
                onChange={(event) => update({ productType: event.target.value, ...RESET_GENERATION_STATE })}
                placeholder={fields.productType.placeholder}
                className="bg-secondary border-border"
              />
            </Field>
          )}

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
        
        {!showAllFields && Object.values(fields).every(f => !hasPlaceholder(f.tags)) && (
          <div className="py-8 text-center border-2 border-dashed border-border rounded-xl">
            <p className="text-sm text-muted-foreground italic">No placeholders detected in your script yet.</p>
            <p className="text-[10px] text-muted-foreground mt-1">Start typing or use "Show All Fields" to see all options.</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Button size="sm" type="button" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-purple-sm">
          <Sparkles className="mr-1.5 h-4 w-4" />
          AI Prompting Soon
        </Button>
        <Button size="sm" type="button" variant="outline" className="border-border text-muted-foreground hover:text-foreground">
          <ClipboardPaste className="mr-1.5 h-4 w-4" />
          Paste Script
        </Button>
        <Button size="sm" type="button" variant="outline" className="border-border text-muted-foreground hover:text-foreground">
          <FileText className="mr-1.5 h-4 w-4" />
          Import .txt
        </Button>
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
<<<<<<< Updated upstream
        onChange={(event) => update({ transcript: event.target.value, ...RESET_GENERATION_STATE })}
        placeholder={`Type or paste your script here...\n\nTip: Use [pause] for a 1-second pause, [emphasis] before important words.`}
        className={`${getErrorClass(transcript)} min-h-[280px] resize-none rounded-xl text-sm leading-relaxed`}
=======
        onChange={(event) => handleTranscriptChange(event.target.value)}
        placeholder={`Type or paste your script here...\n\nTip: Use [pause] for a 1-second pause, [emphasis] before important words.\n\nLeave empty to use the default high-quality legal template.`}
        className="bg-secondary border-border min-h-[280px] resize-none rounded-xl text-sm leading-relaxed"
>>>>>>> Stashed changes
      />

      <div className="mt-4 p-4 rounded-xl border border-secondary bg-secondary/30">
        <p className="text-sm font-semibold mb-2">Supported Placeholders (Both <code>{`{tag}`}</code> and <code>{`{{tag}}`}</code> work):</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <PlaceholderTag tag="customer_name" shorthand="customer" />
          <PlaceholderTag tag="client_name" shorthand="client" />
          <PlaceholderTag tag="loan_amount" shorthand="loan_amt, amt" />
          <PlaceholderTag tag="product_type" shorthand="product" />
          <PlaceholderTag tag="tos" shorthand="balance, outstanding" />
          <PlaceholderTag tag="lan" shorthand="account_number" />
          <PlaceholderTag tag="contact_details" shorthand="helpline, contact" />
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Pro Tip: Click any tag to copy it to clipboard</p>
      </div>

      <div className="flex justify-end gap-4 mt-3 text-xs">
        <span className={isLongTranscript ? "text-amber-500 font-medium flex items-center" : "text-muted-foreground"}>
          {isLongTranscript && <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
          {wordCount} words {isLongTranscript && "(Generation may take longer)"}
        </span>
        <span className="text-muted-foreground">~{duration} min video</span>
      </div>
    </div>
  );
}

function PlaceholderTag({ tag, shorthand }: { tag: string; shorthand?: string }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(`{{${tag}}}`);
    toast.success(`Copied {{${tag}}}`);
  };

  return (
    <div 
      onClick={copyToClipboard}
      className="cursor-pointer group flex flex-col"
    >
      <code className="text-[12px] text-primary font-bold group-hover:underline">{"{{"}{tag}{"}}"}</code>
      {shorthand && <span className="text-[10px] text-muted-foreground italic">alt: {shorthand}</span>}
    </div>
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
