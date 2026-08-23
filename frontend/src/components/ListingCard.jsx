const SOURCE_LABEL = {
  ebay: "eBay",
  goldin: "Goldin",
  fanatics: "Fanatics Collect",
};

const SOURCE_COLOR = {
  ebay: "bg-blue-100 text-blue-800",
  goldin: "bg-amber-100 text-amber-800",
  fanatics: "bg-purple-100 text-purple-800",
};

export default function ListingCard({ listing }) {
  const { source, title, price, currency, image, url, listingType } = listing;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-square w-full bg-gray-100">
        {image ? (
          <img src={image} alt={title ?? "Listing image"} className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">No image</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className={`w-fit rounded px-2 py-0.5 text-xs font-medium ${SOURCE_COLOR[source] ?? "bg-gray-100 text-gray-800"}`}>
          {SOURCE_LABEL[source] ?? source}
        </span>
        <p className="line-clamp-2 text-sm text-gray-700" title={title ?? ""}>
          {title ?? "Untitled listing"}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-semibold text-gray-900">
            {price != null ? `$${price.toLocaleString()} ${currency}` : "—"}
          </span>
          <span className="text-xs uppercase tracking-wide text-gray-500">
            {listingType === "auction" ? "Auction" : "Buy Now"}
          </span>
        </div>
      </div>
    </a>
  );
}
