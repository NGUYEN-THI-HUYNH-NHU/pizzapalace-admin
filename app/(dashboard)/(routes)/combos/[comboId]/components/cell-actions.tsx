"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CellActionProps {
    productId: string;
    onRemove: (productId: string) => void;
    disabled?: boolean;
}

export const CellAction: React.FC<CellActionProps> = ({
    productId,
    onRemove,
    disabled
}) => {
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={() => onRemove(productId)}
        >
            <X className="h-4 w-4" />
        </Button>
    );
};
