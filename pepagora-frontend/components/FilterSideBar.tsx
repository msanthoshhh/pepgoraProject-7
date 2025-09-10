"use client";
import { useState } from "react";

interface FilterSidebarProps {
  categories: { _id: string; main_cat_name: string; subcategories: { _id: string; name: string }[] }[];
  selectedCategories: string[];
  selectedSubcategories: string[];
  setSelectedCategories: (cats: string[]) => void;
  setSelectedSubcategories: (subs: string[]) => void;
  onApply: () => void;
  onReset: () => void;
}

export default function FilterSidebar({
  categories,
  selectedCategories,
  selectedSubcategories,
  setSelectedCategories,
  setSelectedSubcategories,
  onApply,
  onReset,
}: FilterSidebarProps) {
  const [open, setOpen] = useState(false);

  const toggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const toggleSubcategory = (id: string) => {
    if (selectedSubcategories.includes(id)) {
      setSelectedSubcategories(selectedSubcategories.filter((s) => s !== id));
    } else {
      setSelectedSubcategories([...selectedSubcategories, id]);
    }
  };

  return (
    <>
      {/* Filter Button */}
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Filters
      </button>

      {/* Sidebar */}
      {open && (
        <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-lg p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Filters</h2>
            <button onClick={() => setOpen(false)}>X</button>
          </div>

          {/* Category Filters */}
          <div className="space-y-4 overflow-y-auto max-h-[70vh]">
            {categories.map((cat) => (
              <div key={cat._id}>
                <label className="font-medium block">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat._id)}
                    onChange={() => toggleCategory(cat._id)}
                    className="mr-2"
                  />
                  {cat.main_cat_name}
                </label>

                {/* Subcategories */}
                <div className="ml-6 mt-2 space-y-1">
                  {cat.subcategories.map((sub) => (
                    <label key={sub._id} className="block text-sm">
                      <input
                        type="checkbox"
                        checked={selectedSubcategories.includes(sub._id)}
                        onChange={() => toggleSubcategory(sub._id)}
                        className="mr-2"
                      />
                      {sub.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="absolute bottom-4 left-0 w-full px-4 flex justify-between">
            <button
              onClick={() => {
                onReset();
                setOpen(false);
              }}
              className="px-4 py-2 bg-gray-200 rounded-lg"
            >
              Reset
            </button>
            <button
              onClick={() => {
                onApply();
                setOpen(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </>
  );
}
