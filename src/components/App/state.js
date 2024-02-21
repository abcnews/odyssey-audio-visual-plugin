import { signal } from "@preact/signals";

/** Global muted state. Starts muted on load. */
export const isMuted = signal(true);