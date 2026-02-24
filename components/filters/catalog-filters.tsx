"use client";

import { useMemo, useState } from "react";
import { FilterIcon, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";

export type AvailabilityFilter = "all" | "available" | "unavailable";

export interface CatalogFilterTagOption {
    code: string;
    name: string;
    color?: string;
}

interface UseCatalogFiltersOptions<T> {
    data: T[];
    getPrice: (item: T) => number;
    getIsAvailable: (item: T) => boolean;
    getIsNew?: (item: T) => boolean;
    getIsBestSeller?: (item: T) => boolean;
    getTags?: (item: T) => CatalogFilterTagOption[];
}

export const useCatalogFilters = <T,>({
    data,
    getPrice,
    getIsAvailable,
    getIsNew,
    getIsBestSeller,
    getTags
}: UseCatalogFiltersOptions<T>) => {
    const [minPrice, setMinPrice] = useState<string>("");
    const [maxPrice, setMaxPrice] = useState<string>("");
    const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");
    const [newOnly, setNewOnly] = useState(false);
    const [bestSellerOnly, setBestSellerOnly] = useState(false);
    const [selectedTagCodes, setSelectedTagCodes] = useState<string[]>([]);

    const supportsNewFilter = typeof getIsNew === "function";
    const supportsBestSellerFilter = typeof getIsBestSeller === "function";
    const supportsTagFilter = typeof getTags === "function";

    const tagOptions = useMemo(() => {
        if (!getTags) {
            return [] as CatalogFilterTagOption[];
        }

        const map = new Map<string, CatalogFilterTagOption>();

        data.forEach((item) => {
            getTags(item).forEach((tag) => {
                map.set(tag.code, tag);
            });
        });

        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [data, getTags]);

    const filteredData = useMemo(() => {
        const parsedMinPrice = minPrice === "" ? null : Number(minPrice);
        const parsedMaxPrice = maxPrice === "" ? null : Number(maxPrice);

        return data.filter((item) => {
            const price = getPrice(item);
            const isAvailable = getIsAvailable(item);

            if (parsedMinPrice !== null && price < parsedMinPrice) {
                return false;
            }

            if (parsedMaxPrice !== null && price > parsedMaxPrice) {
                return false;
            }

            if (availabilityFilter === "available" && !isAvailable) {
                return false;
            }

            if (availabilityFilter === "unavailable" && isAvailable) {
                return false;
            }

            if (supportsNewFilter && newOnly && getIsNew && !getIsNew(item)) {
                return false;
            }

            if (supportsBestSellerFilter && bestSellerOnly && getIsBestSeller && !getIsBestSeller(item)) {
                return false;
            }

            if (supportsTagFilter && selectedTagCodes.length > 0 && getTags) {
                const itemTagCodes = getTags(item).map((tag) => tag.code);
                const hasAnySelectedTag = selectedTagCodes.some((code) => itemTagCodes.includes(code));

                if (!hasAnySelectedTag) {
                    return false;
                }
            }

            return true;
        });
    }, [
        availabilityFilter,
        bestSellerOnly,
        data,
        getIsAvailable,
        getIsBestSeller,
        getIsNew,
        getPrice,
        getTags,
        maxPrice,
        minPrice,
        newOnly,
        selectedTagCodes,
        supportsBestSellerFilter,
        supportsNewFilter,
        supportsTagFilter
    ]);

    const clearAllFilters = () => {
        setMinPrice("");
        setMaxPrice("");
        setAvailabilityFilter("all");
        setNewOnly(false);
        setBestSellerOnly(false);
        setSelectedTagCodes([]);
    };

    const hasActiveFilters =
        minPrice !== "" ||
        maxPrice !== "" ||
        availabilityFilter !== "all" ||
        (supportsNewFilter && newOnly) ||
        (supportsBestSellerFilter && bestSellerOnly) ||
        (supportsTagFilter && selectedTagCodes.length > 0);

    return {
        filteredData,
        minPrice,
        setMinPrice,
        maxPrice,
        setMaxPrice,
        availabilityFilter,
        setAvailabilityFilter,
        newOnly,
        setNewOnly,
        bestSellerOnly,
        setBestSellerOnly,
        selectedTagCodes,
        setSelectedTagCodes,
        tagOptions,
        hasActiveFilters,
        clearAllFilters,
        supportsNewFilter,
        supportsBestSellerFilter,
        supportsTagFilter
    };
};

interface CatalogFiltersProps {
    minPrice: string;
    setMinPrice: (value: string) => void;
    maxPrice: string;
    setMaxPrice: (value: string) => void;
    availabilityFilter: AvailabilityFilter;
    setAvailabilityFilter: (value: AvailabilityFilter) => void;
    newOnly: boolean;
    setNewOnly: (value: boolean) => void;
    bestSellerOnly: boolean;
    setBestSellerOnly: (value: boolean) => void;
    selectedTagCodes: string[];
    setSelectedTagCodes: (updater: string[] | ((prev: string[]) => string[])) => void;
    tagOptions: CatalogFilterTagOption[];
    hasActiveFilters: boolean;
    clearAllFilters: () => void;
    supportsNewFilter?: boolean;
    supportsBestSellerFilter?: boolean;
    supportsTagFilter?: boolean;
}

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

export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    availabilityFilter,
    setAvailabilityFilter,
    newOnly,
    setNewOnly,
    bestSellerOnly,
    setBestSellerOnly,
    selectedTagCodes,
    setSelectedTagCodes,
    tagOptions,
    hasActiveFilters,
    clearAllFilters,
    supportsNewFilter = true,
    supportsBestSellerFilter = true,
    supportsTagFilter = true
}) => {
    const selectedTags = useMemo(
        () => tagOptions.filter((tag) => selectedTagCodes.includes(tag.code)),
        [selectedTagCodes, tagOptions]
    );

    const renderTagFilter = (isMobile = false) => {
        if (!supportsTagFilter) {
            return null;
        }

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className={isMobile ? "w-full justify-between" : "justify-between"}>
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
        );
    };

    const renderFilterControls = (isMobile = false) => {
        if (isMobile) {
            return (
                <div className="space-y-3">
                    <Label>Price</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            type="number"
                            min="0"
                            step="1000"
                            value={minPrice}
                            onChange={(event) => setMinPrice(event.target.value)}
                            placeholder="Min price"
                            className="w-full"
                        />
                        <Input
                            type="number"
                            min="0"
                            step="1000"
                            value={maxPrice}
                            onChange={(event) => setMaxPrice(event.target.value)}
                            placeholder="Max price"
                            className="w-full"
                        />
                    </div>

                    <Label>Status</Label>
                    <Select
                        value={availabilityFilter}
                        onValueChange={(value: AvailabilityFilter) => setAvailabilityFilter(value)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="All status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All status</SelectItem>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="unavailable">Unavailable</SelectItem>
                        </SelectContent>
                    </Select>

                    {(supportsNewFilter || supportsBestSellerFilter) && <Label>Flags</Label>}
                    {(supportsNewFilter || supportsBestSellerFilter) && (
                        <div className="grid grid-cols-2 gap-3">
                            {supportsNewFilter && (
                                <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                                    <Checkbox checked={newOnly} onCheckedChange={(checked) => setNewOnly(checked === true)} />
                                    <span className="text-sm">New</span>
                                </div>
                            )}
                            {supportsBestSellerFilter && (
                                <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                                    <Checkbox checked={bestSellerOnly} onCheckedChange={(checked) => setBestSellerOnly(checked === true)} />
                                    <span className="text-sm">Best Seller</span>
                                </div>
                            )}
                        </div>
                    )}

                    {supportsTagFilter && <Label>Tags</Label>}
                    {renderTagFilter(true)}

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={clearAllFilters}
                        disabled={!hasActiveFilters}
                        className="w-full"
                    >
                        Clear all
                    </Button>
                </div>
            );
        }

        return (
            <>
                <Input
                    type="number"
                    min="0"
                    step="1000"
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                    placeholder="Min price"
                    className="w-40"
                />
                <Input
                    type="number"
                    min="0"
                    step="1000"
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    placeholder="Max price"
                    className="w-40"
                />

                <Select
                    value={availabilityFilter}
                    onValueChange={(value: AvailabilityFilter) => setAvailabilityFilter(value)}
                >
                    <SelectTrigger className="w-32">
                        <SelectValue placeholder="All status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All status</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                </Select>

                {supportsNewFilter && (
                    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                        <Checkbox checked={newOnly} onCheckedChange={(checked) => setNewOnly(checked === true)} />
                        <span className="text-sm">New</span>
                    </div>
                )}
                {supportsBestSellerFilter && (
                    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                        <Checkbox checked={bestSellerOnly} onCheckedChange={(checked) => setBestSellerOnly(checked === true)} />
                        <span className="text-sm">Best Seller</span>
                    </div>
                )}

                {renderTagFilter()}

                <Button
                    type="button"
                    variant="ghost"
                    onClick={clearAllFilters}
                    disabled={!hasActiveFilters}
                >
                    Clear all
                </Button>
            </>
        );
    };

    return (
        <div className="space-y-3 py-2">
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button type="button" variant="outline">
                            <FilterIcon className="h-4 w-4" />
                            Filters
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-md px-5">
                        <SheetHeader>
                            <SheetTitle>Filters</SheetTitle>
                        </SheetHeader>
                        <div className="mt-4 space-y-3">
                            {renderFilterControls(true)}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="hidden flex-wrap items-center gap-3 md:flex">
                {renderFilterControls(false)}
            </div>

            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                    {minPrice !== "" && (
                        <Badge variant="outline" className="gap-1">
                            Min: {Number(minPrice).toLocaleString("vi-VN")}
                            <button
                                type="button"
                                onClick={() => setMinPrice("")}
                                className="inline-flex"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {maxPrice !== "" && (
                        <Badge variant="outline" className="gap-1">
                            Max: {Number(maxPrice).toLocaleString("vi-VN")}
                            <button
                                type="button"
                                onClick={() => setMaxPrice("")}
                                className="inline-flex"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {availabilityFilter !== "all" && (
                        <Badge variant="outline" className="gap-1">
                            {availabilityFilter === "available" ? "Available" : "Unavailable"}
                            <button
                                type="button"
                                onClick={() => setAvailabilityFilter("all")}
                                className="inline-flex"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {supportsNewFilter && newOnly && (
                        <Badge variant="outline" className="gap-1">
                            New
                            <button
                                type="button"
                                onClick={() => setNewOnly(false)}
                                className="inline-flex"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {supportsBestSellerFilter && bestSellerOnly && (
                        <Badge variant="outline" className="gap-1">
                            Best Seller
                            <button
                                type="button"
                                onClick={() => setBestSellerOnly(false)}
                                className="inline-flex"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {supportsTagFilter && selectedTags.map((tag) => (
                        <Badge
                            key={tag.code}
                            variant="outline"
                            style={tag.color ? {
                                backgroundColor: tag.color,
                                borderColor: tag.color,
                                color: getReadableTextColor(tag.color)
                            } : undefined}
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
    );
};
