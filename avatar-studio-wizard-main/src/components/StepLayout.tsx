import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { STEPS } from "@/store/wizardStore";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StepLayoutProps {
  step: number;
  title: string;
  subtitle: string;
  children: ReactNode;
  onNext: () => void;
  onBack: () => void;
  nextLabel?: string;
  canProceed?: boolean;
  isLast?: boolean;
  lastAction?: () => void;
  lastLabel?: string;
  primaryActionBusy?: boolean;
  primaryBusyLabel?: string;
}

export function StepLayout({
  step,
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextLabel,
  canProceed = true,
  isLast = false,
  lastAction,
  lastLabel,
  primaryActionBusy = false,
  primaryBusyLabel = "Working...",
}: StepLayoutProps) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <h2 className="font-display text-3xl font-bold text-foreground mb-2">{title}</h2>
            <p className="text-muted-foreground mb-8 text-sm">{subtitle}</p>
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="border-t border-border px-8 py-4 flex items-center justify-between bg-card/50 backdrop-blur-sm">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={step === 0}
          className="text-muted-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>

        <p className="text-xs text-muted-foreground">
          Step {step + 1} of {STEPS.length} — {STEPS[step].label}
        </p>

        {isLast ? (
          <Button
            onClick={lastAction || onNext}
            disabled={primaryActionBusy}
            className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan-sm font-semibold"
          >
            {primaryActionBusy ? primaryBusyLabel : lastLabel || "Export Video"}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!canProceed || primaryActionBusy}
            className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan-sm font-semibold disabled:opacity-40"
          >
            {primaryActionBusy ? primaryBusyLabel : nextLabel || "Next"}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
