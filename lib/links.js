// Links typed into the dashboard. Without its https:// a link turns into a path
// on this site and 404s, so a section's links are checked before it is saved.

function parse(value) {
  try {
    return new URL(String(value).trim());
  } catch {
    return null;
  }
}

export function isWebAddress(value) {
  const url = parse(value);
  return Boolean(url?.hostname) && (url.protocol === "https:" || url.protocol === "http:");
}

// A profile or page on linkedin.com, www.linkedin.com or a country site such as
// in.linkedin.com.
export function isLinkedInAddress(value) {
  const url = parse(value);
  if (url?.protocol !== "https:") return false;
  const host = url.hostname;
  return (host === "linkedin.com" || host.endsWith(".linkedin.com")) && url.pathname.length > 1;
}

// A post or reel on instagram.com: https, the real host, and a path.
export function isInstagramAddress(value) {
  const url = parse(value);
  if (url?.protocol !== "https:") return false;
  const host = url.hostname;
  return (host === "instagram.com" || host === "www.instagram.com") && url.pathname.length > 1;
}
