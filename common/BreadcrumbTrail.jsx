import React from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BreadcrumbTrail({
  items,
  language = "en"
}) {
  const isRTL = language === "he";
  const Chevron = isRTL ? ChevronLeft : ChevronRight;

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 rtl:space-x-reverse">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <Chevron className="h-4 w-4 text-gray-400 mx-2" />
            )}
            
            {index === items.length - 1 ? (
              <span className="text-gray-700 font-medium">
                {isRTL ? item.labelHe : item.label}
              </span>
            ) : (
              <Link
                to={createPageUrl(item.href)}
                className="text-gray-500 hover:text-gray-700"
              >
                {isRTL ? item.labelHe : item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}