import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useWizardStore, STEPS } from "@/store/wizardStore";
import { HeaderBar } from "@/components/HeaderBar";
import { WorkflowSidebar } from "@/components/WorkflowSidebar";
import { StepLayout } from "@/components/StepLayout";
import { StepLanguage } from "@/components/steps/StepLanguage";
import { StepAvatar } from "@/components/steps/StepAvatar";
import { StepTranscript } from "@/components/steps/StepTranscript";
import { StepSubtitle } from "@/components/steps/StepSubtitle";
import { StepPreview } from "@/components/steps/StepPreview";
import { StepShare } from "@/components/steps/StepShare";
import { toast } from "sonner";
import { DirectVideoPayload, fetchAvatars, fetchVideoStatus, generateDirectVideo } from "@/lib/api";

const STEP_META = [
  { title: "Select Language", subtitle: "Choose the language for your avatar's voice and generated content.", next: "Next: Avatar →" },
  { title: "Choose Your Avatar", subtitle: "Select an AI avatar to represent your brand in the video.", next: "Next: Transcript →" },
  { title: "Add Transcript", subtitle: "Write or generate your video script. Use [pause] for timing, [emphasis] for key words.", next: "Next: Subtitle & Logo →" },
  { title: "Subtitles & Branding", subtitle: "Style your captions and add your company logo.", next: "Next: Preview →" },
  { title: "Preview Video", subtitle: "Review your avatar video before exporting.", next: "Next: Share →" },
  { title: "Share & Export", subtitle: "Export your video or share it with your team.", next: "" },
];

const ASPECT_RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
  "1:1": { width: 1080, height: 1080 },
};

const RESET_GENERATION_STATE = {
  generatedVideo: null,
  generationStatus: "idle" as const,
  generationError: "",
};

const Index = () => {
  const { state, update, nextStep, prevStep, goToStep, reset, canProceed } = useWizardStore();
  const step = state.currentStep;
  const meta = STEP_META[step];
  const avatarsQuery = useQuery({
    queryKey: ["heygen-avatars"],
    queryFn: fetchAvatars,
  });
  const statusQuery = useQuery({
    queryKey: ["heygen-video-status", state.generatedVideo?.video_id],
    queryFn: () => fetchVideoStatus(state.generatedVideo!.video_id, state.generatedVideo?.request_mode ?? "direct"),
    enabled: Boolean(state.generatedVideo?.video_id) && state.generationStatus === "submitting",
    refetchInterval: 5000,
  });
  const generateVideoMutation = useMutation({
    mutationFn: (payload: DirectVideoPayload) => generateDirectVideo(payload, false),
    onMutate: () => {
      update({
        generationStatus: "submitting",
        generationError: "",
      });
    },
    onSuccess: (result) => {
      update({
        generatedVideo: result,
        generationStatus: "submitting",
        generationError: "",
      });
      toast.success("Video submitted to HeyGen. We’ll keep checking the status.");
    },
    onError: (error) => {
      update({
        generationStatus: "failed",
        generationError: error instanceof Error ? error.message : "Unexpected error while generating the video.",
      });
      toast.error(error instanceof Error ? error.message : "Unexpected error while generating the video.");
    },
  });

  useEffect(() => {
    if (!statusQuery.data || state.generationStatus !== "submitting") {
      return;
    }

    if (state.generatedVideo?.video_id !== statusQuery.data.video_id) {
      return;
    }

    const nextStatus = statusQuery.data.status.toLowerCase();
    if (["completed", "done", "success"].includes(nextStatus)) {
      update({
        generatedVideo: statusQuery.data,
        generationStatus: "completed",
        generationError: "",
      });
      toast.success("Video generated successfully.");
      return;
    }

    update({
      generatedVideo: statusQuery.data,
    });
  }, [state.generatedVideo?.video_id, state.generationStatus, statusQuery.data, update]);

  useEffect(() => {
    if (!statusQuery.error || state.generationStatus !== "submitting") {
      return;
    }

    update({
      generationStatus: "failed",
      generationError: statusQuery.error instanceof Error ? statusQuery.error.message : "Unexpected error while checking video status.",
    });
    toast.error(statusQuery.error instanceof Error ? statusQuery.error.message : "Unexpected error while checking video status.");
  }, [state.generationStatus, statusQuery.error, update]);

  const handleCreateVideo = () => {
    generateVideoMutation.reset();
    reset();
    toast.success("New video draft started!");
  };

  const handleExport = () => {
    if (state.generationStatus === "submitting") {
      toast.info("This video is still generating. Please wait for the current job to finish.");
      return;
    }

    if (!state.avatarId.trim()) {
      toast.error("Select an avatar before generating the video.");
      goToStep(1);
      return;
    }

    if (!state.customerName.trim() || !state.lan.trim() || !state.clientName.trim() || !state.tos.trim() || !state.transcript.trim()) {
      toast.error("Complete the lead details and transcript before generating the video.");
      goToStep(2);
      return;
    }

    const dimensions = ASPECT_RATIO_DIMENSIONS[state.aspectRatio] ?? ASPECT_RATIO_DIMENSIONS["16:9"];
    const payload: DirectVideoPayload = {
      customer_name: state.customerName.trim(),
      lan: state.lan.trim(),
      client_name: state.clientName.trim(),
      tos: state.tos.trim(),
      loan_amount: state.loanAmount.trim() || undefined,
      contact_details: state.contactDetails.trim() || undefined,
      avatar_id: state.avatarId.trim() || undefined,
      template_name: state.templateName,
      script_text: state.transcript.trim() || undefined,
      background_color: state.backgroundColor,
      include_captions: state.includeCaptions,
      title_prefix: state.titlePrefix.trim() || undefined,
      video_width: dimensions.width,
      video_height: dimensions.height,
    };

    generateVideoMutation.mutate(payload);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <StepLanguage
            selected={state.language}
            onSelect={(lang) => update({ language: lang, outputLanguage: lang })}
          />
        );
      case 1:
        return (
          <StepAvatar
            avatars={avatarsQuery.data ?? []}
            isLoading={avatarsQuery.isLoading}
            errorMessage={avatarsQuery.error instanceof Error ? avatarsQuery.error.message : null}
            selectedId={state.avatarId}
            filter={state.avatarFilter}
            onSelect={(id) => update({ avatarId: id, ...RESET_GENERATION_STATE })}
            onFilterChange={(f) => update({ avatarFilter: f })}
          />
        );
      case 2:
        return <StepTranscript state={state} update={update} />;
      case 3:
        return <StepSubtitle state={state} update={update} />;
      case 4:
        return <StepPreview state={state} update={update} />;
      case 5:
        return <StepShare state={state} update={update} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <HeaderBar onCreateVideo={handleCreateVideo} primaryLabel="New Draft" />
      <div className="flex flex-1 overflow-hidden">
        <WorkflowSidebar currentStep={step} onStepClick={goToStep} />
        <StepLayout
          step={step}
          title={meta.title}
          subtitle={meta.subtitle}
          onNext={nextStep}
          onBack={prevStep}
          nextLabel={meta.next}
          canProceed={canProceed()}
          isLast={step === STEPS.length - 1}
          lastAction={handleExport}
          lastLabel={state.generatedVideo ? "Regenerate Video" : "Generate Video"}
          primaryActionBusy={generateVideoMutation.isPending}
          primaryBusyLabel="Generating..."
        >
          {renderStep()}
        </StepLayout>
      </div>
    </div>
  );
};

export default Index;
