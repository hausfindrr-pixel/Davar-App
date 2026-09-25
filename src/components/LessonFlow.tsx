"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FillBlankCard } from "@/components/FillBlankCard";
import { ArrowLeftIcon } from "@/components/icons";
import { saveLessonAnswer } from "@/lib/db/lessonAnswers";
import { CONTENT_TYPE_META } from "@/lib/contentType";
import type {
  LessonDoc,
  LessonScreen,
  MultipleChoiceScreen,
  ReadAndAnswerScreen,
  ScenarioScreen,
  ShortAnswerScreen,
  VerseBlankScreen,
} from "@/types/firestore";

type LessonFlowProps = {
  lesson: LessonDoc;
  uid: string;
  isDone: boolean;
  isLocked: boolean;
  isPending: boolean;
  onComplete: () => Promise<void>;
  /** Optional — the resolution screen's "Pray about this" button, wired
   * up only when the caller wants it (PathEventList does, to hand off to
   * the prayer journal). Never required to finish the lesson. */
  onPrayAboutThis?: () => void;
  /** Whether to show the passive premium nudge below it — computed by the
   * caller (shouldShowPremiumNudge, src/lib/premiumNudge.ts) and never
   * true for premium users. */
  showPremiumNudge?: boolean;
  /** Fires once, the moment the nudge becomes visible — separate from
   * tapping it, records the "shown" half of its cadence throttling. */
  onPremiumNudgeShown?: () => void;
  /** The nudge's own link — closes the lesson and opens the upgrade flow,
   * same "closes lesson, hands off" shape as onPrayAboutThis. */
  onPremiumNudgeTap?: () => void;
};

function ContextDropdown({ context }: { context: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-mist bg-ivory/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-stone"
      >
        <span>More context</span>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>
      {open && <p className="px-3 pb-3 text-xs text-ink/70 leading-relaxed">{context}</p>}
    </div>
  );
}

function IntroScreen({ lesson, onNext }: { lesson: LessonDoc; onNext: () => void }) {
  const meta = CONTENT_TYPE_META[lesson.track];
  const Icon = meta.icon;
  const [imgError, setImgError] = useState(false);
  const showImage = lesson.imageUrl && !imgError;

  return (
    <div className="flex flex-col gap-4">
      <div className={`relative h-[160px] rounded-2xl overflow-hidden flex items-center justify-center ${meta.imageBgClass}`}>
        {showImage ? (
          <Image
            src={lesson.imageUrl!}
            alt=""
            fill
            sizes="(min-width: 640px) 400px, 90vw"
            className="object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Icon className={`h-14 w-14 ${meta.imageIconClass}`} />
        )}
      </div>
      {lesson.scriptureReference && (
        <span className="text-xs font-semibold uppercase tracking-wide text-clay-600">
          {lesson.scriptureReference}
        </span>
      )}
      <h2 className="text-lg font-bold text-ink">{lesson.title}</h2>
      <p className="text-sm text-ink/80 leading-relaxed">{lesson.summary}</p>
      <button
        type="button"
        onClick={onNext}
        className={`self-start rounded-full px-5 py-2 text-sm font-bold ${meta.activeBgClass}`}
      >
        Begin
      </button>
    </div>
  );
}

function ScenarioScreenView({
  screen,
  meta,
  isLocked,
  onSave,
  onNext,
}: {
  screen: ScenarioScreen;
  meta: (typeof CONTENT_TYPE_META)[keyof typeof CONTENT_TYPE_META];
  isLocked: boolean;
  onSave: (text: string) => Promise<void>;
  onNext: () => void;
}) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setSaving(true);
    setError(null);
    try {
      await onSave(text);
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that — try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-base font-semibold text-ink leading-snug">{screen.prompt}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={screen.placeholder ?? "Write what you'd say…"}
        rows={4}
        disabled={isLocked}
        className="w-full rounded-xl border border-mist bg-ivory px-3 py-2 text-sm text-ink placeholder:text-stone/70 resize-none disabled:opacity-70"
      />
      {screen.context && <ContextDropdown context={screen.context} />}
      {error && <p className="text-xs text-clay-700">{error}</p>}
      <button
        type="button"
        disabled={!text.trim() || isLocked || saving}
        onClick={() => void handleContinue()}
        className={`self-start rounded-full px-5 py-2 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed ${meta.activeBgClass}`}
      >
        {saving ? "Saving…" : "Continue"}
      </button>
    </div>
  );
}

function MultipleChoiceScreenView({
  screen,
  meta,
  isLocked,
  onNext,
}: {
  screen: MultipleChoiceScreen;
  meta: (typeof CONTENT_TYPE_META)[keyof typeof CONTENT_TYPE_META];
  isLocked: boolean;
  onNext: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const correct = picked === screen.correctIndex;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-base font-semibold text-ink leading-snug">{screen.prompt}</p>
      <div className="flex flex-col gap-2">
        {screen.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            disabled={isLocked}
            onClick={() => setPicked(i)}
            className={`text-left rounded-xl border-2 px-3.5 py-2.5 text-sm font-medium transition-colors disabled:opacity-70 ${
              picked === i
                ? correct
                  ? "border-transparent bg-sage-700 text-paper"
                  : "border-transparent bg-ink text-paper"
                : "border-mist bg-paper text-ink hover:bg-mist/30"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {picked !== null && !correct && (
        <p className="text-xs font-medium text-clay-600">Not quite — take another look.</p>
      )}
      {screen.context && <ContextDropdown context={screen.context} />}
      <button
        type="button"
        disabled={!correct || isLocked}
        onClick={onNext}
        className={`self-start rounded-full px-5 py-2 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed ${meta.activeBgClass}`}
      >
        Continue
      </button>
    </div>
  );
}

function ReadAndAnswerScreenView({
  screen,
  meta,
  isLocked,
  onNext,
}: {
  screen: ReadAndAnswerScreen;
  meta: (typeof CONTENT_TYPE_META)[keyof typeof CONTENT_TYPE_META];
  isLocked: boolean;
  onNext: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const correct = picked === screen.correctIndex;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl bg-ivory border border-mist p-3.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone mb-1.5">Read</p>
        <p className="text-sm text-ink/85 leading-relaxed whitespace-pre-wrap">{screen.passage}</p>
      </div>
      <p className="text-base font-semibold text-ink leading-snug">{screen.prompt}</p>
      <div className="flex flex-col gap-2">
        {screen.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            disabled={isLocked}
            onClick={() => setPicked(i)}
            className={`text-left rounded-xl border-2 px-3.5 py-2.5 text-sm font-medium transition-colors disabled:opacity-70 ${
              picked === i
                ? correct
                  ? "border-transparent bg-sage-700 text-paper"
                  : "border-transparent bg-ink text-paper"
                : "border-mist bg-paper text-ink hover:bg-mist/30"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {picked !== null && !correct && (
        <p className="text-xs font-medium text-clay-600">Not quite — take another look at the passage above.</p>
      )}
      {screen.context && <ContextDropdown context={screen.context} />}
      <button
        type="button"
        disabled={!correct || isLocked}
        onClick={onNext}
        className={`self-start rounded-full px-5 py-2 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed ${meta.activeBgClass}`}
      >
        Continue
      </button>
    </div>
  );
}

function ShortAnswerScreenView({
  screen,
  meta,
  isLocked,
  onSave,
  onNext,
}: {
  screen: ShortAnswerScreen;
  meta: (typeof CONTENT_TYPE_META)[keyof typeof CONTENT_TYPE_META];
  isLocked: boolean;
  onSave: (text: string) => Promise<void>;
  onNext: () => void;
}) {
  const [text, setText] = useState("");
  const [selfMarked, setSelfMarked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck() {
    setSaving(true);
    setError(null);
    try {
      await onSave(text);
      setSelfMarked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that — try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-base font-semibold text-ink leading-snug">{screen.prompt}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Your answer…"
        rows={3}
        disabled={isLocked || selfMarked}
        className="w-full rounded-xl border border-mist bg-ivory px-3 py-2 text-sm text-ink placeholder:text-stone/70 resize-none disabled:opacity-70"
      />
      {screen.context && <ContextDropdown context={screen.context} />}
      {error && <p className="text-xs text-clay-700">{error}</p>}
      {!selfMarked ? (
        <button
          type="button"
          disabled={!text.trim() || isLocked || saving}
          onClick={() => void handleCheck()}
          className={`self-start rounded-full px-5 py-2 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed ${meta.activeBgClass}`}
        >
          {saving ? "Saving…" : "Check my thinking"}
        </button>
      ) : (
        <button
          type="button"
          disabled={isLocked}
          onClick={onNext}
          className="self-start rounded-full bg-sage-700 text-paper px-5 py-2 text-sm font-bold disabled:opacity-40"
        >
          Continue
        </button>
      )}
    </div>
  );
}

function VerseBlankScreenView({
  screen,
  track,
  isLocked,
  onNext,
}: {
  screen: VerseBlankScreen;
  track: LessonDoc["track"];
  isLocked: boolean;
  onNext: () => void;
}) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-base font-semibold text-ink leading-snug">{screen.prompt}</p>
      <FillBlankCard
        activity={screen.activity}
        track={track}
        isDone={false}
        isLocked={isLocked}
        isPending={false}
        onComplete={async () => setDone(true)}
      />
      {done && (
        <button
          type="button"
          onClick={onNext}
          className="self-start rounded-full bg-sage-700 text-paper px-5 py-2 text-sm font-bold"
        >
          Continue
        </button>
      )}
    </div>
  );
}

function ResolutionScreen({
  lesson,
  isLocked,
  isPending,
  onComplete,
  onPrayAboutThis,
  showPremiumNudge,
  onPremiumNudgeShown,
  onPremiumNudgeTap,
}: {
  lesson: LessonDoc;
  isLocked: boolean;
  isPending: boolean;
  onComplete: () => Promise<void>;
  onPrayAboutThis?: () => void;
  showPremiumNudge?: boolean;
  onPremiumNudgeShown?: () => void;
  onPremiumNudgeTap?: () => void;
}) {
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Fires once when this screen mounts with the nudge visible — records
  // it as shown so the interval-based cadence advances regardless of
  // whether the user taps it. Doesn't need to re-fire on every render
  // (showPremiumNudge/onPremiumNudgeShown are stable for this screen's
  // lifetime), only once per time the resolution screen is reached.
  useEffect(() => {
    if (showPremiumNudge) onPremiumNudgeShown?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleComplete() {
    setCompleting(true);
    setCompleteError(null);
    try {
      await onComplete();
    } catch (err) {
      // A failed save used to be silent — the button just quietly reverted
      // to "Complete" with nothing else on screen, which read as "nothing
      // happened" rather than "this failed." Surface it instead, and log
      // it so a real recurrence is visible without needing devtools open.
      console.error("LessonFlow: completing lesson failed", err);
      setCompleteError(
        err instanceof Error ? err.message : "Couldn't save that — check your connection and try again.",
      );
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-sage-700">What happened</span>
      <p className="text-sm text-ink/80 leading-relaxed">{lesson.resolution}</p>
      <div className="rounded-xl bg-dusk-50 border border-dusk-200 p-3.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-dusk-700 mb-1">Next up</p>
        <p className="text-sm text-ink/80 leading-relaxed">{lesson.nextHook}</p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          disabled={isLocked || isPending || completing}
          onClick={() => void handleComplete()}
          className="self-start rounded-full bg-sage-700 text-paper px-5 py-2 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {completing || isPending ? "Saving…" : "Complete"}
        </button>
        {onPrayAboutThis && (
          <button
            type="button"
            onClick={onPrayAboutThis}
            className="self-start rounded-full border border-dusk-300 text-dusk-700 px-5 py-2 text-sm font-medium hover:bg-dusk-50 transition-colors"
          >
            Pray about this
          </button>
        )}
      </div>
      {completeError && (
        <p className="text-xs text-clay-700">
          {completeError} —{" "}
          <button type="button" onClick={() => void handleComplete()} className="underline">
            try again
          </button>
        </p>
      )}
      {isLocked && <p className="text-xs text-stone">You&apos;ve reached today&apos;s limit — come back tomorrow to finish this one.</p>}
      {showPremiumNudge && (
        <p className="text-xs text-stone">
          The story doesn&apos;t have to wait until tomorrow.{" "}
          <button
            type="button"
            onClick={onPremiumNudgeTap}
            className="underline hover:text-clay-700 transition-colors"
          >
            See what&apos;s next
          </button>
        </p>
      )}
    </div>
  );
}

/** A lesson's guided, one-screen-at-a-time sequence — intro (illustration +
 * scene setup) → one question screen per LessonScreen (scenario / read and
 * answer / multiple choice / short answer / the existing verse
 * fill-in-the-blank, reused unmodified) → a resolution screen (what
 * happened + a cliffhanger to the next lesson), where completing actually
 * fires. Only "current"/"completed" lessons ever reach this component
 * (PathEventList gates that); a `completed` lesson gets a compact
 * read-only recap instead of the full interactive replay, since
 * re-running onComplete would double-count it. */
export function LessonFlow({
  lesson,
  uid,
  isDone,
  isLocked,
  isPending,
  onComplete,
  onPrayAboutThis,
  showPremiumNudge,
  onPremiumNudgeShown,
  onPremiumNudgeTap,
}: LessonFlowProps) {
  const [step, setStep] = useState(0);
  const meta = CONTENT_TYPE_META[lesson.track];
  const totalSteps = lesson.screens.length + 2; // intro + questions + resolution
  const rootRef = useRef<HTMLDivElement>(null);

  // Screens vary wildly in height (a short multipleChoice vs. a long
  // readAndAnswer passage), but they all render inside the same outer
  // scroll container (page.tsx's flex-1 overflow-y-auto div). Without
  // this, advancing/going back leaves the container at whatever
  // scrollTop the previous, differently-sized screen had, so the new
  // one can render already scrolled past its own top — the intro
  // screen's hero image looking clipped/offset is this same bug, just
  // triggered by opening the lesson itself (step 0's first render)
  // rather than by stepping between screens.
  useEffect(() => {
    rootRef.current?.closest<HTMLElement>(".overflow-y-auto")?.scrollTo({ top: 0 });
  }, [step]);

  if (isDone) {
    return (
      <div className="flex flex-col gap-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-clay-600">
          {lesson.scriptureReference ?? lesson.lessonBook}
        </span>
        <h2 className="text-lg font-bold text-ink">{lesson.title}</h2>
        <span className="self-start rounded-full bg-sage-50 text-sage-700 text-xs font-semibold px-3 py-1">
          Completed
        </span>
        <p className="text-sm text-ink/80 leading-relaxed">{lesson.resolution}</p>
      </div>
    );
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
  }
  function goNext() {
    setStep((s) => Math.min(totalSteps - 1, s + 1));
  }

  async function handleSaveAnswer(screen: ScenarioScreen | ShortAnswerScreen, text: string) {
    await saveLessonAnswer(uid, lesson.id, screen.id, text);
  }

  function renderScreen(screen: LessonScreen) {
    switch (screen.type) {
      case "scenario":
        return (
          <ScenarioScreenView
            key={screen.id}
            screen={screen}
            meta={meta}
            isLocked={isLocked}
            onSave={(text) => handleSaveAnswer(screen, text)}
            onNext={goNext}
          />
        );
      case "multipleChoice":
        return (
          <MultipleChoiceScreenView key={screen.id} screen={screen} meta={meta} isLocked={isLocked} onNext={goNext} />
        );
      case "readAndAnswer":
        return (
          <ReadAndAnswerScreenView key={screen.id} screen={screen} meta={meta} isLocked={isLocked} onNext={goNext} />
        );
      case "shortAnswer":
        return (
          <ShortAnswerScreenView
            key={screen.id}
            screen={screen}
            meta={meta}
            isLocked={isLocked}
            onSave={(text) => handleSaveAnswer(screen, text)}
            onNext={goNext}
          />
        );
      case "verseBlank":
        return (
          <VerseBlankScreenView
            key={screen.id}
            screen={screen}
            track={lesson.track}
            isLocked={isLocked}
            onNext={goNext}
          />
        );
    }
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="text-stone disabled:opacity-0"
          aria-label="Previous screen"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </button>
        <div className="flex-1 h-1.5 rounded-full bg-mist overflow-hidden">
          <div
            className={`h-full transition-all ${meta.solidBgClass}`}
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
        <span className="text-xs text-stone shrink-0">
          {step + 1} of {totalSteps}
        </span>
      </div>

      {step === 0 && <IntroScreen lesson={lesson} onNext={goNext} />}
      {step >= 1 && step <= lesson.screens.length && renderScreen(lesson.screens[step - 1])}
      {step === totalSteps - 1 && (
        <ResolutionScreen
          lesson={lesson}
          isLocked={isLocked}
          isPending={isPending}
          onComplete={onComplete}
          onPrayAboutThis={onPrayAboutThis}
          showPremiumNudge={showPremiumNudge}
          onPremiumNudgeShown={onPremiumNudgeShown}
          onPremiumNudgeTap={onPremiumNudgeTap}
        />
      )}
    </div>
  );
}
