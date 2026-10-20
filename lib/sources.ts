import type { Source } from "./copies";
import { formAnalysisSource } from "./form-analysis";
import { injuredSource } from "./injured";
import { squadProfitSource } from "./squad-profit";
import { teamFormSource } from "./team-form";
import { topTransfersSource } from "./top-transfers";
import { UEFA_SOURCES } from "./uefa/fetch";

/** Every source (CONTEXT.md), for the scheduled refresh and the copies status endpoint. */
export const SOURCES: Source<unknown>[] = [
  teamFormSource,
  formAnalysisSource,
  injuredSource,
  topTransfersSource,
  squadProfitSource,
  ...UEFA_SOURCES,
];
