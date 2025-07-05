"use client";
import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const { data } = await axios.post("/api/query", { query });
    setResults(data.results);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Web Query Agent</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border p-2 w-80 rounded-sm"
        placeholder="Enter your query..."
      />
      <button
        onClick={handleSearch}
        className="bg-blue-500 rounded-sm text-white px-4 py-2 ml-2 hover:bg-blue-600 hover:cursor-pointer ">
        Search
      </button>

      <div className="mt-6 space-y-4">
        {results.map((item: any, i) => (
          <div key={i} className="border p-4">
            <a href={item.url} className="text-blue-600 underline">
              {item.url}
            </a>
            <p>{item.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
