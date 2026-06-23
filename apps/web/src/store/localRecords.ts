import type { RecordCard } from "@ai-otter/shared-types";

const STORAGE_KEY = "ai-otter.records.v1";

export interface RecordRepository {
  list(): Promise<RecordCard[]>;
  create(record: RecordCard): Promise<RecordCard[]>;
}

function readRecordsFromStorage(): RecordCard[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as RecordCard[];
  } catch {
    return [];
  }
}

function writeRecordsToStorage(records: RecordCard[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export const localRecordRepository: RecordRepository = {
  async list() {
    return readRecordsFromStorage();
  },

  async create(record) {
    const records = [record, ...readRecordsFromStorage()];
    writeRecordsToStorage(records);
    return records;
  }
};

export const recordRepository: RecordRepository = localRecordRepository;
