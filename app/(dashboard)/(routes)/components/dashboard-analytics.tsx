"use client";

import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { currencyFormatter } from "@/lib/utils";

import type { BreakdownItem, RevenueByMonthItem } from "@/actions/get-dashboard-analytics";

interface DashboardAnalyticsProps {
    revenueByMonth: RevenueByMonthItem[];
    orderStatusBreakdown: BreakdownItem[];
    categoryBreakdown: BreakdownItem[];
}

const chartColors = ["#ecc94b", "#ef4444", "#14b8a6", "#8b5cf6", "#0f172a", "#f59e0b"];

const RevenueTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) => {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="rounded-lg border bg-background/95 px-3 py-2 text-sm shadow-md backdrop-blur">
            <div className="font-medium text-foreground">{label}</div>
            <div className="text-muted-foreground">{currencyFormatter.format(payload[0].value ?? 0)}</div>
        </div>
    );
};

export const DashboardAnalytics = ({
    revenueByMonth,
    orderStatusBreakdown,
    categoryBreakdown,
}: DashboardAnalyticsProps) => {
    return (
        <Card className="border-slate-200/70 shadow-sm">
            <CardHeader className="space-y-3 border-b bg-slate-50/70">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <CardTitle className="text-xl">Phân tích & biểu đồ</CardTitle>
                        <CardDescription>Biểu đồ doanh thu, trạng thái đơn hàng và cơ cấu danh mục.</CardDescription>
                    </div>
                    <Badge variant="outline" className="rounded-full border-yellow-200 bg-yellow-50 text-yellow-700">
                        12 tháng gần nhất
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <Tabs defaultValue="revenue" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 md:w-105">
                        <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
                        <TabsTrigger value="status">Trạng thái</TabsTrigger>
                        <TabsTrigger value="category">Danh mục</TabsTrigger>
                    </TabsList>

                    <TabsContent value="revenue" className="mt-6">
                        <div className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
                            <Card className="border-slate-200/70 shadow-none">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Doanh thu theo tháng</CardTitle>
                                    <CardDescription>Giá trị đơn đã thanh toán trong 12 tháng gần nhất.</CardDescription>
                                </CardHeader>
                                <CardContent className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueByMonth} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ecc94b" stopOpacity={0.35} />
                                                    <stop offset="95%" stopColor="#ecc94b" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                            <YAxis axisLine={false} tickLine={false} width={60} tickFormatter={(value) => `${Number(value) / 1000000}tr`} />
                                            <Tooltip content={<RevenueTooltip />} />
                                            <Area type="monotone" dataKey="total" stroke="#ecc94b" fill="url(#revenueGradient)" strokeWidth={3} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200/70 shadow-none">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Điểm nhấn</CardTitle>
                                    <CardDescription>Chỉ số nhanh hỗ trợ theo dõi vận hành.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                        <span className="text-muted-foreground">Tổng doanh thu 12 tháng</span>
                                        <span className="font-semibold">{currencyFormatter.format(revenueByMonth.reduce((sum, item) => sum + item.total, 0))}</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                        <span className="text-muted-foreground">Trung bình mỗi tháng</span>
                                        <span className="font-semibold">{currencyFormatter.format(revenueByMonth.reduce((sum, item) => sum + item.total, 0) / revenueByMonth.length || 0)}</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                        <span className="text-muted-foreground">Danh mục đang bán</span>
                                        <span className="font-semibold">{categoryBreakdown.filter((item) => item.total > 0).length}</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                        <span className="text-muted-foreground">Trạng thái đơn</span>
                                        <span className="font-semibold">{orderStatusBreakdown.reduce((sum, item) => sum + item.total, 0)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="status" className="mt-6">
                        <Card className="border-slate-200/70 shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Trạng thái đơn hàng</CardTitle>
                                <CardDescription>Số lượng đơn theo từng giai đoạn xử lý.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-85">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={orderStatusBreakdown} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip />
                                        <Bar dataKey="total" radius={[12, 12, 0, 0]}>
                                            {orderStatusBreakdown.map((entry, index) => (
                                                <Cell key={`${entry.name}-${index}`} fill={chartColors[index % chartColors.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="category" className="mt-6">
                        <Card className="border-slate-200/70 shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Danh mục sản phẩm</CardTitle>
                                <CardDescription>Phân bổ danh mục hiện có trong catalogue.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                                <div className="h-75">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Tooltip />
                                            <Pie
                                                data={categoryBreakdown}
                                                dataKey="total"
                                                nameKey="name"
                                                innerRadius={72}
                                                outerRadius={110}
                                                paddingAngle={3}
                                            >
                                                {categoryBreakdown.map((entry, index) => (
                                                    <Cell key={`${entry.name}-${index}`} fill={chartColors[index % chartColors.length]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="space-y-3">
                                    {categoryBreakdown.map((item, index) => (
                                        <div key={item.name} className="flex items-center justify-between rounded-xl border bg-white px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                                                <span className="font-medium">{item.name}</span>
                                            </div>
                                            <span className="text-sm text-muted-foreground">{item.total} sản phẩm</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};