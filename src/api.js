const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");

const DEFAULT_SERVICE_DESCRIPTION = "Service details will appear here once they are available.";

export class ApiError extends Error {
  constructor(message, { status, retryable = false, details } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status ?? 0;
    this.retryable = retryable;
    this.details = details;
  }
}

function buildUrl(path) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function toPositiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function normalizeService(service) {
  if (!service || typeof service !== "object") {
    return null;
  }

  const id = service.id ?? service.serviceId;
  const name = typeof service.name === "string" ? service.name.trim() : "";

  if (id == null || !name) {
    return null;
  }

  const currentQueue = toPositiveNumber(
    service.currentQueue ?? service.queueLength ?? service.queue ?? 0,
    0
  );

  return {
    id,
    name,
    description:
      typeof service.description === "string" && service.description.trim()
        ? service.description.trim()
        : DEFAULT_SERVICE_DESCRIPTION,
    duration: toPositiveNumber(service.duration ?? service.expectedDuration ?? service.minutes, 15) || 15,
    expectedDuration:
      toPositiveNumber(service.expectedDuration ?? service.duration ?? service.minutes, 15) || 15,
    priority:
      typeof service.priority === "string" && service.priority.trim()
        ? service.priority.trim().toLowerCase()
        : "medium",
    open: typeof service.open === "boolean" ? service.open : true,
    currentQueue,
    queueLength: currentQueue,
  };
}

async function parseJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ApiError("The server returned an invalid JSON response.", {
      status: response.status,
      retryable: response.status >= 500,
      details: error,
    });
  }
}

function getErrorMessage(payload, fallback) {
  if (payload && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  if (payload && typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  return fallback;
}

async function requestJson(path, options = {}) {
  let response;

  try {
    response = await fetch(buildUrl(path), {
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      ...options,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

    throw new ApiError("Unable to reach the server.", {
      retryable: true,
      details: error,
    });
  }

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(payload, "The request could not be completed."),
      {
        status: response.status,
        retryable: response.status >= 500,
        details: payload,
      }
    );
  }

  return payload;
}

export async function fetchServices({ signal } = {}) {
  const payload = await requestJson("/api/services", { method: "GET", signal });

  if (!payload?.success || !Array.isArray(payload.data)) {
    throw new ApiError("The services response was not in the expected format.", {
      retryable: false,
      details: payload,
    });
  }

  return payload.data.map(normalizeService).filter(Boolean);
}

export async function joinQueue({ serviceId, guestName, signal } = {}) {
  const payload = await requestJson("/api/queue/join", {
    method: "POST",
    signal,
    body: JSON.stringify({ serviceId, guestName }),
  });

  if (!payload?.success) {
    throw new ApiError(getErrorMessage(payload, "Unable to join the queue."), {
      retryable: false,
      details: payload,
    });
  }

  return {
    ticket: typeof payload.ticket === "string" ? payload.ticket : "Pending",
    position: toPositiveNumber(payload.position, 0),
    estimatedWaitMinutes: toPositiveNumber(payload.estimatedWaitMinutes, 0),
  };
}

export function getDisplayError(error, fallbackMessage) {
  if (error instanceof ApiError && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export function isAbortError(error) {
  return error?.name === "AbortError";
}

function buildQuery(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.set(key, String(value).trim());
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}

function adminHeaders(role) {
  return { "X-User-Role": role || "user" };
}

export async function fetchReportOptions({ role, signal } = {}) {
  const payload = await requestJson("/api/reports/options", {
    method: "GET",
    signal,
    headers: adminHeaders(role),
  });

  if (!payload?.success || !payload.data) {
    throw new ApiError("The report filter response was not in the expected format.", {
      details: payload,
    });
  }

  return payload.data;
}

export async function fetchReport({ reportType, filters, role, signal } = {}) {
  const payload = await requestJson(`/api/reports/${reportType}${buildQuery(filters)}`, {
    method: "GET",
    signal,
    headers: adminHeaders(role),
  });

  if (!payload?.success || !Array.isArray(payload.rows) || !Array.isArray(payload.columns)) {
    throw new ApiError("The report response was not in the expected format.", {
      details: payload,
    });
  }

  return payload;
}

export async function exportReportCsv({ reportType, filters, role } = {}) {
  const response = await fetch(buildUrl(`/api/reports/${reportType}/export${buildQuery(filters)}`), {
    method: "GET",
    headers: adminHeaders(role),
  });

  if (!response.ok) {
    const payload = await parseJsonResponse(response);
    throw new ApiError(getErrorMessage(payload, "Unable to export report."), {
      status: response.status,
      retryable: response.status >= 500,
      details: payload,
    });
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${reportType}-report.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
