"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ModalProps {
    classname?: string;
    title: string;
    description: string;
    isOpen: boolean;
    onClose: () => void;
    children?: React.ReactNode;
};

export const Modal: React.FC<ModalProps> = ({
    classname,
    title,
    description,
    isOpen,
    onClose,
    children
}) => {
    const onChange = (open: boolean) => {
        if (!open) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onChange}>
            <DialogContent className={classname}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="max-h-[calc(90vh-140px)] overflow-y-auto pr-1">
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    );
};