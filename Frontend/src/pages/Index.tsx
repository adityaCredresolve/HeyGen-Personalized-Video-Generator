import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { HeaderBar } from "@/components/HeaderBar";
import { StepLayout } from "@/components/StepLayout";
import { WorkflowSidebar } from "@/components/WorkflowSidebar";
import { StepAvatar } from "@/components/steps/StepAvatar";
import { StepLanguage } from "@/components/steps/StepLanguage";
import { StepPreview } from "@/components/steps/StepPreview";
import { StepShare } from "@/components/steps/StepShare";
import { StepSubtitle } from "@/components/steps/StepSubtitle";
import { StepTranscript } from "@/components/steps/StepTranscript";
import {
  DEFAULT_AVATAR_SCRIPT,
  REMOTION_TEMPLATES,
} from "@/lib/templates";
import {
  DirectVideoPayload,
  fetchAvatars,
  fetchVideoStatus,
  generateDirectVideo,
  generateRemotionVideo,
  stylizeVideo,
  saveDraft,
} from "@/lib/api";
import { STEPS, useWizardStore } from "@/store/wizardStore";

const getStepMeta = (step: number, videoType: "avatar" | "remotion") => {
  const meta = [
    {
      title: "Select Language",
      subtitle: "Choose your desired language.",
      next: videoType === "remotion" ? "Next: Transcript →" : "Next: Avatar →",
    },
    {
      title: "Choose Your Avatar",
      subtitle: "Select an avatar for your video.",
      next: "Next: Transcript →",
    },
    {
      title: "Add Transcript",
      subtitle: "Customize your script and lead details.",
      next: "Next: Subtitle & Logo →",
    },
    {
      title: "Subtitles & Branding",
      subtitle: "Configure captions and logo placement.",
      next: "Next: Preview →",
    },
    {
      title: "Preview Video",
      subtitle: "Review your finished output.",
      next: "Next: Share →",
    },
    {
      title: "Share & Export",
      subtitle: "Download or share your video.",
      next: "",
    },
  ];
  return meta[step];
};

const ASPECT_RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
  "1:1": { width: 1080, height: 1080 },
};

const RESET_GENERATION_STATE = {
  generatedVideo: null,
  styledVideoUrl: "",
  styledVideoPath: "",
  subtitleSource: "disabled" as const,
  generationStatus: "idle" as const,
  generationError: "",
};

function isConnectivityError(error: unknown): boolean {
  return error instanceof Error && /could not reach the server|failed to fetch|networkerror|load failed/i.test(error.message);
}

const Index = () => {
  const { state, update, nextStep, prevStep, goToStep, reset, canProceed } = useWizardStore();
  const navigate = useNavigate();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const stylingRequestedRef = useRef(false);
  const draftSyncWarningShownRef = useRef(false);
  const statusPollingWarningShownRef = useRef(false);
  const step = state.currentStep;
  const meta = getStepMeta(step, state.videoType);
  const activeTranscript = state.videoType === "remotion" ? state.remotionTranscript : state.transcript;
  const isProcessing = state.generationStatus === "submitting" || state.generationStatus === "styling";
  const requestedMode = searchParams.get("mode");
  const requestedFreshDraft = searchParams.get("fresh") === "1";

  const avatarsQuery = useQuery({
    queryKey: ["avatars"],
    queryFn: fetchAvatars,
    enabled: state.videoType === "avatar",
  });

  const statusQuery = useQuery({
    queryKey: ["video-status", state.generatedVideo?.video_id],
    queryFn: () => fetchVideoStatus(state.generatedVideo!.video_id, state.generatedVideo?.request_mode ?? "direct"),
    enabled:
      Boolean(state.generatedVideo?.video_id) &&
      state.generatedVideo?.request_mode !== "remotion" &&
      state.generationStatus === "submitting",
    refetchInterval: 5000,
  });

  const generateVideoMutation = useMutation({
    mutationFn: (payload: DirectVideoPayload) => generateDirectVideo(payload, false),
    onMutate: () => {
      stylingRequestedRef.current = false;
      statusPollingWarningShownRef.current = false;
      update({
        generationStatus: "submitting",
        generationError: "",
        styledVideoUrl: "",
        styledVideoPath: "",
        subtitleSource: "disabled",
      });
    },
    onSuccess: (result) => {
      statusPollingWarningShownRef.current = false;
      update({
        generatedVideo: result,
        generationStatus: "submitting",
        generationError: "",
      });
      const wordCount = activeTranscript.trim() ? activeTranscript.trim().split(/\s+/).length : 0;
      const durationMin = Math.max(1, Math.round(wordCount / 130));
      const estTime = Math.max(2, durationMin * 2);
      toast.success(`Video creation under progress. Estimated time: ~${estTime} mins. We'll notify you when it's ready.`);
    },
    onError: (error) => {
      update({
        generationStatus: "failed",
        generationError: error instanceof Error ? error.message : "Unexpected error while generating the video.",
      });
      toast.error(error instanceof Error ? error.message : "Unexpected error while generating the video.");
    },
  });

  const generateRemotionMutation = useMutation({
    mutationFn: (payload: DirectVideoPayload) => generateRemotionVideo(payload),
    onMutate: () => {
      stylingRequestedRef.current = false;
      statusPollingWarningShownRef.current = false;
      update({
        generationStatus: "submitting",
        generationError: "",
        styledVideoUrl: "",
        styledVideoPath: "",
        subtitleSource: "disabled",
      });
    },
    onSuccess: (result) => {
      statusPollingWarningShownRef.current = false;
      update({
        generatedVideo: result,
        generationStatus: "completed",
        generationError: "",
      });
      toast.success("Text to Video render generated successfully.");
      goToStep(5);
    },
    onError: (error) => {
      update({
        generationStatus: "failed",
        generationError: error instanceof Error ? error.message : "Unexpected error while generating the text video.",
      });
      toast.error(error instanceof Error ? error.message : "Unexpected error while generating the text video.");
    },
  });

  const stylizeVideoMutation = useMutation({
    mutationFn: (videoId: string) =>
      stylizeVideo(videoId, {
        includeCaptions: state.includeCaptions,
        subtitleColor: state.subtitleColor,
        subtitlePosition: state.subtitlePosition,
        transcript: state.transcript,
        logoPosition: state.logoPosition,
        logoOpacity: state.logoOpacity,
        logoFile,
      }),
    onMutate: () => {
      update({
        generationStatus: "styling",
        generationError: "",
      });
    },
    onSuccess: (result) => {
      stylingRequestedRef.current = true;
      update({
        styledVideoUrl: result.final_video_url,
        styledVideoPath: result.final_video_path,
        subtitleSource: result.subtitle_source,
        generationStatus: "completed",
        generationError: "",
      });
      toast.success("Video generated and styled successfully.");
      goToStep(5);
    },
    onError: (error) => {
      stylingRequestedRef.current = false;
      const baseVideoUrl = state.generatedVideo?.video_url ?? "";
      if (baseVideoUrl) {
        update({
          generationStatus: "completed",
          generationError: "",
          styledVideoUrl: "",
          styledVideoPath: "",
          subtitleSource: "disabled",
        });
        toast.info("Your video is ready. Extra branding could not be applied, so we opened the standard version.");
        goToStep(5);
        return;
      }

      toast.error(error instanceof Error ? error.message : "Unexpected error while styling the video.");
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: (draft: any) => saveDraft(draft),
    onSuccess: () => {
      draftSyncWarningShownRef.current = false;
    },
    onError: () => {
      if (draftSyncWarningShownRef.current) {
        return;
      }

      draftSyncWarningShownRef.current = true;
      toast.info("Cloud draft sync is unavailable right now. Your current draft is still saved locally in this browser.");
    },
  });

  // Auto-save draft whenever state changes significantly
  useEffect(() => {
    if (step < 4) {
      const timer = setTimeout(() => {
        saveDraftMutation.mutate(state);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state, step]);

  useEffect(() => {
    if (!statusQuery.data || state.generationStatus !== "submitting") {
      return;
    }

    if (state.generatedVideo?.video_id !== statusQuery.data.video_id) {
      return;
    }

    const nextStatus = statusQuery.data.status.toLowerCase();
    if (["completed", "done", "success"].includes(nextStatus)) {
      statusPollingWarningShownRef.current = false;
      update({ generatedVideo: statusQuery.data, generationError: "" });
      if (state.videoType === "avatar" && (state.includeCaptions || logoFile) && !stylingRequestedRef.current) {
        stylingRequestedRef.current = true;
        stylizeVideoMutation.mutate(statusQuery.data.video_id);
      } else {
        update({
          generationStatus: "completed",
          generationError: "",
        });
        toast.success("Video generated successfully.");
        goToStep(5);
      }
      return;
    }

    update({
      generatedVideo: statusQuery.data,
    });
  }, [
    goToStep,
    logoFile,
    state.generatedVideo?.video_id,
    state.generationStatus,
    state.includeCaptions,
    state.videoType,
    statusQuery.data,
    stylizeVideoMutation,
    update,
  ]);

  useEffect(() => {
    if (!statusQuery.error || state.generationStatus !== "submitting") {
      return;
    }

    if (isConnectivityError(statusQuery.error)) {
      if (!statusPollingWarningShownRef.current) {
        statusPollingWarningShownRef.current = true;
        toast.info("Connection lost while checking video status. We'll keep your draft and resume polling when the server is reachable again.");
      }
      return;
    }

    update({
      generationStatus: "failed",
      generationError: statusQuery.error instanceof Error ? statusQuery.error.message : "Unexpected error while checking video status.",
    });
    toast.error(statusQuery.error instanceof Error ? statusQuery.error.message : "Unexpected error while checking video status.");
  }, [state.generationStatus, statusQuery.error, update]);

  useEffect(() => {
    if (requestedMode !== "avatar" && requestedMode !== "remotion") {
      return;
    }

    stylingRequestedRef.current = false;
    generateVideoMutation.reset();
    generateRemotionMutation.reset();
    stylizeVideoMutation.reset();
    setLogoFile(null);

    if (requestedFreshDraft) {
      reset();
    }

    const language = requestedFreshDraft ? "Hindi" : state.language;
    update({
      currentStep: 0,
      language,
      outputLanguage: language,
      videoType: requestedMode,
      avatarId: requestedFreshDraft || requestedMode === "remotion" ? "" : state.avatarId,
      transcript: DEFAULT_AVATAR_SCRIPT,
      remotionTranscript: REMOTION_TEMPLATES[language] ?? REMOTION_TEMPLATES.Hindi,
      ...RESET_GENERATION_STATE,
    });

    setSearchParams({}, { replace: true });
  }, [
    requestedFreshDraft,
    requestedMode,
    reset,
    setSearchParams,
    state.avatarId,
    state.language,
    stylizeVideoMutation,
    generateRemotionMutation,
    generateVideoMutation,
    update,
  ]);

  const handleCreateVideo = () => {
    stylingRequestedRef.current = false;
    generateVideoMutation.reset();
    generateRemotionMutation.reset();
    stylizeVideoMutation.reset();
    setLogoFile(null);
    reset();
    toast.success("New video draft started!");
  };

  const handleCancel = () => {
    stylingRequestedRef.current = false;
    generateVideoMutation.reset();
    generateRemotionMutation.reset();
    stylizeVideoMutation.reset();
    update({
      generationStatus: "idle",
      generationError: "",
    });
    toast.info("Generation interrupted.");
  };

  const handleGenerate = () => {
    if (state.videoType === "avatar" && !state.avatarId.trim()) {
      toast.error("Select an avatar before generating the video.");
      goToStep(1);
      return;
    }

    if (
      !state.customerName.trim() ||
      !state.lan.trim() ||
      !state.clientName.trim() ||
      (state.videoType === "remotion" &&
        (
          !state.tos.trim() ||
          !state.loanAmount.trim() ||
          !state.contactDetails.trim() ||
          !state.productType.trim()
        )) ||
      !activeTranscript.trim()
    ) {
      toast.error("Complete the lead details and transcript before generating the video.");
      goToStep(2);
      return;
    }

    const dimensions = ASPECT_RATIO_DIMENSIONS[state.aspectRatio] ?? ASPECT_RATIO_DIMENSIONS["16:9"];
    const payload: DirectVideoPayload = {
      customer_name: state.customerName.trim(),
      lan: state.lan.trim(),
      client_name: state.clientName.trim(),
      tos: state.tos.trim() || undefined,
      loan_amount: state.loanAmount.trim() || undefined,
      contact_details: state.contactDetails.trim() || undefined,
      product_type: state.productType.trim() || undefined,
      avatar_id: state.videoType === "avatar" ? state.avatarId.trim() || undefined : undefined,
      template_name: state.videoType === "avatar" ? state.templateName : undefined,
      language: state.language,
      script_text: activeTranscript.trim() || undefined,
      background_color: state.backgroundColor,
      include_captions: state.includeCaptions,
      title_prefix: state.videoType === "avatar" ? state.titlePrefix.trim() || undefined : undefined,
      video_width: dimensions.width,
      video_height: dimensions.height,
    };

    if (state.videoType === "remotion") {
      generateRemotionMutation.mutate(payload);
    } else {
      generateVideoMutation.mutate(payload);
    }

    goToStep(4);
  };

  const handleNextPrimary = () => {
    if (step === 3) {
      handleGenerate();
      return;
    }
    nextStep();
  };

  const handleWorkflowStepClick = (targetStep: number) => {
    if (isProcessing && targetStep === 5) {
      toast.info("The video is still processing. You'll reach Share automatically when it's ready.");
      return;
    }

    if (state.videoType === "remotion" && targetStep === 1) {
      goToStep(2);
      return;
    }

    goToStep(targetStep);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <StepLanguage
            selected={state.language}
            onSelect={(lang) => {
              const partial = {
                language: lang,
                outputLanguage: lang,
                ...(state.videoType === "remotion" && REMOTION_TEMPLATES[lang]
                  ? { remotionTranscript: REMOTION_TEMPLATES[lang] }
                  : {}),
                ...(state.videoType === "avatar"
                  ? { transcript: DEFAULT_AVATAR_SCRIPT }
                  : {}),
                ...RESET_GENERATION_STATE,
              };
              update(partial);
            }}
            videoType={state.videoType}
            onVideoTypeChange={(type) => {
              const partial = {
                videoType: type,
                ...(type === "remotion" && REMOTION_TEMPLATES[state.language]
                  ? { remotionTranscript: REMOTION_TEMPLATES[state.language] }
                  : {}),
                ...(type === "avatar"
                  ? { transcript: DEFAULT_AVATAR_SCRIPT }
                  : {}),
                ...RESET_GENERATION_STATE,
              };
              update(partial);
            }}
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
            onSelect={(id, name) => update({ avatarId: id, avatarName: name || id, ...RESET_GENERATION_STATE })}
            onFilterChange={(filter) => update({ avatarFilter: filter })}
          />
        );
      case 2:
        return <StepTranscript state={state} update={update} />;
      case 3:
        return <StepSubtitle state={state} update={update} onLogoSelected={setLogoFile} />;
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
        <WorkflowSidebar currentStep={step} onStepClick={handleWorkflowStepClick} videoType={state.videoType} />
        <StepLayout
          step={step}
          title={meta.title}
          subtitle={meta.subtitle}
          onNext={handleNextPrimary}
          onBack={prevStep}
          nextLabel={step === 3 ? "Generate Video ✨" : meta.next}
          canProceed={canProceed()}
          isLast={step === STEPS.length - 1}
          lastLabel="Finish"
          primaryActionBusy={
            generateVideoMutation.isPending ||
            generateRemotionMutation.isPending ||
            stylizeVideoMutation.isPending ||
            isProcessing
          }
          primaryBusyLabel={
            stylizeVideoMutation.isPending || state.generationStatus === "styling"
              ? "Applying branding..."
              : "Video creation under progress..."
          }
          onCancel={step === 4 && isProcessing ? handleCancel : undefined}
          onFinish={() => navigate("/")}
        >
          {renderStep()}
        </StepLayout>
      </div>
    </div>
  );
};

export default Index;
