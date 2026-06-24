/**
 * Unified record service entry point.
 *
 * When VITE_API_BASE_URL is set → stores in Python backend (SQLite).
 * Otherwise               → stores in localStorage.
 *
 * Pages should import from here, never directly from ../store/localRecords.
 */
import type { RecordRepository } from "../store/localRecords";
import { recordRepository as localRepo } from "../store/localRecords";
import { webRecordService } from "./webApiService";

const hasBackend = Boolean(import.meta.env.VITE_API_BASE_URL);

export const recordService: RecordRepository = hasBackend
  ? {
      list: () => webRecordService.list(),
      create: (record) => webRecordService.create(record).then((r) => [r]),
    }
  : localRepo;
