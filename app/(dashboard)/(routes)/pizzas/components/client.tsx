"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { ApiList } from "@/components/ui/api-list";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Column, columns } from "./columns";

const getReadableTextColor = (hexColor: string) => {
    const sanitized = hexColor.replace("#", "");
    const normalized = sanitized.length === 3
        ? sanitized.split("").map((char) => `${char}${char}`).join("")
        : sanitized;

    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
        return "#ffffff";
    }

    const red = Number.parseInt(normalized.slice(0, 2), 16);
    const green = Number.parseInt(normalized.slice(2, 4), 16);
    const blue = Number.parseInt(normalized.slice(4, 6), 16);
    const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

    return brightness > 160 ? "#111111" : "#ffffff";
};

interface PizzasClientProps {
    data: Column[]
}

const PizzasClient: React.FC<PizzasClientProps> = ({
    data
}) => {
    const router = useRouter();
    const [minPrice, setMinPrice] = useState<string>("");
    const [maxPrice, setMaxPrice] = useState<string>("");
    const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("all");
    const [newOnly, setNewOnly] = useState(false);
    const [bestSellerOnly, setBestSellerOnly] = useState(false);
    const [selectedTagCodes, setSelectedTagCodes] = useState<string[]>([]);

    const tagOptions = useMemo(() => {
        const map = new Map<string, { code: string; name: string; color: string }>();

        data.forEach((pizza) => {
            pizza.tags.forEach((tag) => {
                map.set(tag.code, tag);
            });
        });

        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [data]);

    const filteredData = useMemo(() => {
        const parsedMinPrice = minPrice === "" ? null : Number(minPrice);
        const parsedMaxPrice = maxPrice === "" ? null : Number(maxPrice);

        return data.filter((pizza) => {
            if (parsedMinPrice !== null && pizza.basePrice < parsedMinPrice) {
                return false;
            }

            if (parsedMaxPrice !== null && pizza.basePrice > parsedMaxPrice) {
                return false;
            }

            if (availabilityFilter === "available" && !pizza.isAvailable) {
                return false;
            }

            if (availabilityFilter === "unavailable" && pizza.isAvailable) {
                return false;
            }

            if (newOnly && !pizza.isNew) {
                return false;
            }

            if (bestSellerOnly && !pizza.isBestSeller) {
                return false;
            }

            if (selectedTagCodes.length > 0) {
                const pizzaTagCodes = pizza.tags.map((tag) => tag.code);
                const hasAnySelectedTag = selectedTagCodes.some((code) => pizzaTagCodes.includes(code));

                if (!hasAnySelectedTag) {
                    return false;
                }
            }

            return true;
        });
    }, [data, minPrice, maxPrice, availabilityFilter, newOnly, bestSellerOnly, selectedTagCodes]);

    const clearAllFilters = () => {
        setMinPrice("");
        setMaxPrice("");
        setAvailabilityFilter("all");
        setNewOnly(false);
        setBestSellerOnly(false);
        setSelectedTagCodes([]);
    };

    const selectedTags = tagOptions.filter((tag) => selectedTagCodes.includes(tag.code));
    const hasActiveFilters =
        minPrice !== "" ||
        maxPrice !== "" ||
        availabilityFilter !== "all" ||
        newOnly ||
        bestSellerOnly ||
        selectedTagCodes.length > 0;

    return (
        <div>
            <div className="flex items-center justify-between" >
                <Heading
                    title={`Pizzas (${data.length})`}
                    description="Manage pizzas for your store."
                />
                <Button onClick={() => router.push(`/pizzas/new`)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New
                </Button>
            </div>

            <Separator className="my-2" />

            <div className="space-y-3 py-2">
                <div className="flex flex-wrap items-center gap-3">
                    <Input
                        type="number"
                        min="0"
                        step="1"
                        value={minPrice}
                        onChange={(event) => setMinPrice(event.target.value)}
                        placeholder="Min price"
                        className="w-40"
                    />
                    <Input
                        type="number"
                        min="0"
                        step="1"
                        value={maxPrice}
                        onChange={(event) => setMaxPrice(event.target.value)}
                        placeholder="Max price"
                        className="w-40"
                    />

                    <select
                        value={availabilityFilter}
                        onChange={(event) => setAvailabilityFilter(event.target.value as "all" | "available" | "unavailable")}
                        className="h-9 rounded-md border bg-transparent px-3 py-1 text-sm"
                    >
                        <option value="all">All status</option>
                        <option value="available">Available</option>
                        <option value="unavailable">Unavailable</option>
                    </select>

                    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                        <Checkbox checked={newOnly} onCheckedChange={(checked) => setNewOnly(checked === true)} />
                        <span className="text-sm">New</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                        <Checkbox checked={bestSellerOnly} onCheckedChange={(checked) => setBestSellerOnly(checked === true)} />
                        <span className="text-sm">Best Seller</span>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="outline" className="justify-between">
                                {selectedTagCodes.length > 0
                                    ? `Tags: ${selectedTagCodes.length}`
                                    : "Filter tags"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-70">
                            {tagOptions.map((tag) => {
                                const isSelected = selectedTagCodes.includes(tag.code);

                                return (
                                    <DropdownMenuCheckboxItem
                                        key={tag.code}
                                        checked={isSelected}
                                        onSelect={(event) => event.preventDefault()}
                                        onCheckedChange={(checked) => {
                                            if (checked === true) {
                                                setSelectedTagCodes((prev) => [...prev, tag.code]);
                                                return;
                                            }

                                            setSelectedTagCodes((prev) => prev.filter((code) => code !== tag.code));
                                        }}
                                    >
                                        {tag.name}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button type="button" variant="ghost" onClick={clearAllFilters} disabled={!hasActiveFilters}>
                        Clear all
                    </Button>
                </div>

                {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-2">
                        {minPrice !== "" && <Badge variant="outline">Min: {Number(minPrice).toLocaleString("vi-VN")}</Badge>}
                        {maxPrice !== "" && <Badge variant="outline">Max: {Number(maxPrice).toLocaleString("vi-VN")}</Badge>}
                        {availabilityFilter !== "all" && (
                            <Badge variant="outline">
                                {availabilityFilter === "available" ? "Available" : "Unavailable"}
                            </Badge>
                        )}
                        {newOnly && <Badge variant="outline">New</Badge>}
                        {bestSellerOnly && <Badge variant="outline">Best Seller</Badge>}
                        {selectedTags.map((tag) => (
                            <Badge
                                key={tag.code}
                                variant="outline"
                                style={{
                                    backgroundColor: tag.color,
                                    borderColor: tag.color,
                                    color: getReadableTextColor(tag.color)
                                }}
                                className="gap-1"
                            >
                                {tag.name}
                                <button
                                    type="button"
                                    onClick={() => setSelectedTagCodes((prev) => prev.filter((code) => code !== tag.code))}
                                    className="inline-flex"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            <DataTable
                columns={columns}
                data={filteredData}
                searchKey="name"
                getRowClassName={(row) => row.isAvailable ? "" : "bg-red-50/80 dark:bg-red-950/20"}
            />
            <Heading
                title="API"
                description="API calls for pizzas"
            />

            <Separator className="my-2" />

            <ApiList
                entityName="pizzas"
                entityIdName="pizzaId"
            />
        </div>
    );
};

export default PizzasClient;