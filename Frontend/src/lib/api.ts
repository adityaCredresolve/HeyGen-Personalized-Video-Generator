export interface AvatarOption {
  id: string;
  name: string;
  category: string;
  previewImageUrl: string | null;
  isPremium: boolean;
  raw: Record<string, unknown>;
}

export interface TemplateOption {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  updatedAt: string | null;
  raw: Record<string, unknown>;
}

export interface DirectVideoPayload {
  customer_name: string;
  lan: string;
  client_name: string;
  tos: string;
  loan_amount?: string;
  contact_details?: string;
  avatar_id?: string;
  voice_id?: string;
  template_name?: string;
  script_text?: string;
  background_color?: string;
  include_captions?: boolean;
  title_prefix?: string;
  video_width?: number;
  video_height?: number;
}

export interface VideoJobResult {
  request_mode: "direct" | "template";
  video_id: string;
  status: string;
  video_url: string | null;
  thumbnail_url: string | null;
  title: string | null;
  raw_response: Record<string, unknown>;
  saved_to: string | null;
}

export interface StyledVideoResult {
  video_id: string;
  status: "styled";
  source_video_path: string;
  source_video_url: string;
  final_video_path: string;
  final_video_url: string;
  subtitle_file_path: string | null;
  logo_file_path: string | null;
  subtitle_source: "provider" | "transcript" | "disabled";
}

export interface StylizeVideoPayload {
  includeCaptions: boolean;
  subtitleColor: string;
  subtitlePosition: string;
  transcript?: string;
  logoPosition: string;
  logoOpacity: number;
  logoFile?: File | null;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function asBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === 1;
}

function extractErrorMessage(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }

  const record = asRecord(payload);
  return (
    asString(record.detail) ??
    asString(record.message) ??
    asString(record.error) ??
    asString(asRecord(record.data).message)
  );
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");

  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? ((await response.json()) as unknown) : await response.text();

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload) ?? `Request failed with status ${response.status}`);
  }

  return payload as T;
}

function extractAvatarArray(payload: unknown): Record<string, unknown>[] {
  const root = asRecord(payload);
  const data = asRecord(root.data);
  const candidates: unknown[] = [
    root.avatars,
    data.avatars,
    data.list,
    data.items,
    root.items,
    root.data,
  ];

  const array = candidates.find((candidate) => Array.isArray(candidate));
  if (!Array.isArray(array)) {
    return [];
  }

  return array
    .map((item) => asRecord(item))
    .filter((item) => Object.keys(item).length > 0);
}

function normalizeAvatar(rawAvatar: Record<string, unknown>): AvatarOption | null {
  const id =
    asString(rawAvatar.avatar_id) ??
    asString(rawAvatar.id) ??
    asString(rawAvatar.avatarId) ??
    asString(rawAvatar.avatar_uuid);

  if (!id) {
    return null;
  }

  const name =
    asString(rawAvatar.avatar_name) ??
    asString(rawAvatar.name) ??
    asString(rawAvatar.title) ??
    id;

  let category =
    asString(rawAvatar.gender) ??
    asString(rawAvatar.style) ??
    asString(rawAvatar.group) ??
    asString(rawAvatar.motion) ??
    "Avatar";

  if (category.toLowerCase() === "unknown") {
    category = "My Avatars";
  }

  const previewImageUrl =
    asString(rawAvatar.preview_image_url) ??
    asString(rawAvatar.thumbnail_url) ??
    asString(rawAvatar.image_url) ??
    asString(rawAvatar.poster_url) ??
    asString(asRecord(rawAvatar.preview_image).url);

  return {
    id,
    name,
    category,
    previewImageUrl,
    isPremium: asBoolean(rawAvatar.is_premium) || asBoolean(rawAvatar.premium),
    raw: rawAvatar,
  };
}

function extractTemplateArray(payload: unknown): Record<string, unknown>[] {
  const root = asRecord(payload);
  const data = asRecord(root.data);
  const candidates: unknown[] = [
    root.templates,
    data.templates,
    data.list,
    data.items,
    root.items,
    root.data,
  ];

  const array = candidates.find((candidate) => Array.isArray(candidate));
  if (!Array.isArray(array)) {
    return [];
  }

  return array
    .map((item) => asRecord(item))
    .filter((item) => Object.keys(item).length > 0);
}

function normalizeTemplate(rawTemplate: Record<string, unknown>): TemplateOption | null {
  const id =
    asString(rawTemplate.template_id) ??
    asString(rawTemplate.id) ??
    asString(rawTemplate.templateId);

  if (!id) {
    return null;
  }

  return {
    id,
    name:
      asString(rawTemplate.name) ??
      asString(rawTemplate.title) ??
      asString(rawTemplate.template_name) ??
      id,
    description:
      asString(rawTemplate.description) ??
      asString(rawTemplate.summary) ??
      asString(rawTemplate.subtitle),
    status:
      asString(rawTemplate.status) ??
      asString(rawTemplate.state),
    updatedAt:
      asString(rawTemplate.updated_at) ??
      asString(rawTemplate.updatedAt) ??
      asString(rawTemplate.created_at),
    raw: rawTemplate,
  };
}

export async function fetchAvatars(): Promise<AvatarOption[]> {
  const response = await requestJson<unknown>("/meta/avatars");
  const parsedAvatars = extractAvatarArray(response)
    .map((avatar) => normalizeAvatar(avatar))
    .filter((avatar): avatar is AvatarOption => avatar !== null);

  // Deduplicate by avatar.id
  const seenIds = new Set<string>();
  const uniqueAvatars: AvatarOption[] = [];
  
  for (const avatar of parsedAvatars) {
    if (!seenIds.has(avatar.id)) {
      seenIds.add(avatar.id);
      uniqueAvatars.push(avatar);
    }
  }

  return uniqueAvatars.sort((left, right) => left.name.localeCompare(right.name));
}

export async function fetchTemplates(): Promise<TemplateOption[]> {
  const response = await requestJson<unknown>("/meta/templates");
  return extractTemplateArray(response)
    .map((template) => normalizeTemplate(template))
    .filter((template): template is TemplateOption => template !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function generateDirectVideo(payload: DirectVideoPayload, wait = true): Promise<VideoJobResult> {
  return requestJson<VideoJobResult>(`/generate/direct?wait=${wait ? "true" : "false"}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchVideoStatus(videoId: string, requestMode: "direct" | "template" = "direct"): Promise<VideoJobResult> {
  return requestJson<VideoJobResult>(`/videos/${videoId}/status?request_mode=${requestMode}`);
}

export async function stylizeVideo(videoId: string, payload: StylizeVideoPayload): Promise<StyledVideoResult> {
  const formData = new FormData();
  formData.set("include_captions", payload.includeCaptions ? "true" : "false");
  formData.set("subtitle_color", payload.subtitleColor);
  formData.set("subtitle_position", payload.subtitlePosition);
  formData.set("logo_position", payload.logoPosition);
  formData.set("logo_opacity", String(payload.logoOpacity));

  if (payload.transcript?.trim()) {
    formData.set("transcript", payload.transcript.trim());
  }
  if (payload.logoFile) {
    formData.set("logo_file", payload.logoFile);
  }

  return requestJson<StyledVideoResult>(`/videos/${videoId}/stylize`, {
    method: "POST",
    body: formData,
  });
}
