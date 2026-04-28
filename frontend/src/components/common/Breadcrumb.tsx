"use client";

import { useRouter } from "next/router";
import Link from "next/link";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbProps {
  customItems?: BreadcrumbItem[];
  productName?: string;
}

export default function Breadcrumb({ customItems, productName }: BreadcrumbProps) {
  const router = useRouter();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) return customItems;

    const pathSegments = router.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/' }
    ];

    // Handle dynamic routes and special cases
    pathSegments.forEach((segment, index) => {
      const isLast = index === pathSegments.length - 1;

      switch (segment) {
        case 'products':
          breadcrumbs.push({
            label: 'Products',
            href: isLast ? undefined : '/products',
            isActive: isLast
          });
          break;
        case 'productpage':
          breadcrumbs.push({
            label: 'Products',
            href: '/products'
          });
          if (isLast || pathSegments[index + 1] === '[id]') {
            breadcrumbs.push({
              label: productName || 'Product',
              isActive: true
            });
          }
          break;
        case 'cart':
          breadcrumbs.push({
            label: 'Cart',
            isActive: true
          });
          break;
        case 'orders':
          breadcrumbs.push({
            label: 'Orders',
            isActive: true
          });
          break;
        case 'wishlist':
          breadcrumbs.push({
            label: 'Wishlist',
            isActive: true
          });
          break;
        case 'profile':
          breadcrumbs.push({
            label: 'Profile',
            isActive: true
          });
          break;
        case 'services':
          breadcrumbs.push({
            label: 'Services',
            isActive: true
          });
          break;
        case 'contact':
          breadcrumbs.push({
            label: 'Contact',
            isActive: true
          });
          break;
        case 'about':
          breadcrumbs.push({
            label: 'About',
            isActive: true
          });
          break;
        case 'corporate-offers':
          breadcrumbs.push({
            label: 'Corporate Offers',
            isActive: true
          });
          break;
        case 'vendor':
          if (pathSegments[index + 1] === 'dashboard') {
            breadcrumbs.push({
              label: 'Vendor Dashboard',
              isActive: true
            });
          } else {
            breadcrumbs.push({
              label: 'Vendor',
              isActive: true
            });
          }
          break;
        case 'admin':
          breadcrumbs.push({
            label: 'Admin',
            isActive: true
          });
          break;
        case '[id]':
          // Skip dynamic [id] segments - they're handled by productName
          break;
        default:
          // For unknown segments, capitalize and use as label
          const label = segment.charAt(0).toUpperCase() + segment.slice(1);
          breadcrumbs.push({
            label,
            isActive: isLast
          });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) return null; // Don't show breadcrumbs if only Home

  return (
    <nav aria-label="Breadcrumb" className="">
      <ol className="flex items-center space-x-1 text-gray-500 whitespace-nowrap overflow-x-auto">
        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center flex-shrink-0">
            {index === 0 ? (
              <Link
                href={item.href || '/'}
                className="flex items-center text-gray-600 hover:text-green-600 transition-colors flex-shrink-0"
              >
                <HomeIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="sr-only">Home</span>
              </Link>
            ) : item.href && !item.isActive ? (
              <Link
                href={item.href}
                className="text-gray-600 hover:text-green-600 transition-colors truncate"
              >
                {item.label}
              </Link>
            ) : (
              <span className={`font-medium truncate ${item.isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                {item.label}
              </span>
            )}

            {index < breadcrumbs.length - 1 && (
              <ChevronRightIcon className="h-3 w-3 sm:h-4 sm:w-4 mx-1 text-gray-400 flex-shrink-0" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}