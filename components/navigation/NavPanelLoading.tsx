export function NavPanelLoading() {
  return (
    <div className="flex h-full min-h-[18rem] items-center justify-center px-4 py-12">
      <div
        aria-live="polite"
        className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.065] px-5 py-3.5 text-sm font-medium text-slate-200 shadow-lg shadow-black/15"
        role="status"
      >
        <svg
          aria-hidden="true"
          className="loading-hourglass size-5 shrink-0 text-cyan-200"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M7 3h10M7 21h10M8 3c0 4 1.4 6.5 4 9-2.6 2.5-4 5-4 9m8-18c0 4-1.4 6.5-4 9 2.6 2.5 4 5 4 9"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <path
            d="M9.5 7.5h5L12 10l-2.5-2.5Zm0 10.5 2.5-3 2.5 3h-5Z"
            fill="currentColor"
            opacity="0.75"
          />
        </svg>
        <span>Loading..</span>
      </div>
    </div>
  );
}
