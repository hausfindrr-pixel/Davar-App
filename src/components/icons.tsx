type IconProps = { className?: string };

/** A flame — the pull of temptation, named honestly. */
export function FlameIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3c1 2.5-1.5 3.5-1.5 6 0 1.2.9 2 2 2s2-1 2-2.3c1.6 1.3 2.5 3.2 2.5 5.3a5 5 0 0 1-10 0c0-3 1.7-4.7 3-6.5C11 6 11.5 4.5 12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A compass — finding direction when growth feels overwhelming. */
export function CompassIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M14.8 9.2 13.2 13.2 9.2 14.8 10.8 10.8 14.8 9.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Two people — community, an accountability partner. */
export function UsersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16" cy="11" r="2.4" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5M13.5 19c0-2-1-3.7-2.5-4.7a4 4 0 0 1 6.5 3.1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** An open book — daily Scripture, the lesson library. */
export function BookOpenIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 5.5c2.5-1 5-1 8 .3 3-1.3 5.5-1.3 8-.3v13c-2.5-1-5-1-8 .3-3-1.3-5.5-1.3-8-.3v-13Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M12 5.8v13" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

/** Ascending bars — progress analytics. */
export function BarChartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5 19v-5M12 19V8M19 19v-9"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A checkmark — used in feature lists. */
export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M4 10.5 8 14l8-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
