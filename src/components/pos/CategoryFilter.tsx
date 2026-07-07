"use client";

type CategoryFilterProps = {
  categories: { id: string; name: string }[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export function CategoryFilter({
  categories,
  selectedId,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          selectedId === null
            ? "bg-orange-600 text-white"
            : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
        }`}
      >
        Semua
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category.id)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selectedId === category.id
              ? "bg-orange-600 text-white"
              : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
