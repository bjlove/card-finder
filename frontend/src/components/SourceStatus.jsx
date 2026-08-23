const SOURCE_LABEL = {
  ebay: "eBay",
  goldin: "Goldin",
  fanatics: "Fanatics Collect",
};

function timeAgo(iso) {
  if (!iso) return "never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

export default function SourceStatus({ sourceStatus = {} }) {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
      {Object.entries(SOURCE_LABEL).map(([key, label]) => {
        const status = sourceStatus[key];
        const ok = status?.ok;
        return (
          <span key={key} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`} />
            {label}: {ok ? `updated ${timeAgo(status?.lastSuccess)}` : status ? `failing — ${status.error}` : "no data yet"}
          </span>
        );
      })}
    </div>
  );
}
