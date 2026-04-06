"use client";
import React from "react";

interface ProductDescriptionProps {
  description?: string;
  tags?: string[];
}

export default function ProductDescription({
  description,
  tags = [],
}: ProductDescriptionProps) {
  return (
    <div className="space-y-4">
      {description && (
        <p className="text-sm leading-relaxed text-gray-700">{description}</p>
      )}

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium"
            >
              {tag.charAt(0).toUpperCase() + tag.slice(1).replace("-", " ")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
