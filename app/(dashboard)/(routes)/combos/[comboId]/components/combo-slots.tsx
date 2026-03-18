"use client"

import { Plus, Trash, X } from "lucide-react";
import { Category, PizzaSize, PizzaTag, Product } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { createSlotProductColumns } from "./columns";
import { currencyFormatter } from "@/lib/utils";

export type SlotType = "PIZZA" | "DRINK";

export interface SlotState {
    id: string;
    name: string;
    type: SlotType;
    pizzaSizeCode: string;
    productIds: string[];
    tagCodes: string[];
}

type ProductTagValue = string | { code: string; name: string; color: string };

export type ProductForSlot = Omit<Product, "pizzaDetails" | "comboDetails" | "drinkDetails" | "tags"> & {
    tags: ProductTagValue[];
    pizzaDetails?: {
        variants?: {
            size: string;
            crust: string;
            price: number;
        }[];
    } | null;
    drinkDetails?: {
        volume?: string;
        brand?: string | null;
    } | null;
};

const normalizeProductTags = (tags: ProductTagValue[]) => {
    return tags
        .map((tag) => {
            if (typeof tag === "string") {
                return {
                    code: tag,
                    name: tag,
                    color: "#6b7280"
                };
            }

            return {
                code: tag.code,
                name: tag.name,
                color: tag.color
            };
        })
        .filter((tag) => tag.code);
};

interface ComboSlotsProps {
    slots: SlotState[];
    activeSlotId: string;
    loading: boolean;
    tags: PizzaTag[];
    tagsByCode: Record<string, PizzaTag>;
    pizzaSizes: PizzaSize[];
    pizzaSizesByCode: Record<string, PizzaSize>;
    productsById: Record<string, ProductForSlot>;
    defaultPizzaSizeCode: string;
    setActiveSlotId: (slotId: string) => void;
    addSlot: () => void;
    removeSlot: (slotId: string) => void;
    setProductSearch: (value: string) => void;
    setProductModalSlotId: (slotId: string) => void;
    updateSlot: (slotId: string, updater: (slot: SlotState) => SlotState) => void;
    addProductsByTag: (slotId: string, tagCode: string) => void;
    removeTagFromSlot: (slotId: string, tagCode: string) => void;
    removeProductFromSlot: (slotId: string, productId: string) => void;
    pruneTagCodesByProducts: (productIds: string[], tagCodes: string[]) => string[];
    isProductCompatibleWithSlot: (product: ProductForSlot, slot: SlotState) => boolean;
    getProductPriceRange: (product: ProductForSlot, sizeCode?: string) => { min: number; max: number };
}

const getSlotLabel = (name: string, index: number) => {
    const trimmed = name.trim();

    if (!trimmed) {
        return `Slot ${index + 1}`;
    }

    return trimmed.length > 20 ? `${trimmed.slice(0, 20)}...` : trimmed;
};

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

export const ComboSlots: React.FC<ComboSlotsProps> = ({
    slots,
    activeSlotId,
    loading,
    tags,
    tagsByCode,
    pizzaSizes,
    pizzaSizesByCode,
    productsById,
    defaultPizzaSizeCode,
    setActiveSlotId,
    addSlot,
    removeSlot,
    setProductSearch,
    setProductModalSlotId,
    updateSlot,
    addProductsByTag,
    removeTagFromSlot,
    removeProductFromSlot,
    pruneTagCodesByProducts,
    isProductCompatibleWithSlot,
    getProductPriceRange
}) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold">Combo slots</h3>
                    <p className="text-sm text-muted-foreground">Current slots: {slots.length}</p>
                </div>
                <Button type="button" variant="outline" onClick={addSlot}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add combo slot
                </Button>
            </div>

            {!slots.length && (
                <p className="text-sm text-muted-foreground">No slot yet. Click Add combo slot to create one.</p>
            )}

            <div className="space-y-4">
                {!!slots.length && (
                    <Tabs value={activeSlotId} onValueChange={setActiveSlotId}>
                        <TabsList className="w-full justify-start overflow-x-auto">
                            {slots.map((slot, slotIndex) => (
                                <TabsTrigger key={slot.id} value={slot.id} className="shrink-0">
                                    {getSlotLabel(slot.name, slotIndex)}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {slots.map((slot) => {
                            const selectedProducts = slot.productIds
                                .map((productId) => productsById[productId])
                                .filter((product): product is ProductForSlot => Boolean(product))
                                .filter((product) => isProductCompatibleWithSlot(product, slot));

                            const slotMinPrice = selectedProducts.length
                                ? Math.min(...selectedProducts.map((product) => getProductPriceRange(product, slot.type === "PIZZA" ? slot.pizzaSizeCode : undefined).min))
                                : 0;
                            const slotMaxPrice = selectedProducts.length
                                ? Math.max(...selectedProducts.map((product) => getProductPriceRange(product, slot.type === "PIZZA" ? slot.pizzaSizeCode : undefined).max))
                                : 0;

                            const slotTableData = selectedProducts.map((product) => {
                                const range = getProductPriceRange(product, slot.type === "PIZZA" ? slot.pizzaSizeCode : undefined);
                                const productTags = normalizeProductTags(product.tags ?? []);
                                const selectedPizzaSizeName = pizzaSizesByCode[slot.pizzaSizeCode]?.name ?? slot.pizzaSizeCode;
                                const selectedSizeVariantCount = (product.pizzaDetails?.variants ?? []).filter((variant) => variant.size === slot.pizzaSizeCode).length;

                                return {
                                    id: product.id,
                                    img: product.img,
                                    name: product.name,
                                    slug: product.slug,
                                    info: product.category === Category.PIZZA
                                        ? `${selectedSizeVariantCount} variants (${selectedPizzaSizeName || "No size"})`
                                        : `${product.drinkDetails?.volume ?? "No volume"} - ${product.drinkDetails?.brand ?? "No brand"}`,
                                    priceRange: product.category === Category.PIZZA
                                        ? `${currencyFormatter.format(range.min)} - ${currencyFormatter.format(range.max)}`
                                        : `${currencyFormatter.format(range.min)}`,
                                    tags: productTags,
                                    isNew: product.isNew,
                                    isBestSeller: product.isBestSeller
                                };
                            });

                            return (
                                <TabsContent key={slot.id} value={slot.id} className="mt-4">
                                    <div className="rounded-md border p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold">{slot.name}</h4>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeSlot(slot.id)}
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="space-y-3">
                                            <h5 className="font-medium">Slot info</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <FormLabel>Slot name</FormLabel>
                                                    <Input
                                                        value={slot.name}
                                                        onChange={(event) => {
                                                            const nextName = event.target.value;
                                                            updateSlot(slot.id, (current) => ({ ...current, name: nextName }));
                                                        }}
                                                        placeholder="01 Pizza ..."
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <FormLabel>Item type</FormLabel>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button type="button" variant="outline" className="w-full justify-between">
                                                                {slot.type}
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="w-52">
                                                            {["PIZZA", "DRINK"].map((typeOption) => (
                                                                <DropdownMenuCheckboxItem
                                                                    key={typeOption}
                                                                    checked={slot.type === typeOption}
                                                                    onSelect={(event) => event.preventDefault()}
                                                                    onCheckedChange={() => {
                                                                        updateSlot(slot.id, (current) => ({
                                                                            ...current,
                                                                            type: typeOption as SlotType,
                                                                            pizzaSizeCode: typeOption === "PIZZA" ? defaultPizzaSizeCode : "",
                                                                            productIds: [],
                                                                            tagCodes: []
                                                                        }));
                                                                    }}
                                                                >
                                                                    {typeOption}
                                                                </DropdownMenuCheckboxItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                {slot.type === "PIZZA" && (
                                                    <div className="space-y-2">
                                                        <FormLabel>Pizza Size</FormLabel>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button type="button" variant="outline" className="w-full justify-between">
                                                                    {pizzaSizesByCode[slot.pizzaSizeCode]?.name ?? "Select pizza size"}
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent className="w-52">
                                                                {pizzaSizes.map((sizeOption) => (
                                                                    <DropdownMenuCheckboxItem
                                                                        key={sizeOption.id}
                                                                        checked={slot.pizzaSizeCode === sizeOption.code}
                                                                        onSelect={(event) => event.preventDefault()}
                                                                        onCheckedChange={() => {
                                                                            updateSlot(slot.id, (current) => {
                                                                                const nextProductIds = current.productIds.filter((productId) => {
                                                                                    const product = productsById[productId];

                                                                                    if (!product) {
                                                                                        return false;
                                                                                    }

                                                                                    return isProductCompatibleWithSlot(product, {
                                                                                        ...current,
                                                                                        pizzaSizeCode: sizeOption.code
                                                                                    });
                                                                                });

                                                                                return {
                                                                                    ...current,
                                                                                    pizzaSizeCode: sizeOption.code,
                                                                                    productIds: nextProductIds,
                                                                                    tagCodes: pruneTagCodesByProducts(nextProductIds, current.tagCodes)
                                                                                };
                                                                            });
                                                                        }}
                                                                    >
                                                                        {sizeOption.name}
                                                                    </DropdownMenuCheckboxItem>
                                                                ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h5 className="font-medium">Slot toolbar</h5>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setProductSearch("");
                                                        setProductModalSlotId(slot.id);
                                                    }}
                                                >
                                                    Add product
                                                </Button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button type="button" variant="outline">
                                                            Add by tags
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-64">
                                                        {tags.map((tag) => (
                                                            <DropdownMenuCheckboxItem
                                                                key={tag.id}
                                                                checked={slot.tagCodes.includes(tag.code)}
                                                                onSelect={(event) => event.preventDefault()}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked === true) {
                                                                        addProductsByTag(slot.id, tag.code);
                                                                        return;
                                                                    }

                                                                    removeTagFromSlot(slot.id, tag.code);
                                                                }}
                                                            >
                                                                {tag.name}
                                                            </DropdownMenuCheckboxItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {!!slot.tagCodes.length && (
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {slot.tagCodes.map((code) => {
                                                        const tag = tagsByCode[code];

                                                        if (!tag) {
                                                            return null;
                                                        }

                                                        return (
                                                            <Badge
                                                                key={tag.code}
                                                                variant="outline"
                                                                style={{
                                                                    backgroundColor: tag.color,
                                                                    borderColor: tag.color,
                                                                    color: getReadableTextColor(tag.color)
                                                                }}
                                                            >
                                                                {tag.name}
                                                                <button
                                                                    type="button"
                                                                    className="inline-flex"
                                                                    onClick={() => removeTagFromSlot(slot.id, tag.code)}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <h5 className="font-medium">Slot products</h5>
                                            <DataTable
                                                columns={createSlotProductColumns({
                                                    disabled: loading,
                                                    onRemove: (productId) => removeProductFromSlot(slot.id, productId)
                                                })}
                                                data={slotTableData}
                                                searchKey="name"
                                            />

                                            <p className="text-sm text-muted-foreground">
                                                Slot description: {selectedProducts.length} product(s), from {currencyFormatter.format(slotMinPrice)} to {currencyFormatter.format(slotMaxPrice)}.
                                            </p>
                                        </div>
                                    </div>
                                </TabsContent>
                            );
                        })}
                    </Tabs>
                )}
            </div>
        </div>
    );
};
