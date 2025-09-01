import { BumpkinItem } from "features/game/types/bumpkin";
import { InventoryItemName } from "features/game/types/game";
import { CONFIG } from "lib/config";

const isInIframe = window.self !== window.top;

export function complete() {
  if (isInIframe) {
    window.parent.postMessage({ event: "claimPrize" }, "*");
  } else {
    window.location.href = CONFIG.PORTAL_GAME_URL;
  }
}

export function goHome() {
  if (isInIframe) {
    window.parent.postMessage({ event: "closePortal" }, "*");
  } else {
    window.location.href = CONFIG.PORTAL_GAME_URL;
  }
}

export function purchase({ sfl }: { sfl: number }) {
  if (!isInIframe) {
    alert(`Sunflower Land not available - are you in an iframe?`);
  }

  window.parent.postMessage(
    {
      event: "purchase",
      sfl,
      items: {},
      custom: {
        purchasedAttemptsAt: Date.now(),
      },
    },
    "*"
  );
}

/**
 * Starts a minigame attempt
 */
export function startAttempt() {
  if (!isInIframe) {
    alert(`Sunflower Land running in test mode - attempt started`);
  } else {
    window.parent.postMessage({ event: "attemptStarted" }, "*");
  }
}

/**
 * Submits a minigame score
 */
export function submitScore({ score, custom }: { score: number; custom: any }) {
  if (!isInIframe) {
    alert(`Sunflower Land running in test mode - score submitted`);
  } else {
    window.parent.postMessage({ event: "scoreSubmitted", score, custom }, "*");
  }
}

/**
 * @deprecated Use `attemptStarted` and `scoreSubmitted` instead
 * When to want to store the score
 */
export function played({ score }: { score: number }) {
  if (!isInIframe) {
    alert(`Sunflower Land running in test mode - played`);
  } else {
    window.parent.postMessage({ event: "played", score }, "*");
  }
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
