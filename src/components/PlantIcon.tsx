type PlantIconProps = {
  stage: 0 | 1 | 2 | 3 | 4 | 5;
  className?: string;
};

/** A small growing plant, from bare soil (0) to full bloom (5). */
export function PlantIcon({ stage, className }: PlantIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {/* soil */}
      <ellipse cx="50" cy="88" rx="22" ry="5" className="fill-clay-200/60" />

      {stage === 0 && <circle cx="50" cy="84" r="3" className="fill-sage-600" />}

      {stage >= 1 && (
        <path
          d={
            stage >= 4
              ? "M50 88 C50 70 50 55 50 38"
              : stage >= 2
                ? "M50 88 C50 74 50 62 50 50"
                : "M50 88 C50 80 50 75 50 70"
          }
          stroke="currentColor"
          className="stroke-sage-600"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}

      {stage >= 1 && (
        <ellipse
          cx="41"
          cy={stage >= 2 ? 66 : 74}
          rx="9"
          ry="5.5"
          transform={`rotate(-35 41 ${stage >= 2 ? 66 : 74})`}
          className="fill-sage-400"
        />
      )}
      {stage >= 2 && (
        <ellipse
          cx="59"
          cy="60"
          rx="9"
          ry="5.5"
          transform="rotate(35 59 60)"
          className="fill-sage-400"
        />
      )}
      {stage >= 3 && (
        <ellipse
          cx="38"
          cy="48"
          rx="10"
          ry="6"
          transform="rotate(-30 38 48)"
          className="fill-sage-400"
        />
      )}
      {stage >= 3 && (
        <ellipse
          cx="62"
          cy="46"
          rx="10"
          ry="6"
          transform="rotate(30 62 46)"
          className="fill-sage-400"
        />
      )}

      {stage >= 4 &&
        [0, 72, 144, 216, 288].map((angle) => (
          <ellipse
            key={angle}
            cx="50"
            cy="30"
            rx="6.5"
            ry="10"
            transform={`rotate(${angle} 50 38)`}
            className={stage >= 5 ? "fill-clay-400" : "fill-sage-400"}
          />
        ))}
      {stage >= 4 && <circle cx="50" cy="38" r="5" className="fill-clay-600" />}
    </svg>
  );
}
