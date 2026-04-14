import Link from "next/link";
import { ArrowRight, BadgeCheck, DollarSignIcon, Package, ShoppingCart, TrendingUp, Users2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { currencyFormatter, formatDateTime, cn } from "@/lib/utils";

import { getDashboardAnalytics } from "@/actions/get-dashboard-analytics";
import { getDashboardStats } from "@/actions/get-dashboard-stats";
import { getOrderNeedProcessing } from "@/actions/get-orders-need-processing";

import { DashboardAnalytics } from "./components/dashboard-analytics";
import { STATUS_COLOR_MAP } from "@/lib/order-utils";

const metricCards = [
    { key: "totalRevenue", title: "Doanh thu", icon: DollarSignIcon },
    { key: "todayRevenue", title: "Doanh thu hôm nay", icon: TrendingUp },
    { key: "totalOrders", title: "Tổng đơn hàng", icon: ShoppingCart },
    { key: "totalCustomers", title: "Khách hàng", icon: Users2 },
    { key: "totalProducts", title: "Sản phẩm", icon: Package },
    { key: "completionRate", title: "Tỷ lệ hoàn tất", icon: BadgeCheck },
] as const;

const getMetricValue = (stats: Awaited<ReturnType<typeof getDashboardStats>>, key: string) => {
    switch (key) {
        case "totalRevenue":
            return currencyFormatter.format(stats.totalRevenue);
        case "todayRevenue":
            return currencyFormatter.format(stats.todayRevenue);
        case "totalOrders":
            return stats.totalOrders;
        case "totalCustomers":
            return stats.totalCustomers;
        case "totalProducts":
            return stats.totalProducts;
        case "completionRate":
            return `${stats.completionRate.toFixed(1)}%`;
        default:
            return "-";
    }
};

export default async function HomePage() {
    const [stats, analytics, recentOrders] = await Promise.all([
        getDashboardStats(),
        getDashboardAnalytics(),
        getOrderNeedProcessing(),
    ]);

    return (
        <div className="space-y-8 p-8 pt-6">
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {metricCards.map((metric) => {
                    const Icon = metric.icon;

                    return (
                        <Card key={metric.key} className="border-slate-200/70 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <div>
                                    <CardDescription>{metric.title}</CardDescription>
                                    <CardTitle className="text-xl">{getMetricValue(stats, metric.key)}</CardTitle>
                                </div>
                                <div className="rounded-full bg-yellow-50 p-3 text-yellow-500">
                                    <Icon className="size-5" />
                                </div>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                {metric.key === "totalRevenue" && `Tháng này: ${currencyFormatter.format(stats.monthRevenue)}`}
                                {metric.key === "totalOrders" && `${stats.paidOrders} đơn đã thanh toán`}
                                {metric.key === "totalProducts" && `${stats.newProducts} sản phẩm mới`}
                                {metric.key === "completionRate" && `${stats.completedOrders} đơn hoàn tất`}
                            </CardContent>
                        </Card>
                    );
                })}
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
                <Card className="border-slate-200/70 shadow-sm">
                    <CardHeader className="flex flex-row justify-between space-y-0 pb-3">
                        <div>
                            <CardTitle>Top sản phẩm theo doanh thu</CardTitle>
                            <CardDescription>Các món đang kéo doanh thu tốt nhất.</CardDescription>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/pizzas">
                                Xem sản phẩm
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-3">
                            {analytics.topProducts.map((product, index) => (
                                <div key={product.id} className="flex items-center justify-between gap-4 rounded-xl border bg-white px-3 py-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                                            <span className="truncate font-medium">{product.name}</span>
                                            {product.isBestSeller ? <Badge className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Best seller</Badge> : null}
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            {product.quantity} món đã bán &middot; {product.categoryLabel}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold">{currencyFormatter.format(product.revenue)}</div>
                                        <div className="text-xs text-muted-foreground">{product.isAvailable ? "Đang bán" : "Ẩn"}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/70 shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between">
                            <div>
                                <CardTitle>
                                    Đơn hàng đang xử lý
                                </CardTitle>
                                <CardDescription>Danh sách vừa phát sinh.</CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Button asChild variant="ghost" size="sm">
                                    <Link href="/orders">
                                        Xem đơn hàng
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Khách hàng</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Tổng</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="max-w-55">
                                            <div className="font-medium">{order.customerName}</div>
                                            <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {order.itemCount} món - {formatDateTime(order.createdAt)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(STATUS_COLOR_MAP[order.status].className)}>{STATUS_COLOR_MAP[order.status].label}</Badge>
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {order.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{currencyFormatter.format(order.totalAmount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </section>

            <DashboardAnalytics
                revenueByMonth={analytics.revenueByMonth}
                orderStatusBreakdown={analytics.orderStatusBreakdown}
                categoryBreakdown={analytics.categoryBreakdown}
            />
        </div>
    );
}
