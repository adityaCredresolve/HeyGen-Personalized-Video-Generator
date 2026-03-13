import { Sparkles, ClipboardPaste, FileText, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WizardState } from "@/store/wizardStore";

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
  const transcript = state.transcript;
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const duration = Math.max(1, Math.round(wordCount / 130));

  return (
    <div className="max-w-4xl">
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="surface-card p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Lead Details</p>
            <p className="text-xs text-muted-foreground">These required fields are merged into the transcript placeholders.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer Name" required>
              <Input
                value={state.customerName}
                onChange={(event) => update({ customerName: event.target.value, ...RESET_GENERATION_STATE })}
                placeholder="Ramesh Kumar"
                className="bg-secondary border-border"
              />
            </Field>
            <Field label="Loan Account Number" required>
              <Input
                value={state.lan}
                onChange={(event) => update({ lan: event.target.value, ...RESET_GENERATION_STATE })}
                placeholder="LAN12345"
                className="bg-secondary border-border"
              />
            </Field>
            <Field label="Client Name" required>
              <Input
                value={state.clientName}
                onChange={(event) => update({ clientName: event.target.value, ...RESET_GENERATION_STATE })}
                placeholder="ABC Finance"
                className="bg-secondary border-border"
              />
            </Field>
            <Field label="Total Outstanding" required>
              <Input
                value={state.tos}
                onChange={(event) => update({ tos: event.target.value, ...RESET_GENERATION_STATE })}
                placeholder="38450"
                className="bg-secondary border-border"
              />
            </Field>
          </div>
        </div>

        <div className="surface-card p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Optional Delivery Fields</p>
            <p className="text-xs text-muted-foreground">Keep defaults or tailor the request sent to FastAPI.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Loan Amount">
              <Input
                value={state.loanAmount}
                onChange={(event) => update({ loanAmount: event.target.value, ...RESET_GENERATION_STATE })}
                placeholder="120000"
                className="bg-secondary border-border"
              />
            </Field>
            <Field label="Helpline / Contact">
              <Input
                value={state.contactDetails}
                onChange={(event) => update({ contactDetails: event.target.value, ...RESET_GENERATION_STATE })}
                placeholder="1800-XXX-XXXX"
                className="bg-secondary border-border"
              />
            </Field>
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
          onClick={() => update({ transcript: "", ...RESET_GENERATION_STATE })}
          className="border-border text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          Clear
        </Button>
      </div>

      <Textarea
        value={transcript}
        onChange={(event) => update({ transcript: event.target.value, ...RESET_GENERATION_STATE })}
        placeholder={`Type or paste your script here...\n\nTip: Use [pause] for a 1-second pause, [emphasis] before important words.`}
        className="bg-secondary border-border min-h-[280px] resize-none rounded-xl text-sm leading-relaxed"
      />

      <p className="mt-2 text-xs text-muted-foreground">
        Placeholders like <code>{"{{customer_name}}"}</code>, <code>{"{{lan}}"}</code>, <code>{"{{client_name}}"}</code>,{" "}
        <code>{"{{tos}}"}</code>, and <code>{"{{contact_details}}"}</code> are rendered by the backend before submission.
      </p>

      <div className="flex justify-end gap-4 mt-3 text-xs text-muted-foreground">
        <span>{wordCount} words</span>
        <span>~{duration} min video</span>
      </div>
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
