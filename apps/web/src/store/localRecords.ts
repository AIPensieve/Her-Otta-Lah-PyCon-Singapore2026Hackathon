import type { RecordCard } from "@ai-otter/shared-types";

const STORAGE_KEY = "ai-otter.records.v1";

export function readRecords(): RecordCard[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as RecordCard[];
  } catch {
    return [];
  }
}

export function saveRecord(record: RecordCard): RecordCard[] {
  const records = [record, ...readRecords()];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  return records;
}
