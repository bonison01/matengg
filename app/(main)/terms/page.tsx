'use client'

import React, { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes"
import Footer from '@/components/footer/Footer';

export default function TermsPage() {

    const { setTheme } = useTheme();

    useEffect(() => {
        setTheme("dark");
    }, []);

    return (
        <div className='relative'>
            <ScrollArea>
                <div className='w-[100vw] h-[100svh] relative'>
                    <div className='w-full h-16'></div>
                    <div className="w-full max-w-[1000px] mx-auto p-6 space-y-4 mb-10">
                        <h1 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-neutral-500">Terms of Use</h1>
                        <Card className='bg-transparent border-0'>
                            <CardContent className='flex flex-col gap-4'>
                                <section>
                                    <CardTitle className="text-xl font-semibold">1. Onboarding and Account Creation</CardTitle>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>Provide accurate, complete, and current information to create your account.</p>
                                    </div>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>Maintain the confidentiality of your account; notify us within 24 hours of any unauthorized use.</p>
                                    </div>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>You grant us a non-exclusive, royalty-free license to use your name, trademarks, and logos for display, marketing, and promotional purposes.</p>
                                    </div>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>We may monitor your use of the Services and compliance with these Terms.</p>
                                    </div>
                                </section>
                                <Separator />
                                <section>
                                    <CardTitle className="text-xl font-semibold">2. Service Use</CardTitle>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>The Seller or Vendor uses Mateng for delivery and reverse pickup (RTO) of packages.</p>
                                    </div>
                                </section>
                                <Separator />
                                <section>
                                    <CardTitle className="text-xl font-semibold">3. Non-Delivery and Returns</CardTitle>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>RTO charges are deducted for non-delivered packages.</p>
                                    </div>
                                </section>
                                <Separator />
                                <section>
                                    <CardTitle className="text-xl font-semibold">4. Package Information</CardTitle>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>Provide complete package information; delivery charges are calculated based on this information.</p>
                                    </div>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>Weight discrepancies are adjusted within 72 hours of package upload, resulting in refunds or deductions.</p>
                                    </div>
                                </section>
                                <Separator />
                                <section>
                                    <CardTitle className="text-xl font-semibold">5. Final Invoice</CardTitle>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>A final invoice is generated monthly, serving as the basis for all reconciliations and refunds.</p>
                                    </div>
                                </section>
                                <Separator />
                                <section>
                                    <CardTitle className="text-xl font-semibold">6. Charges and Taxes</CardTitle>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>Deductions include Delivery/Return Charges, COD Charges, Service Tax, and Fuel Surcharge. Entry Tax and OCTROI are manually deducted.</p>
                                    </div>
                                </section>
                                <Separator />
                                <section>
                                    <CardTitle className="text-xl font-semibold">7. Refunds and Cancellations</CardTitle>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>Lost Packages: Delivery/RTO Charges are refunded for lost packages.</p>
                                    </div>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>Service Termination: Remaining credits can be refunded upon service termination.</p>
                                    </div>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>Non-Delivery: COD Charges are refunded for non-delivery packages.</p>
                                    </div>
                                </section>
                                <Separator />
                                <section>
                                    <CardTitle className="text-xl font-semibold">8. Representations and Warranties; Indemnity</CardTitle>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>Comply with all applicable laws while using the Services.</p>
                                    </div>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>Do not use automated systems, reverse engineer, or tamper with the Services.</p>
                                    </div>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>Indemnify and hold Mateng harmless from any claims, damages, or expenses arising from your use of the Services, violation of these Terms, or infringement of third-party rights.</p>
                                    </div>
                                </section>
                                <Separator />
                                <section>
                                    <CardTitle className="text-xl font-semibold">9. Prohibited Activities</CardTitle>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>Do not use fraudulent means to access the Services or engage in disruptive or harmful behavior.</p>
                                    </div>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>Mateng reserves the right to take legal action for any violations of these Terms.</p>
                                    </div>
                                </section>
                                <Separator />
                                <section>
                                    <CardTitle className="text-xl font-semibold">10. Disclaimer</CardTitle>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>Services are provided (as is) without warranties of any kind.</p>
                                    </div>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>Mateng is not responsible for incorrect delivery information or non-delivery. Relevant charges apply with no refund.</p>
                                    </div>
                                </section>
                                <Separator />
                                <section>
                                    <CardTitle className="text-xl font-semibold">11. Miscellaneous</CardTitle>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>Mateng reserves the right to modify the Service and these Terms without notice.</p>
                                    </div>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>If any provision is deemed invalid, the remaining provisions will remain in effect.</p>
                                    </div>
                                    <div className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                        <p>•</p> <p>Mateng is not liable for performance failures due to force majeure events beyond its control.</p>
                                    </div>
                                </section>
                            </CardContent>
                        </Card>
                    </div>

                    <Footer />
                </div>
            </ScrollArea>
        </div>
    );
}
