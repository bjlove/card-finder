import ListingCard from "./ListingCard.jsx";
import SourceStatus from "./SourceStatus.jsx";

function groupByParallel(items, parallels) {
  const groups = new Map(parallels.map((p) => [p.name, []]));
  groups.set("Unmatched / Other", []);

  for (const item of items) {
    const key = item.parallel && groups.has(item.parallel) ? item.parallel : "Unmatched / Other";
    groups.get(key).push(item);
  }

  return groups;
}

export default function CardSection({ card }) {
  const allItems = Object.values(card.items ?? {}).flat();
  const groups = groupByParallel(allItems, card.parallels ?? []);
  const parallelByName = new Map((card.parallels ?? []).map((p) => [p.name, p]));

  return (
    <section className="mb-10">
      <div className="mb-3 flex flex-col gap-1">
        <h2 className="text-xl font-bold text-gray-900">
          {card.year} {card.set} — {card.player}{" "}
          <span className="font-normal text-gray-500">#{card.cardNumber}</span>
        </h2>
        <SourceStatus sourceStatus={card.sourceStatus} />
      </div>

      {[...groups.entries()].map(([parallelName, items]) => {
        if (items.length === 0) return null;
        const parallel = parallelByName.get(parallelName);

        return (
          <div key={parallelName} className="mb-6">
            <div className="mb-2 flex items-baseline gap-3">
              <h3 className="text-sm font-semibold text-gray-800">
                {parallelName} {parallel?.printRun ? `(/${parallel.printRun})` : ""}
              </h3>
              {parallel?.psa10Estimate && (
                <span className="text-xs text-gray-400">
                  PSA 10 est. ${parallel.psa10Estimate[0].toLocaleString()}–${parallel.psa10Estimate[1].toLocaleString()}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {items.map((item, i) => (
                <ListingCard key={`${item.source}-${item.url}-${i}`} listing={item} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
