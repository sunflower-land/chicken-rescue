import { CONFIG } from "lib/config";

const isInIframe = window.self !== window.top;

export function goHome() {
  if (isInIframe) {
    window.parent.postMessage({ event: "closePortal" }, "*");
  } else {
    window.location.href = CONFIG.PORTAL_GAME_URL;
  }
}

export function purchase() {
  if (!isInIframe) {
    throw new Error("Not available");
  }

  window.parent.postMessage({ event: "purchase", sfl: 1 }, "*");
}

export function played() {
  if (!isInIframe) {
    throw new Error("Not available");
  }

  window.parent.postMessage({ event: "played", score: 1 }, "*");
}

export function authorisePortal() {
  if (isInIframe) {
    window.parent.postMessage("closePortal", "*");
  } else {
    window.location.href = `${CONFIG.PORTAL_GAME_URL}?portal=${CONFIG.PORTAL_APP}&redirect=${window.location.origin}`;
  }
}

export function isValidRedirect(url: string) {
  // Define a regular expression for localhost URLs
  const localhostRegex = /^http:\/\/localhost:\d+/;

  // Define a regular expression for subdomains of "sunflower-land.com"
  const subdomainRegex = /^https:\/\/([a-z0-9-]+\.)*sunflower-land\.com/;

  // Check if the URL matches either pattern
  return localhostRegex.test(url) || subdomainRegex.test(url);
}
