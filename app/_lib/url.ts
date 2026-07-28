"use client";

import { useSyncExternalStore } from "react";

/**
 * A tiny store over the URL query string.
 *
 * Deliberately NOT `useSearchParams`: on a prerendered route that hook forces
 * everything up to the nearest Suspense boundary to be client-rendered only,
 * which would pull all 41 style cards out of `/menu`'s static HTML. The native
 * History API is supported by the App Router and costs nothing.
 *
 * `useSyncExternalStore` rather than `useState` + an effect, because the URL is
 * external mutable state — reading it in an effect and mirroring into state is
 * the pattern React added this hook to replace.
 */

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // `popstate` covers Back/Forward. Our own push/replace calls notify()
  // directly, because neither fires popstate.
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

const getSnapshot = () => window.location.search;

// The server cannot know the query string of a statically prerendered page,
// so it renders as though there were none. Hydration then picks up the real
// value — which is exactly how a deep link opens on first paint.
const getServerSnapshot = () => "";

/** The current query string, re-rendering the caller whenever it changes. */
export function useSearchString(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Reads one parameter out of a query string. */
export function readParam(search: string, key: string): string | null {
  return new URLSearchParams(search).get(key);
}

/** Sets a parameter and adds a history entry, so Back undoes it. */
export function pushParam(key: string, value: string) {
  const params = new URLSearchParams(window.location.search);
  params.set(key, value);
  window.history.pushState(null, "", `?${params.toString()}`);
  notify();
}

/** Removes a parameter without adding a history entry. */
export function replaceWithoutParam(key: string) {
  const params = new URLSearchParams(window.location.search);
  params.delete(key);
  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    query ? `?${query}` : window.location.pathname,
  );
  notify();
}

/** Steps back, then tells subscribers once the URL has actually changed. */
export function goBack() {
  window.history.back();
  // popstate fires on its own for a real back navigation; subscribers are
  // already listening, so nothing else is needed here.
}
