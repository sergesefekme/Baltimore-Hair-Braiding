import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseCsvRecords } from "./csv";

export type EventStatus = "open" | "limited" | "full";

export type StudioEvent = {
  /** ISO date, YYYY-MM-DD. */
  date: string;
  /** 24-hour, HH:MM. */
  time: string;
  title: string;
  location: string;
  description: string;
  status: EventStatus;
};

const STATUSES = new Set<EventStatus>(["open", "limited", "full"]);

/**
 * How each status reads. The word is not decoration — it is the accessible
 * carrier of the state, because colour on its own is never a signal.
 */
export const STATUS_LABEL: Record<EventStatus, string> = {
  open: "Open",
  limited: "Few places left",
  full: "Fully booked",
};

export const STATUS_TONE: Record<EventStatus, string> = {
  open: "text-confirmed",
  limited: "text-attention",
  full: "text-error",
};

/** "Sat, August 15" — the year is dropped; nothing here is a year out. */
export function formatEventDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
  }).format(parsed);
}

/**
 * "10:00 AM" from the CSV's 24-hour "10:00".
 *
 * Stored 24-hour because it sorts and validates cleanly; displayed 12-hour
 * because that is what people read here.
 */
export function formatEventTime(time: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time;

  const [, hours, minutes] = match;
  const parsed = new Date(2000, 0, 1, Number(hours), Number(minutes));
  if (Number.isNaN(parsed.getTime())) return time;

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

/**
 * Read once per process. Correct for a statically prerendered page, but it
 * means `events.csv` edits do not appear in `next dev` until you restart the
 * server — the file is not part of the module graph, so nothing invalidates it.
 */
let cache: StudioEvent[] | undefined;

/**
 * Future-dated events only, soonest first. Read at build time; swap for a
 * Sanity query later without changing `StudioEvent`.
 *
 * Returns an empty array when the file is missing — an absent events.csv is a
 * business with nothing on, not a build failure.
 */
export async function getUpcomingEvents(): Promise<StudioEvent[]> {
  if (cache) return cache;

  const file = path.join(process.cwd(), "docs", "events.csv");

  let raw: string;
  try {
    raw = await readFile(file, "utf8");
  } catch {
    cache = [];
    return cache;
  }

  const today = new Date().toISOString().slice(0, 10);

  cache = parseCsvRecords(raw)
    .filter((record) => record.date && record.title && record.date >= today)
    .map((record) => ({
      date: record.date,
      time: record.time ?? "",
      title: record.title,
      location: record.location ?? "",
      description: record.description ?? "",
      status: STATUSES.has(record.status as EventStatus)
        ? (record.status as EventStatus)
        : "open",
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return cache;
}
