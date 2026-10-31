"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useEffect, useState } from "react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { Button } from "@/components/ui/button";
import { UserPen, MapPinned, PhoneCall, MailCheck } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { setUser } from "@/lib/cart/userSlice";
import { RootState } from "@/lib/cart/store";
import { Skeleton } from "@/components/ui/skeleton";
import OrderDetails from "@/components/orderDetails/OrderDetails";
import Footer from "@/components/footer/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceBooked from "@/components/orderDetails/ServiceBooked";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";


interface DeliveryOrder {
    id: number;
    pickup_name: string;
    pickup_phone: string;
    pickup_address: string;
    dropoff_name: string;
    dropoff_phone: string;
    dropoff_address: string;
    instructions: { pickup: string; dropoff: string };
    distance: number | null;
    charge: number | null;
    pickup_cord: string | null;
    dropoff_cord: string | null;
    status: string;
    customer_id: string;
    isBusiness: number | null;
    business_id: string | null;
    created_at: string;
    updated_at: string;
}


interface User {
    customer_id: string;
    name: string;
    email: string;
    address?: string;
    phone?: string;
    profile_pic?: string;
    whatsapp?: string;
    remarks?: string;
    order_record?: any;
    created_at?: string;
    updated_at?: string;
    dob?: string;
}

export default function ProfilePage() {
    const { setTheme } = useTheme();
    const user = useSelector((state: RootState) => state.user.user as User | null);
    const loading = useSelector((state: RootState) => state.user.loading);
    const dispatch = useDispatch();

    const [orders, setOrders] = useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [ordersError, setOrdersError] = useState<string | null>(null);

    const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
    const [deliveryOrdersLoading, setDeliveryOrdersLoading] = useState(true);
    const [deliveryOrdersError, setDeliveryOrdersError] = useState<string | null>(null);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        address: "",
        phone: "",
        whatsapp: "",
        dob: "",
    });

    useEffect(() => {
        setTheme("dark");

        const fetchOrders = async () => {
            const buyer_id = localStorage.getItem("customer_id");
            if (!buyer_id) {
                setOrdersError("No buyer ID found. Please log in.");
                setOrdersLoading(false);
                setDeliveryOrdersError("No buyer ID found. Please log in.");
                setDeliveryOrdersLoading(false);
                return;
            }

            // Fetch regular orders
            try {
                const response = await fetch(`/api/order/buyer/getOrderByBuyerId?buyer_id=${buyer_id}`);
                if (!response.ok) {
                    const result = await response.json(); 
                    console.log(result)
                    if (response.status === 404) {
                        throw result.message || "404";
                    }
                    throw new Error(result.message || "Failed to fetch orders");
                }
                const result = await response.json();
                if (result.success) {
                    const sortedOrders = result.data.sort(
                        (a: { order_at: string | null }, b: { order_at: string | null }) => {
                            const dateA = a.order_at ? new Date(a.order_at).getTime() : 0;
                            const dateB = b.order_at ? new Date(b.order_at).getTime() : 0;
                            return dateB - dateA;
                        }
                    );
                    setOrders(sortedOrders);
                } else {
                    setOrdersError(result.message || "No orders found");
                }
            } catch (err) {
                setOrdersError(err instanceof Error ? err.message : String(err));
            } finally {
                setOrdersLoading(false);
            }

            // Fetch delivery orders
            try {
                const deliveryResponse = await fetch(`/api/delivery-orders?customer_id=${buyer_id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!deliveryResponse.ok) {
                    const errorData = await deliveryResponse.json();
                    throw new Error(errorData.error || "Failed to fetch delivery orders");
                }

                const deliveryData: DeliveryOrder[] = await deliveryResponse.json();
                const sortedDeliveryOrders = deliveryData.sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                setDeliveryOrders(sortedDeliveryOrders);
                // console.log(sortedDeliveryOrders);
            } catch (err) {
                setDeliveryOrdersError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setDeliveryOrdersLoading(false);
            }
        };

        fetchOrders();
    }, []);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                email: user.email || "",
                address: user.address || "",
                phone: user.phone || "",
                whatsapp: user.whatsapp || "",
                dob: user.dob ? user.dob.split("T")[0] : "",
            });
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const customerId = localStorage.getItem("customer_id");
        console.log(formData);
        try {
          const response = await fetch(`/api/user/updateUserInfo?user_id=${customerId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to update profile");
          }
          const updatedUser = await response.json();
          dispatch(setUser(updatedUser.data));
          setIsDialogOpen(false);
          toast.success("Profile updated successfully!", {
            position: "top-right",
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "An error occurred";
          toast.error(errorMessage, {
            position: "top-right",
          });
        }
      };

    return (
        <div className="relative">
            <ScrollArea>
                <div className="w-[100vw] h-[100svh] relative">
                    <div className="w-full h-16 bg-gray-800"></div>

                    <div className="w-full max-w-[1100px] mx-auto p-4 px-10 relative">
                        {/* Banner */}
                        <div className="w-full h-44 sm:h-56 flex flex-col sm:flex-row relative rounded-2xl mt-4 sm:mt-6 mb-4">
                            <div className="absolute inset-0 h-full w-full scale-[0.40] transform rounded-full bg-gradient-to-r from-blue-500 to-teal-500 blur-3xl" />
                            <div className="relative flex w-full h-full flex-col items-start justify-end overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-xl">
                                <BackgroundGradientAnimation />
                            </div>

                            {/* Profile Picture */}
                            <div className="absolute -bottom-6 left-4 w-32 sm:w-40 h-32 sm:h-40 rounded-full p-1 bg-gradient-to-b from-gray-50 to-gray-200">
                                {loading ? (
                                    <Skeleton className="w-full h-full rounded-full" />
                                ) : (
                                    <img
                                        src={user?.profile_pic || "../profile.jpg"}
                                        alt="Profile"
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                )}
                            </div>

                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="absolute top-4 right-4 bg-gray-500/25 rounded-full border-gray-500/40 backdrop-blur-md"
                                    >
                                        <UserPen /> Edit Profile
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Edit Profile</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <Label htmlFor="name" className="mb-1">Name</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="email" className="mb-1">Email</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="Enter your email"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="address" className="mb-1">Address</Label>
                                            <Input
                                                id="address"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                placeholder="Enter your address"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="phone" className="mb-1">Phone</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="Enter your phone number"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="whatsapp" className="mb-1">WhatsApp</Label>
                                            <Input
                                                id="whatsapp"
                                                name="whatsapp"
                                                value={formData.whatsapp}
                                                onChange={handleInputChange}
                                                placeholder="Enter your WhatsApp number"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="dob" className="mb-1">Date of Birth</Label>
                                            <Input
                                                id="dob"
                                                name="dob"
                                                type="date"
                                                value={formData.dob}
                                                onChange={handleInputChange}
                                                placeholder="Select your date of birth"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            {/* <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                                Cancel
                                            </Button> */}
                                            <Button type="submit" className="text-white">Save</Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* User Info Section */}
                        <div className="px-2 mt-8">
                            {loading ? (
                                <Skeleton className="w-1/2 h-8 rounded-lg" />
                            ) : (
                                <CardTitle className="text-2xl font-semibold">
                                    {user?.name || "Guest User"}
                                </CardTitle>
                            )}
                            {loading ? (
                                <Skeleton className="w-1/3 h-5 mt-2 rounded-lg" />
                            ) : (
                                <CardDescription className="text-gray-400 text-sm flex flex-col sm:flex-row sm:gap-4">
                                    <span className="flex flex-row gap-1 items-center">
                                        <PhoneCall size={15} /> {user?.phone || "No Contact Number Available"}
                                    </span>
                                    <span className="hidden sm:flex"> | </span>
                                    <span className="flex flex-row gap-1 items-center">
                                        <MailCheck size={15} /> {user?.email || "No Email Available"}
                                    </span>
                                </CardDescription>
                            )}
                            {loading ? (
                                <Skeleton className="w-1/3 h-5 mt-2 rounded-lg" />
                            ) : (
                                <CardDescription className="text-gray-400 text-sm flex flex-row gap-1 items-center">
                                    <MapPinned size={15} /> {user?.address || "n/a"}
                                </CardDescription>
                            )}
                        </div>

                        <Separator className="mb-2 mt-6 bg-zinc-600" />

                        <div className="w-full max-w-[1100px] sm:px-2 mt-3 mx-auto gap-4 pb-10">
                            <Tabs defaultValue="order" className="w-full">
                                <TabsList className="bg-neutral-700/50 h-11">
                                    <TabsTrigger
                                        value="order"
                                        className="text-base px-6 dark:data-[state=active]:bg-black"
                                    >
                                        Order Details
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="service"
                                        className="text-base px-6 dark:data-[state=active]:bg-black"
                                    >
                                        Service Booked
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="order">
                                    <OrderDetails orders={orders} loading={ordersLoading} error={ordersError} />
                                </TabsContent>
                                <TabsContent value="service">
                                    <ServiceBooked
                                        orders={deliveryOrders}
                                        loading={deliveryOrdersLoading}
                                        error={deliveryOrdersError}
                                    />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                    <Footer />
                </div>
            </ScrollArea>
        </div>
    );
}