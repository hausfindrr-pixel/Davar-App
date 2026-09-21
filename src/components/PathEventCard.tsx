import Image from "next/image";
import { useState } from "react";
import { CheckIcon, LockIcon } from "@/components/icons";
import { CONTENT_TYPE_META } from "@/lib/contentType";
import type { PathEvent } from "@/lib/roadmap";

type PathEventCardProps = {
  event: PathEvent;
  onSelect: (event: PathEvent) => void;
};

/** One event's card in The Path's flat list — the event/story is the
 * heading, the book is a small subheading underneath it (not the other
 * way around, as it was when books were the top-level unit). The image
 * area shows the lesson's own `imageUrl` when set (falling back to the
 * content type's icon on a tinted gradient if it's null or fails to
 * load) — one illustration per lesson, reused here as the card thumbnail
 * and again as LessonFlow's opening screen. Only "completed"/"current"
 * cards are tappable; "sequenceLocked" names the specific lesson blocking
 * it, reading as a plain locked card, dimmed, rather than the old small
 * locked node, since there's room here to say why. Premium-only: free
 * tier never sees a locked card at all — its single visible event is
 * always "current" (strict per-tier visibility, see PathEventList). */
export function PathEventCard({ event, onSelect }: PathEventCardProps) {
  const { lesson, state, blockingTitle } = event;
  const [imgError, setImgError] = useState(false);
  const meta = CONTENT_TYPE_META[lesson.track];
  const Icon = meta.icon;
  const isTappable = state === "completed" || state === "current";
  const isCurrent = state === "current";
  const isLocked = state === "sequenceLocked";
  const showImage = lesson.imageUrl && !imgError && !isLocked;

  return (
    <button
      type="button"
      disabled={!isTappable}
      onClick={() => onSelect(event)}
      className={`w-full text-left rounded-[20px] bg-paper overflow-hidden transition-shadow ${
        isCurrent
          ? `border-2 ${meta.currentBorderClass} ring-4 ${meta.currentRingClass} shadow-[0_1px_2px_rgba(58,51,44,0.05),0_6px_16px_rgba(58,51,44,0.08)]`
          : "border border-mist"
      } ${isLocked ? "opacity-65 cursor-not-allowed" : ""}`}
    >
      <div
        className={`relative h-[150px] flex items-center justify-center ${isLocked ? "bg-mist" : meta.imageBgClass}`}
      >
        {showImage ? (
          <Image
            src={lesson.imageUrl!}
            alt=""
            fill
            sizes="(min-width: 640px) 400px, 90vw"
            className={`object-cover ${state === "completed" ? "opacity-70" : ""}`}
            onError={() => setImgError(true)}
          />
        ) : isLocked ? (
          <LockIcon className="h-10 w-10 text-stone" />
        ) : (
          <Icon className={`h-12 w-12 ${meta.imageIconClass} ${state === "completed" ? "opacity-70" : ""}`} />
        )}

        {isCurrent && (
          <span
            className={`absolute top-3 left-3 text-[10px] font-semibold tracking-wide text-paper px-2.5 py-1 rounded-full ${meta.solidBgClass}`}
          >
            UP NEXT
          </span>
        )}
        {state === "completed" && (
          <span
            className={`absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full ${meta.solidBgClass}`}
          >
            <CheckIcon className="h-4 w-4 text-paper" />
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone">
          <span>{lesson.lessonBook}</span>
          <span className="text-mist">·</span>
          <span className={meta.labelClass}>{meta.label}</span>
        </div>

        <h3 className={`text-[17px] font-bold leading-snug ${isLocked ? "text-stone" : "text-ink"}`}>
          {lesson.title}
        </h3>

        {lesson.scriptureReference && (
          <p className="text-xs text-stone">
            {lesson.scriptureReference} · {lesson.estimatedMinutes} min
          </p>
        )}

        {state === "completed" && (
          <span className="mt-1 self-start rounded-full bg-sage-50 text-sage-700 text-xs font-semibold px-3 py-1">
            Completed
          </span>
        )}
        {isCurrent && (
          <span
            className={`mt-1.5 self-start rounded-full px-4 py-1.5 text-xs font-semibold ${meta.buttonClass}`}
          >
            Continue
          </span>
        )}
        {state === "sequenceLocked" && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-stone">
            <LockIcon className="h-3.5 w-3.5 shrink-0" />
            <span>Complete &ldquo;{blockingTitle}&rdquo; first</span>
          </div>
        )}
      </div>
    </button>
  );
}
