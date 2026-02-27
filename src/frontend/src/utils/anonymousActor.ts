import { createActorWithConfig } from "../config";
import type { backendInterface } from "../backend";

let anonymousActorPromise: Promise<backendInterface> | null = null;

export function getAnonymousActor(): Promise<backendInterface> {
  if (!anonymousActorPromise) {
    anonymousActorPromise = createActorWithConfig().catch((err) => {
      anonymousActorPromise = null;
      throw err;
    });
  }
  return anonymousActorPromise;
}
