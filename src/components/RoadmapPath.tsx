import { CheckIcon, LockIcon, ScrollIcon } from "@/components/icons";
import type { RoadmapNodeState } from "@/lib/roadmap";
import type { LessonDoc } from "@/types/firestore";

const DESIGN_WIDTH = 300;
const ROW_HEIGHT = 108;
const NODE_SIZE = 56;
const LEFT_X = 74;
const RIGHT_X = 226;

type RoadmapPathProps = {
  lessons: LessonDoc[];
  states: Map<string, RoadmapNodeState>;
  onSelect: (lesson: LessonDoc) => void;
};

/** A winding path of connected nodes for one book's stories — alternating
 * left/right down the accordion body, connected by a curved line, instead
 * of a flat list. Users walk it in order: only "completed" and "current"
 * nodes are tappable (opens that story); "sequenceLocked" and
 * "paywallLocked" nodes are inert circles with a lock glyph — the per-book
 * UnlockCard below already explains the paywall case in words, so nodes
 * themselves don't need to distinguish why they're locked, just that they
 * are. */
export function RoadmapPath({ lessons, states, onSelect }: RoadmapPathProps) {
  const height = (lessons.length - 1) * ROW_HEIGHT + NODE_SIZE + 32;

  const positions = lessons.map((lesson, index) => ({
    lesson,
    x: index % 2 === 0 ? LEFT_X : RIGHT_X,
    y: index * ROW_HEIGHT + NODE_SIZE / 2 + 16,
  }));

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${DESIGN_WIDTH} ${height}`}
        preserveAspectRatio="none"
      >
        {positions.slice(1).map((to, i) => {
          const from = positions[i];
          const state = states.get(to.lesson.id);
          const walked = state === "completed" || state === "current";
          const midY = (from.y + to.y) / 2;
          return (
            <path
              key={to.lesson.id}
              d={`M ${from.x} ${from.y} C ${from.x} ${midY} ${to.x} ${midY} ${to.x} ${to.y}`}
              fill="none"
              stroke={walked ? "var(--color-sage-400)" : "var(--color-mist)"}
              strokeWidth={walked ? 3 : 2}
              strokeDasharray={walked ? undefined : "5 5"}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {positions.map(({ lesson, x, y }) => {
        const state = states.get(lesson.id) ?? "paywallLocked";
        const isTappable = state === "completed" || state === "current";
        const isCurrent = state === "current";

        return (
          <div
            key={lesson.id}
            className="absolute flex flex-col items-center gap-1"
            style={{
              left: `${(x / DESIGN_WIDTH) * 100}%`,
              top: y,
              transform: "translate(-50%, -50%)",
              width: 110,
            }}
          >
            <button
              type="button"
              disabled={!isTappable}
              onClick={() => onSelect(lesson)}
              aria-label={lesson.title}
              className={`flex items-center justify-center rounded-full border-2 transition-transform ${
                state === "completed"
                  ? "bg-clay-600 border-clay-600 text-paper"
                  : isCurrent
                    ? "bg-clay-600 border-clay-200 text-paper scale-110 ring-4 ring-clay-100"
                    : "bg-mist border-mist text-stone opacity-70 cursor-not-allowed"
              }`}
              style={{ height: NODE_SIZE, width: NODE_SIZE }}
            >
              {state === "completed" ? (
                <CheckIcon className="h-6 w-6" />
              ) : isTappable ? (
                <ScrollIcon className="h-6 w-6" />
              ) : (
                <LockIcon className="h-5 w-5" />
              )}
            </button>
            <span className="text-[10px] text-center text-stone leading-tight line-clamp-2">
              {lesson.title}
            </span>
          </div>
        );
      })}
    </div>
  );
}
