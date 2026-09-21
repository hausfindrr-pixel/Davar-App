/**
 * Named stages for The Path's overall journey progress — separate from a
 * single lesson's own step-by-step progress bar (LessonFlow.tsx). Bands
 * are percentages of the whole library completed, not fixed lesson
 * counts, so they stay meaningful as more lessons are added later rather
 * than needing to be re-tuned every time the library grows.
 */
export interface PathStage {
  name: string;
  /** Inclusive lower bound, as a fraction of the library completed (0-1). */
  minProgress: number;
}

export const PATH_STAGES: PathStage[] = [
  { name: "Scholar", minProgress: 0 },
  { name: "Rabbi", minProgress: 0.2 },
  { name: "Sage", minProgress: 0.4 },
  { name: "Elder", minProgress: 0.6 },
  { name: "Shepherd", minProgress: 0.8 },
  { name: "Faithful Witness", minProgress: 1 },
];

export interface CurrentStage {
  stage: PathStage;
  index: number;
  /** The next stage up, or null if already at the last one. */
  next: PathStage | null;
  /** How many more lessons need completing to reach `next` — null if
   * there's no next stage, or if the library is too small to compute a
   * meaningful count for it. */
  lessonsToNext: number | null;
}

/** Which stage `completed` of `total` lessons lands in, plus what it
 * takes to reach the next one. `total` is the current library size, not
 * a fixed number — stages are always relative to however many lessons
 * exist right now. */
export function currentStage(completed: number, total: number): CurrentStage {
  const progress = total > 0 ? completed / total : 0;

  let index = 0;
  for (let i = PATH_STAGES.length - 1; i >= 0; i--) {
    if (progress >= PATH_STAGES[i].minProgress) {
      index = i;
      break;
    }
  }

  const next = PATH_STAGES[index + 1] ?? null;
  const lessonsToNext = next && total > 0 ? Math.max(1, Math.ceil(next.minProgress * total) - completed) : null;

  return { stage: PATH_STAGES[index], index, next, lessonsToNext };
}
