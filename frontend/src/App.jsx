import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase.js";
import CardSection from "./components/CardSection.jsx";

export default function App() {
  const [cards, setCards] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "listings"),
      (snapshot) => {
        setCards(snapshot.docs.map((doc) => doc.data()));
      },
      (err) => setError(err.message)
    );
    return unsubscribe;
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Card Finder</h1>
      <p className="mb-8 text-sm text-gray-500">Live listings across eBay, Goldin, and Fanatics Collect. Refreshed hourly.</p>

      {error && (
        <div className="mb-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Couldn&apos;t load data: {error}
        </div>
      )}

      {!error && cards === null && <p className="text-gray-500">Loading…</p>}

      {cards?.length === 0 && (
        <p className="text-gray-500">No data yet — run the scraper once (see scraper/README) to populate Firestore.</p>
      )}

      {cards?.map((card) => (
        <CardSection key={`${card.player}-${card.cardNumber}`} card={card} />
      ))}
    </div>
  );
}
