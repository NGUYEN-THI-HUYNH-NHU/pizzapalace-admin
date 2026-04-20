"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleCheck, ClockFading, Loader2, Package, ShieldAlert, Sigma, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { io, type Socket } from "socket.io-client";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderModal } from "./modal";
import { getOrderColumns } from "./columns";
import { Order } from "@prisma/client";
import { getNextStatus } from "@/lib/order-utils";
import { DataTable } from "@/components/ui/data-table";

type OrdersResponse = {
    orders: Order[];
};

type RealtimeOrderPayload = {
    order?: Order;
};

const upsertOrder = (current: Order[], incomingOrder: Order) => {
    const existingIndex = current.findIndex((order) => order.id === incomingOrder.id);

    if (existingIndex === -1) {
        return [incomingOrder, ...current];
    }

    const next = [...current];
    next[existingIndex] = incomingOrder;
    return next;
};

export default function OrdersClient() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | Order["status"]>("all");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/orders", { cache: "no-store" });
            const payload = (await response.json().catch(() => null)) as OrdersResponse | null;

            if (!response.ok) {
                throw new Error(
                    payload && typeof payload === "object" && "message" in payload
                        ? String((payload as { message?: string }).message ?? "")
                        : `Failed to fetch orders: ${response.status}`
                );
            }

            setOrders(Array.isArray(payload?.orders) ? payload.orders : []);
            setError("");
        } catch (fetchError) {
            console.error("[ORDERS_CLIENT_LOAD]", fetchError);
            setError("Không thể tải danh sách đơn hàng.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    useEffect(() => {
        const realtimeUrl = process.env.NEXT_PUBLIC_REALTIME_URL;

        const socket: Socket = io(realtimeUrl, {
            transports: ["websocket"],
        });

        socket.on("connect", () => {
            socket.emit("join:admin");
        });

        socket.on("order:new", (payload: RealtimeOrderPayload) => {
            if (!payload?.order) {
                return;
            }

            setOrders((current) => upsertOrder(current, payload.order!));
        });

        socket.on("order:updated", (payload: RealtimeOrderPayload) => {
            if (!payload?.order) {
                return;
            }

            setOrders((current) => upsertOrder(current, payload.order!));
            setSelectedOrder((current) => (current?.id === payload.order!.id ? payload.order! : current));
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const filteredOrders = useMemo(
        () => orders.filter((order) => (statusFilter === "all" ? true : order.status === statusFilter)),
        [orders, statusFilter]
    );

    const summary = useMemo(
        () => ({
            total: orders.length,
            pending: orders.filter((order) => order.status === "PENDING").length,
            preparing: orders.filter((order) => order.status === "PREPARING").length,
            delivering: orders.filter((order) => order.status === "DELIVERING").length,
            completed: orders.filter((order) => order.status === "COMPLETED").length,
        }),
        [orders]
    );

    const updateStatus = async (orderId: string, status: Order["status"], isPaid?: boolean) => {
        try {
            setSaving(true);
            const response = await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status, ...(typeof isPaid === "boolean" ? { isPaid } : {}) }),
            });

            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(payload?.message || "Không thể cập nhật trạng thái đơn hàng.");
            }

            const updatedOrder = payload?.order as Order | undefined;
            if (updatedOrder) {
                setOrders((current) => current.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)));
                setSelectedOrder((current) => (current?.id === updatedOrder.id ? updatedOrder : current));
            } else {
                await loadOrders();
            }

            toast.success("Đã cập nhật đơn hàng.");
        } catch (updateError) {
            console.error("[ORDERS_CLIENT_UPDATE]", updateError);
            toast.error(updateError instanceof Error ? updateError.message : "Cập nhật thất bại.");
        } finally {
            setSaving(false);
        }
    };

    const handleCopyId = async (orderId: string) => {
        await navigator.clipboard.writeText(orderId);
        toast.success("Đã sao chép mã đơn.");
    };

    const handleAdvance = async (order: Order) => {
        const nextStatus = getNextStatus(order.status);
        if (!nextStatus) {
            return;
        }

        await updateStatus(order.id, nextStatus, order.isPaid || nextStatus === "COMPLETED");
    };

    const columns = getOrderColumns({
        onView: setSelectedOrder,
        onAdvance: handleAdvance,
        onCopyId: handleCopyId,
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Heading
                    title={`Orders (${summary.total})`}
                    description="Quản lý đơn đặt hàng cho cửa hàng của bạn."
                />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">Tổng đơn</CardTitle>
                        <Sigma className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{summary.total}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">Chờ xử lý</CardTitle>
                        <ClockFading className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{summary.pending}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">Đang làm/giao</CardTitle>
                        <div className="flex flex-row items-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            /
                            <Truck className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{summary.preparing + summary.delivering}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">Hoàn tất</CardTitle>
                        <CircleCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{summary.completed}</div></CardContent>
                </Card>
            </div>

            <Separator />

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                    <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>Tất cả</Button>
                    <Button variant={statusFilter === "PENDING" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("PENDING")}>Đang chờ</Button>
                    <Button variant={statusFilter === "PREPARING" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("PREPARING")}>Đang chuẩn bị</Button>
                    <Button variant={statusFilter === "DELIVERING" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("DELIVERING")}>Đang giao</Button>
                    <Button variant={statusFilter === "COMPLETED" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("COMPLETED")}>Hoàn tất</Button>
                </div>
            </div>

            {error ? (
                <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
                    <ShieldAlert className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            ) : null}

            {loading ? (
                <div className="flex min-h-55 items-center justify-center text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải đơn hàng...
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <DataTable
                        columns={columns}
                        data={filteredOrders}
                        searchKeys={["id", "customerName", "customerPhone", "customerAddress"]}
                        searchPlaceholder="Tìm theo mã đơn, tên, SĐT, địa chỉ"
                    />
                </div>
            )}

            <OrderModal
                order={selectedOrder}
                isOpen={Boolean(selectedOrder)}
                onClose={() => setSelectedOrder(null)}
                onSave={async (status) => {
                    if (!selectedOrder) {
                        return;
                    }

                    await updateStatus(selectedOrder.id, status, selectedOrder.isPaid || status === "COMPLETED");
                    setSelectedOrder(null);
                }}
                loading={saving}
            />
        </div>
    );
}