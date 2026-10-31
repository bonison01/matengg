'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import React, { useEffect, useState } from 'react';
import { CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Search } from 'lucide-react';
import StoreCard from '../../../components/store/storeCard';
import './page.css';
import { Store } from '@/utils/types/store';
import { Skeleton } from '@/components/ui/skeleton';
import WordFlipLoader from '@/components/loader/wordFlipLoader';
import ProductBanner from '@/components/bannerCard/productBanner';
import { useTheme } from "next-themes";
import Footer from '@/components/footer/Footer';

export default function DiscoverClient({
    initialStores = [],
}: {
    /**
     * Storefronts fetched on the server, so the directory is in the initial
     * HTML instead of appearing only after a client-side /api/stores call.
     */
    initialStores?: Store[];
}) {
    const [stores, setStores] = useState<Store[]>(initialStores);
    const [filteredStores, setFilteredStores] = useState<Store[]>(initialStores);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(initialStores.length === 0);
    const [error, setError] = useState<string>('');
    const [cardsPerRow, setCardsPerRow] = useState(1);

    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

    const { setTheme } = useTheme();

    useEffect(() => {
        setTheme("light");
    }, []);

    const cardWidth = 340;
    const gap = 16;

    // Fetch stores on load. Skipped when the server already supplied them —
    // the list is identical, so re-fetching would only cost a round trip.
    useEffect(() => {
        if (initialStores.length > 0) return;
        const fetchStores = async () => {
            try {
                const res = await fetch('/api/stores');
                const data = await res.json();
                if (data.success) {
                    setStores(data.data);
                    setFilteredStores(data.data);
                } else {
                    setError('Failed to fetch stores.');
                }
            } catch (err) {
                setError('An error occurred while fetching stores.');
            } finally {
                setLoading(false);
            }
        };

        fetchStores();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Calculate cards per row on resize
    useEffect(() => {
        const updateCardsPerRow = () => {
            const containerWidth = window.innerWidth * 0.9;
            const perRow = Math.floor((containerWidth + gap) / (cardWidth + gap));
            setCardsPerRow(perRow > 0 ? perRow : 1);
        };

        updateCardsPerRow();
        window.addEventListener('resize', updateCardsPerRow);
        return () => window.removeEventListener('resize', updateCardsPerRow);
    }, []);

    // Filter stores based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredStores(stores);
        } else {
            const filtered = stores.filter((store) =>
                store.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredStores(filtered);
        }
    }, [searchTerm, stores]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const lastRowCount = filteredStores.length % cardsPerRow;
    const placeholdersNeeded = lastRowCount === 0 ? 0 : cardsPerRow - lastRowCount;

    const categories = [
        "Grocery",
        "Instant Foods",
        "Snacks",
        "Soft Drinks And Juices",
        "Books",
        "Electronics",
        "Personal Hygiene And Health",
        "Books & Stationary",
        "Fashion",
        "Service",
        "Others",
      ];

    return (
        <div className='bg-[#efeee7] relative'>
            <ScrollArea>
                <div className='w-[100vw] h-[100svh] relative'>
                    <div className='w-full h-16 bg-stone-600'></div>

                    <div className='w-full max-w-[1400px] mx-auto p-4 relative'>
                        {/* Banner */}
                        <div className='w-full flex flex-col sm:flex-row relative rounded-2xl mt-6 mb-4'
                            style={{ background: "linear-gradient(323deg, rgba(34,51,29,1) 0%, rgba(71,93,65,1) 100%)" }}>
                            <div className='w-full sm:w-2/5 md:w-1/2 lg:w-3/5 flex flex-col gap-3 justify-center p-6 sm:p-0 mb-10 sm:ml-10 xl:ml-[4.5rem] z-10'>
                                <div className='flex flex-col text-2xl md:text-4xl leading-none font-bold text-[#fefce8]'>
                                    <span>Welcome to</span>
                                    <span>Mateng Discovery</span>
                                </div>
                                <div className='w-full xl:w-1/2 leading-none text-xs sm:text-sm text-gray-200/90'>
                                    <span>Explore businesses nearby you.</span>
                                </div>
                            </div>

                            <div className='w-full sm:w-3/5 md:w-1/2 lg:w-2/5 flex justify-center sm:justify-start items-end z-10'>
                                <ProductBanner />
                            </div>

                            <div className='w-full h-14 absolute bottom-[58%] sm:bottom-0 sm:rounded-2xl flex items-center gap-3 overflow-hidden'>
                                <div className="loop-slider" style={{ "--duration": "35951ms", "--direction": "normal" } as React.CSSProperties}>
                                    <div className="inner flex gap-3">
                                        {categories.concat(categories).map((category, index) => (
                                            <div key={index} className="tag py-1 px-6 rounded-full whitespace-nowrap text-gray-200/70">
                                                <span>#</span> {category}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="fade"></div>
                                </div>

                            </div>
                        </div>



                        {/* Explore Sellers */}
                        <div className='w-full max-w-[1400px] mx-auto gap-4 mt-3 pb-10'>
                            <div className='w-full bg-stone-600/0 backdrop-blur-lg sticky top-[4.2rem] z-10 px-4 pt-1 mb-4'>
                                <div className='flex flex-row justify-between items-center'>
                                    <CardTitle className='text-xl sm:text-2xl w-1/2'>Explore Sellers</CardTitle>
                                    {/* <div className='flex items-end gap-3'>
                                        <div className="flex items-center w-64 h-[2.1rem] bg-white rounded-full shadow-sm px-4 space-x-2 border border-gray-200">
                                            <input
                                                type="text"
                                                className="flex-1 h-full text-sm outline-none bg-transparent placeholder-gray-500"
                                                placeholder="Search businesses..."
                                                value={searchTerm}
                                                onChange={handleSearchChange}
                                            />
                                            <div className="h-5 w-px bg-gray-300"></div>
                                            <Search size={16} className="text-gray-500" />
                                        </div>
                                    </div> */}

                                    <div className="relative">
                                        {/* Mobile View */}
                                        <div className="block z-20 sm:hidden h-[2.1rem] flex items-center bg-white rounded-full shadow-sm px-2 sm:px-4 border border-gray-200 transition-all duration-300 ease-in-out absolute right-0 -top-4.5"
                                            style={{ width: mobileSearchOpen ? '16rem' : '2.4rem' }}
                                        >
                                            {mobileSearchOpen && (
                                                <input
                                                    type="text"
                                                    className="flex-1 w-4/5 h-full text-[16px] outline-none bg-transparent placeholder-gray-500 pl-3 "
                                                    placeholder="Search product..."
                                                    value={searchTerm}
                                                    onChange={handleSearchChange}
                                                    autoFocus
                                                />

                                            )}
                                            <div className={`${mobileSearchOpen ? 'h-5 w-px bg-gray-300 mx-2' : ''}`}></div>
                                            <Search
                                                size={20}
                                                className="text-gray-500 cursor-pointer"
                                                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                                            />
                                        </div>


                                        {/* Desktop View */}
                                        <div className="hidden sm:flex items-center w-64 h-[2.1rem] bg-white rounded-full shadow-sm px-4 space-x-2 border border-gray-200">
                                            <input
                                                type="text"
                                                className="flex-1 h-full text-sm outline-none bg-transparent placeholder-gray-500"
                                                placeholder="Search product..."
                                                value={searchTerm}
                                                onChange={handleSearchChange}
                                            />
                                            <div className="h-5 w-px bg-gray-300"></div>
                                            <Search size={16} className="text-gray-500" />
                                        </div>
                                    </div>
                                </div>
                                <Separator className='bg-[#33323353] mt-1 p-[1px]' />
                            </div>

                            {/* Store Cards */}
                            <div className="flex justify-center">
                                <div className="inline-flex flex-wrap justify-center max-w-[1400px] gap-2 sm:gap-6 md:gap-2 w-full">
                                    {loading && (
                                        <div className="w-full">
                                            {/* <div className="mb-4 text-gray-600 text-lg text-center">Loading stores...</div> */}
                                            <div className='flex justify-center mb-4'>
                                                <WordFlipLoader />
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <Skeleton className="h-56 w-full" />
                                                <Skeleton className="h-56 w-full" />
                                                <Skeleton className="h-56 w-full" />
                                                <Skeleton className="h-56 w-full" />
                                            </div>
                                        </div>
                                    )}

                                    {error && <p className="text-red-600">{error}</p>}

                                    {!loading && !error && filteredStores.map((store) => (
                                        <StoreCard key={store.user_id} store={store} />
                                    ))}

                                    {Array.from({ length: placeholdersNeeded }).map((_, index) => (
                                        <div key={`placeholder-${index}`} className="w-[300px] h-[375px] m-4 sm:m-8 md:m-10 opacity-0 shadow-none pointer-events-none" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <Footer />
                </div>
            </ScrollArea>

        </div>
    );
}
