'use client'

import React, { useState, useEffect } from 'react';
import Rating from '@/components/rating/rating';
import { useRouter } from 'next/navigation';
import Image from 'next/image'
import "./storeCard.css"

interface StoreCardProps {
    store: {
        user_id: string;
        business_name: string;
        business_type: string;
        product_service: string;
        business_experience: string;
        photo?: string;
        categories: string[];
        rating: number;
        whatsapp: string;
    };
}


export default function StoreCard({ store }: StoreCardProps) {

    const router = useRouter();
    const [starSize, setStarSize] = useState(20);

    useEffect(() => {
        const updateSize = () => {
            setStarSize(window.innerWidth < 540 ? 16 : 20);
        };

        updateSize();
        window.addEventListener("resize", updateSize);

        return () => window.removeEventListener("resize", updateSize);
    }, []);

    const handleNavigate = () => {
        router.push(`/discover/${store.user_id}`);
    };



    return (
        <div className='mb-8 sm:mb-0 p-4 sm:p-8 md:p-10 poppins'>
            <div className="store-card w-[256px] h-[380px]  lg:w-[320px] lg:h-[470px]">
                <div className="content">
                    <Image
                        width={600}
                        height={600}
                        src={store.photo || "/store.jpg"}
                        alt={store.business_name}
                        className='object-cover rounded-lg h-[70%] w-full'
                        onError={(e) => { e.currentTarget.src = "/store.jpg"; }}
                        onClick={handleNavigate}
                        loading='lazy'
                    />
                    <div className="w-full flex flex-col items-center mt-3 gap-1">
                        <span className="title text-black text-lg lg:text-xl font-semibold b-0 text-center leading-none capitalize">
                            {store.business_name ? store.business_name : "Not Available"}
                        </span>
                        <span
                            className="h-6 text-[#00000066] text-xs lg:text-sm font-semibold flex items-center justify-center text-center max-w-[90%] leading-none capitalize"
                        >
                            {store.business_type ? store.business_type : "Not Available"}
                        </span>

                        {/* <span className="text-[#00000066]">
                            {store.product_service}
                        </span> */}

                        <div className='w-full h-12 flex justify-between items-center p-2 pt-1'>
                            <div className='flex flex-col leading-none'>
                                <span className='text-sm font-medium text-[#9D9898CC] pl-1 translate-y-0.5 hover:text-[#9D9898]'>Rating</span>
                                <Rating rating={store.rating} editable={false} size={starSize} />
                            </div>
                            <div className='relative'>
                                <button
                                    type="submit"
                                    className="flex justify-center gap-2 items-center mx-auto shadow-md text-sm text-gray-800 bg-gray-200 backdrop-blur-md lg:font-medium isolation-auto border-gray-50 before:absolute before:w-full before:transition-all before:duration-500 hover:before:w-full before:right-full hover:before:right-0 before:rounded-full before:bg-emerald-400 hover:text-gray-50 before:-z-10 before:aspect-square hover:before:scale-150 hover:before:duration-500 relative z-10 px-3.5 py-1.5 overflow-hidden border-2 rounded-full group"
                                    onClick={handleNavigate}
                                >
                                    Details
                                    <svg
                                        className="w-5 h-5 justify-end group-hover:rotate-90 group-hover:bg-gray-50 text-gray-50 ease-linear duration-300 rounded-full border border-gray-700 group-hover:border-none p-1 rotate-45"
                                        viewBox="0 0 16 19"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M7 18C7 18.5523 7.44772 19 8 19C8.55228 19 9 18.5523 9 18H7ZM8.70711 0.292893C8.31658 -0.0976311 7.68342 -0.0976311 7.29289 0.292893L0.928932 6.65685C0.538408 7.04738 0.538408 7.68054 0.928932 8.07107C1.31946 8.46159 1.95262 8.46159 2.34315 8.07107L8 2.41421L13.6569 8.07107C14.0474 8.46159 14.6805 8.46159 15.0711 8.07107C15.4616 7.68054 15.4616 7.04738 15.0711 6.65685L8.70711 0.292893ZM9 18L9 1H7L7 18H9Z"
                                            className="fill-gray-800 group-hover:fill-gray-800"
                                        ></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

