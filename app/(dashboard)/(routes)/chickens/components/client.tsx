"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { CatalogFilters, useCatalogFilters } from "@/components/filters/catalog-filters";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { ApiList } from "@/components/ui/api-list";
import { Column, columns } from "./columns";

interface ChickensClientProps {
    data: Column[]
}

const ChickensClient: React.FC<ChickensClientProps> = ({
    data
}) => {
    const router = useRouter();
    const {
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
    } = useCatalogFilters({
        data,
        getPrice: (chicken) => chicken.price,
        getIsAvailable: (chicken) => chicken.isAvailable,
        getIsNew: (chicken) => chicken.isNew,
        getIsBestSeller: (chicken) => chicken.isBestSeller
    });

    return (
        <div>
            <div className="flex items-center justify-between" >
                <Heading
                    title={`Chickens (${data.length})`}
                    description="Manage chickens for your store."
                />
                <Button onClick={() => router.push(`/chickens/new`)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New
                </Button>
            </div>

            <Separator className="my-2" />

            <CatalogFilters
                minPrice={minPrice}
                setMinPrice={setMinPrice}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                availabilityFilter={availabilityFilter}
                setAvailabilityFilter={setAvailabilityFilter}
                newOnly={newOnly}
                setNewOnly={setNewOnly}
                bestSellerOnly={bestSellerOnly}
                setBestSellerOnly={setBestSellerOnly}
                selectedTagCodes={selectedTagCodes}
                setSelectedTagCodes={setSelectedTagCodes}
                tagOptions={tagOptions}
                hasActiveFilters={hasActiveFilters}
                clearAllFilters={clearAllFilters}
                supportsNewFilter={supportsNewFilter}
                supportsBestSellerFilter={supportsBestSellerFilter}
                supportsTagFilter={supportsTagFilter}
            />

            <DataTable
                columns={columns}
                data={filteredData}
                searchKeys={["name"]}
                searchPlaceholder="Tìm kiếm theo tên món gà..."
                getRowClassName={(row) => row.isAvailable ? "" : "bg-red-50/80 dark:bg-red-950/20"}
            />
            <Heading
                title="API"
                description="API calls for chickens"
            />

            <Separator className="my-2" />

            <ApiList
                entityName="chickens"
                entityIdName="chickenId"
            />
        </div>
    );
};

export default ChickensClient;