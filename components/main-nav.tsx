"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MainNav({ className }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  const routes = [
    {
      href: `/`,
      label: "Dashboard",
      active: pathname === `/`,
    },
    {
      href: `/crusts`,
      label: "Crusts",
      active: pathname === `/crusts`,
    },
    {
      href: `/tags`,
      label: "Tags",
      active: pathname === `/tags`,
    },
    {
      href: `/pizzas`,
      label: "Pizzas",
      active: pathname === `/pizzas`,
    },
    {
      href: `/beverages`,
      label: "Beverages",
      active: pathname === `/beverages`,
    },
    {
      href: `/chickens`,
      label: "Chickens",
      active: pathname === `/chickens`,
    },
    {
      href: `/appetizers`,
      label: "Appetizers",
      active: pathname === `/appetizers`,
    },
    {
      href: `/combos`,
      label: "Combos",
      active: pathname === `/combos`,
    },
    {
      href: `/orders`,
      label: "Orders",
      active: pathname === `/orders`,
    },
  ];

  return (
    <nav className={cn("flex items-center", className)}>
      <Link href="/" className="flex items-center">
        <p className="font-bold text-2xl">PizzaPalace</p>
      </Link>
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "ml-6 text-sm font-medium transition-colors hover:text-primary lg:ml-6",
            route.active
              ? "text-black dark:text-white"
              : "text-muted-foreground",
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
