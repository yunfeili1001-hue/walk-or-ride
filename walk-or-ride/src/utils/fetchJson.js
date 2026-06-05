export async function fetchJson(url, { errorLabel = 'Request' } = {}) {
  let response;

  try {
    response = await fetch(url);
  } catch {
    throw new Error(`${errorLabel} failed: network error. Check your connection.`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  const text = await response.text();
  const trimmed = text.trimStart();

  if (!response.ok) {
    if (trimmed.startsWith('<')) {
      throw new Error(`${errorLabel} failed (${response.status}). The service is unavailable.`);
    }

    try {
      const errorBody = JSON.parse(text);
      const detail = errorBody.message || errorBody.error || errorBody.text;
      if (detail) {
        throw new Error(`${errorLabel} failed: ${detail}`);
      }
    } catch (parseErr) {
      if (parseErr instanceof Error && parseErr.message.startsWith(errorLabel)) {
        throw parseErr;
      }
    }

    throw new Error(`${errorLabel} failed (${response.status}). Please try again.`);
  }

  if (!trimmed) {
    throw new Error(`${errorLabel} returned an empty response.`);
  }

  if (trimmed.startsWith('<') || !contentType.includes('json')) {
    throw new Error(`${errorLabel} returned an invalid response. Please try again.`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${errorLabel} returned invalid data. Please try again.`);
  }
}
