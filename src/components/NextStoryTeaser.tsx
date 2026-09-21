import type { PathEvent } from "@/lib/roadmap";

type NextStoryTeaserProps = {
  story: PathEvent;
  onContinue: () => void;
};

/** A pointer into The Path from Today — not a separate rotation pool.
 * Shows whatever lesson is "current" in the single chronological sequence
 * right now (see nextLesson, src/lib/roadmap.ts) and jumps straight to it
 * on tap. Nothing here is completable on its own; the actual story only
 * exists in The Path, same as always. */
export function NextStoryTeaser({ story, onContinue }: NextStoryTeaserProps) {
  return (
    <section className="w-full max-w-sm rounded-2xl bg-paper border border-mist p-5 flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-clay-600">
        Continue Your Story
      </span>
      <h3 className="text-base font-semibold text-ink">{story.lesson.title}</h3>
      <span className="text-xs text-stone">
        {story.lesson.lessonBook}
        {story.lesson.scriptureReference ? ` · ${story.lesson.scriptureReference}` : ""}
      </span>
      <button
        type="button"
        onClick={onContinue}
        className="self-start mt-1 rounded-full bg-clay-600 text-paper px-4 py-1.5 text-xs font-medium hover:bg-clay-700 transition-colors"
      >
        Continue
      </button>
    </section>
  );
}
