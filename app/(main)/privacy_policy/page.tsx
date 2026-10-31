'use client'

import React, { useEffect } from 'react'
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import Footer from '@/components/footer/Footer';

export default function TermsPage() {

    const { setTheme } = useTheme();

    useEffect(() => {
        setTheme("dark");
    }, [setTheme]);

    const sections = [
        {
            title: "Privacy Policy for Justmateng Service Pvt. Ltd.",
            content: [
                "Effective Date: 04-11-2025",
                "At Justmateng Service Pvt. Ltd. ('we,' 'us,' or 'our'), your privacy is a priority. This Privacy Policy outlines how we collect, use, store, and protect your personal information when you use our hyperlocal delivery services, available through our website and mobile app.",
                "By using our services, you consent to the practices described in this Privacy Policy."
            ]
        },
        {
            title: "1. Information We Collect",
            content: [
                "We collect the following types of information to provide our services effectively:",
                "• Personal Information: When you create an account, place an order, or interact with our platform, we may collect your name, contact details (email and phone number), delivery address, and payment information.",
                "• Transactional Data: Information about the products you get and details of your delivery requests.",
                "• Usage Data: Information about how you interact with our website or app, including location data, browsing behavior, device information, and cookies."
            ]
        },
        {
            title: "2. How We Use Your Information",
            content: [
                "We use the information we collect to:",
                "• Provide and process your deliveries, including verifying and fulfilling your orders.",
                "• Improve our services, platform, and user experience.",
                "• Communicate with you, including providing customer support, delivery status updates, and marketing promotions (if you opt in).",
                "• Comply with legal and regulatory obligations."
            ]
        },
        {
            title: "3. How We Share Your Information",
            content: [
                "We do not sell, rent, or trade your personal information. However, we may share your data in the following cases:",
                "• Service Providers: We may share your information with trusted third-party vendors who help us deliver services, such as payment processors and delivery drivers.",
                "• Legal Requirements: We may disclose your information when required to do so by law or to protect our rights, safety, and the safety of others."
            ]
        },
        {
            title: "4. Data Security",
            content: [
                "We employ a variety of security measures, including encryption, firewalls, and secure servers, to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security."
            ]
        },
        {
            title: "5. Your Data Rights",
            content: [
                "You have the right to:",
                "• Access and update your personal information.",
                "• Request the deletion of your personal information (subject to legal restrictions).",
                "• Opt-out of receiving marketing communications at any time.",
                "To exercise these rights, please contact us at +918787649928."
            ]
        },
        {
            title: "Refund Policy for Hyperlocal Deliveries",
            content: [
                "Effective Date: 04-11-2025",
                "At Justmateng Service Pvt. Ltd., we strive to provide timely and reliable deliveries. However, there may be instances where a refund or adjustment is required. Below are the conditions under which we process refunds and returns."
            ]
        },
        {
            title: "1. Refund Eligibility",
            content: [
                "Refunds may be issued under the following conditions:",
                "• Incorrect Items Delivered: If the wrong product was delivered, we will arrange for a refund, subject to availability and conditions.",
                "• Failed Deliveries: If your order was not delivered within the expected timeframe and the delay was not due to circumstances beyond our control (e.g., weather, traffic), we will issue a refund or credit."
                
            ]
        },
        {
            title: "2. Insurance Coverage",
            content: [
                "We offer an optional insurance package for products in transit. If the insurance fee is paid at the time of purchase, your product will be covered for damage during delivery. If the insurance is not purchased, we are not liable for any damage or loss that occurs during delivery.",
                "• Insurance Fee: The insurance cost will be clearly stated at checkout. It covers accidental damage to the product during the delivery process.",
                "• No Insurance: If no insurance is purchased, Justmateng Service Pvt. Ltd. will not be responsible for damage or loss of the product during transit."
            ]
        },
        {
            title: "3. Non-Refundable Items and Conditions",
            content: [
                "The following conditions apply to refunds:",
                "• Change of Mind: We do not offer refunds for change of mind or incorrect orders unless the product is damaged or defective upon delivery.",
                "• Delivery Time Issues: While we will make every effort to deliver on time, we cannot guarantee specific delivery windows. Refunds due to minor delays will be considered on a case-by-case basis. No Refunds will be provided for Cargo Services",
                // "• Insurance Claims: If you have purchased insurance and the product is damaged, a claim will need to be filed within 15 days after delivery to qualify for a refund or replacement."
            ]
        },
        {
            title: "4. How to Request a Refund",
            content: [
                "To request a refund, please contact our customer support team at +918787649928 with the following details:",
                "• Order number",
                "• Description of the issue",
                "• Photos of damaged or incorrect items (if applicable)",
                "Refund requests will be processed within 3-5 business days."
            ]
        },
        {
            title: "5. Refund Processing",
            content: [
                "Refunds will be issued to the original payment method within 15 business days after approval."
            ]
        },
        {
            title: "6. Return Policy",
            content: [
                "All sales are final. We do not accept returns, exchanges, or cancellations under any circumstances."
            ]
        },
        {
            title: "7. Changes to the Refund Policy",
            content: [
                "We reserve the right to update or modify this Refund Policy at any time. Any changes will be posted on our website and will be effective immediately upon posting."
            ]
        },
        {
            title: "Questions?",
            content: [
                "If you have any questions or concerns about our Privacy or Refund Policy, please contact us at +918787649928."
            ]
        }
    ];

    return (
        <div className='relative'>
            <ScrollArea>
                <div className='w-[100vw] h-[100svh] relative'>
                    <div className='w-full h-16'></div>
                    <div className="w-full max-w-[1000px] mx-auto p-6 space-y-4 mb-10">
                        <h1 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-neutral-500">
                            Privacy & Refund Policy
                        </h1>
                        <Card className='bg-transparent border-0'>
                            <CardContent className='flex flex-col gap-4'>
                                {sections.map((section, index) => (
                                    <section key={index}>
                                        <CardTitle className="text-xl font-semibold">{section.title}</CardTitle>
                                        {section.content.map((text, i) => (
                                            <div key={i} className='flex flex-row gap-3 text-gray-300 mt-1 ml-5'>
                                                <p>•</p> <p>{text}</p>
                                            </div>
                                        ))}
                                        {index < sections.length - 1 && <Separator />}
                                    </section>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <Footer />
                </div>
            </ScrollArea>
        </div>
    );
}
