'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Mail, CircleUserRound, MapPin } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Rating from '@/components/rating/rating';
import { StoreDetails } from '@/utils/types/storeDetails';
import { Skeleton } from '@/components/ui/skeleton';
import { Product } from '@/utils/types/product';
import Loader from '@/components/loader/loader';
import ProductCard from '@/components/product/productCard';
import { Separator } from '@/components/ui/separator';
import { Search, SlidersHorizontal } from 'lucide-react'
import Image from 'next/image'
import { toast } from "sonner";
import { Label } from '@/components/ui/label';
import { useTheme } from "next-themes";
import Footer from '@/components/footer/Footer';

export default function Page() {
  const { store } = useParams<{ store: string }>();
  const [storeDetails, setStoreDetails] = useState<StoreDetails | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { setTheme } = useTheme();

  // Fetch store details
  useEffect(() => {

    setTheme("light");

    if (store) {
      fetchStoreDetails(store, setStoreDetails);
      fetchProducts();
    }
  }, [store]);


  const fetchStoreDetails = async (store: string, setStoreDetails: React.Dispatch<React.SetStateAction<StoreDetails | null>>) => {
    try {
      const res = await axios.get<{ success: boolean; data: StoreDetails }>(`/api/stores/id?id=${store}`);
      setStoreDetails(res.data.data);
    } catch (error) {
      console.error('Failed to fetch store details:', error);
    }
  };

  const fetchProducts = async () => {
    setProductLoading(true)
    try {
      const response = await fetch(`/api/stores/storeProduct?id=${store}`)
      const result = await response.json()
      // console.log(result)

      if (result.success && result.data) {
        const productsArray = Object.values(result.data)
          .flat()
          .map((product) => ({
            ...(product as Product),
            category: (product as Product).category || "Uncategorized",
          })) as Product[]
        setProducts(productsArray)
        // setFilteredProducts(productsArray)
        // console.log(productsArray)
      }

    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setProductLoading(false)
    }
  }

  const handleSearch = (query: string) => setSearchQuery(query)

  const applyFilters = () => {
    let tempProducts = [...products]

    if (searchQuery) tempProducts = tempProducts.filter(product => product.name.toLowerCase().includes(searchQuery.toLowerCase()))

    setFilteredProducts(tempProducts)
  }

  useEffect(() => {
    applyFilters()
  }, [searchQuery, products])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const user_id = localStorage.getItem('customer_id');
    const business_user_id = storeDetails?.user_id;

    if (!user_id) {
      toast.warning('Please log in to give feedback.');
      return;
    }

    if (!business_user_id) {
      toast.error('Server error!.');
      return;
    }

    if (!rating) {
      toast.warning('Please provide a rating.');
      return;
    }

    const feedbackData = {
      business_user_id,
      user_id,
      comment: comment.trim() || null,
      rating,
    };

    // console.log('Submitting Feedback:', feedbackData);

    try {
      const res = await axios.post('/api/rating/store', feedbackData);

      if (res.data.success) {
        toast.success('Thank you for your feedback! 🎉');
        setRating(0);
        setComment('');
      } else {
        toast.error(res.data.message || 'Failed to submit feedback. Please try again.');
      }
    } catch (error: any) {
      console.error('Error submitting feedback:', error);

      if (error.response?.status === 409) {
        toast.warning('You have already submitted feedback for this store.');
        setRating(0);
        setComment('');
      } else {
        toast.error('Something went wrong while submitting your feedback.');
      }
    }
  };


  if (!storeDetails) {
    return (
      <div className="flex flex-col justify-center items-start h-screen bg-white relative">
        <div className="w-full relative">
          <Skeleton className="w-[100vw] h-64 flex items-center justify-center" />
          <div className="w-full absolute -bottom-24 flex justify-center">
            <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center shadow-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-gray-200">
              <Skeleton className="w-44 h-44 rounded-full object-cover" />
            </div>
          </div>
        </div>
        <div className="w-full max-w-[1400px] mx-auto mt-[7rem] mb-5 p-4 relative">
          <div className='my-3 text-center'>Loading...</div>
          <div className="flex justify-center gap-10">
            <Skeleton className="w-1/3 h-56" />
            <Skeleton className="w-1/3 h-56" />
            <Skeleton className="w-1/3 h-56" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#efeee7] flex flex-col items-center justify-start relative poppins">
      <ScrollArea>
        <div className="h-[100svh]">
          {/* Store Cover */}
          <div className="w-full relative">
            <div className="w-[100vw] h-86 bg-stone-700 flex items-center justify-center">
              <BackgroundBeams className="w-full h-86 bg-stone-800 overflow-hidden" />
              <span className="text-gray-100 text-2xl sm:text-4xl text-center font-bold z-10 mix-blend-overlay">
                {storeDetails.photo ? 'No Cover Photo Available' : 'No Cover Photo Available'}
              </span>
            </div>

            <div className="w-full absolute -bottom-24 flex justify-center">
              <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center shadow-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-gray-200">
                <Image
                  width={300}
                  height={300}
                  src={storeDetails.photo || "/store.jpg"}
                  alt="logo"
                  className="w-44 h-44 rounded-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Store Details */}
          <div className="mt-[6.6rem] flex flex-col justify-center items-center">
            <CardTitle className="text-2xl font-bold capitalize">{storeDetails.business_name}</CardTitle>
            <CardDescription className="text-base capitalize">{storeDetails.business_type}</CardDescription>

            {/* Contact & Info Section */}
            <div className="flex flex-col items-center sm:flex-row gap-2 sm:gap-4 text-base my-2">
              {/* Phone */}
              <span className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 transition-colors duration-300 group cursor-pointer sm:pr-4 sm:border-r-2 sm:border-gray-400/60">
                <Phone size={16} className="text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
                <span className="border-b border-transparent group-hover:border-emerald-500 transition-all duration-300">
                  {storeDetails.phone || 'N/A'}
                </span>
              </span>

              {/* Email */}
              <span className="flex items-center gap-2 text-sky-600 hover:text-sky-800 transition-colors duration-300 group cursor-pointer sm:pr-4 sm:border-r-2 sm:border-gray-400/60">
                <Mail size={16} className="text-sky-500 group-hover:scale-110 transition-transform duration-300" />
                <span className="border-b border-transparent group-hover:border-sky-500 transition-all duration-300">
                  {storeDetails.email}
                </span>
              </span>

              {/* Owner */}
              <span className="flex items-center gap-2 text-amber-600 hover:text-amber-800 transition-colors duration-300 group cursor-pointer capitalize">
                <CircleUserRound size={16} className="text-amber-500 group-hover:scale-110 transition-transform duration-300" />
                <span className="border-b border-transparent group-hover:border-amber-500 transition-all duration-300">
                  {storeDetails.name}
                </span>
              </span>
            </div>

            {/* Address */}
            <div className="flex items-center gap-2 text-neutral-700 text-base capitalize mt-1">
              <MapPin size={18} className="text-rose-400" />
              <span className="border-b border-transparent hover:border-rose-400 transition-all duration-300 cursor-pointer">
                {storeDetails.business_address}
              </span>
            </div>


            <div className='w-full max-w-[1200px] mt-5 px-8'>
              <Card className='gap-4'>
                <CardHeader className="text-xl font-semibold">About the Seller</CardHeader>
                <CardContent>
                  <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[150px_1fr] gap-2 text-base">
                    <div className="font-medium text-gray-700">About:</div>
                    <div className="text-gray-900">{storeDetails.business_description || 'N/A'}</div>

                    <div className="font-medium text-gray-700">Services:</div>
                    <div className="text-gray-900">{storeDetails.product_service || 'N/A'}</div>

                    <div className="font-medium text-gray-700">Categories:</div>
                    <div className="text-gray-900">{storeDetails.categories || 'N/A'}</div>

                    <div className="font-medium text-gray-700">Rating:</div>
                    <div className="text-gray-900"><Rating rating={storeDetails.rating} editable={false} size={22} /></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Products Section */}
          <div className="w-full max-w-[1400px] mx-auto mt-6 p-4 relative">
            <div className='w-full bg-stone-600/0 backdrop-blur-lg sticky top-[4.2rem] z-10 px-4 pt-1 mb-4 rounded-sm'>
              <div className='flex flex-row justify-between items-center'>
                <CardTitle className='w-fit text-lg sm:text-2xl font-semibold'>Products</CardTitle>
                <div className='flex items-end gap-3'>
                  <div className="relative">
                    {/* Mobile View */}
                    <div className="block z-20 sm:hidden h-[2.1rem] flex items-center bg-white rounded-full shadow-sm px-2 sm:px-4 border border-gray-200 transition-all duration-300 ease-in-out"
                      style={{ width: mobileSearchOpen ? '16rem' : '2.4rem' }}
                    >
                      {mobileSearchOpen && (
                        <input
                          type="text"
                          className="flex-1 w-4/5 h-full text-[16px] outline-none bg-transparent placeholder-gray-500 pl-3 "
                          placeholder="Search product..."
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
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
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                      />
                      <div className="h-5 w-px bg-gray-300"></div>
                      <Search size={16} className="text-gray-500" />
                    </div>
                  </div>

                </div>
              </div>
              <Separator className='bg-[#33323353] mt-1 p-[1px]' />
            </div>
            <div className="flex justify-center">
              <div className="flex flex-col gap-8 pb-10 w-full">
                {productLoading ? (
                  <div className="w-full">
                    <div className='flex justify-center mb-4'>
                      <Loader />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-4">
                      <Skeleton className="h-84 w-full" />
                      <Skeleton className="h-84 w-full" />
                      <Skeleton className="h-84 w-full" />
                      <Skeleton className="h-84 w-full" />
                    </div>
                  </div>
                ) : productError ? (
                  <div className="text-center text-red-500">{productError}</div>
                ) : products.length > 0 ? (
                  <div className="flex flex-wrap flex-wrap md:gap-1 lg:gap-4">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product: Product) => (
                        <ProductCard key={product.id} product={product} />
                      ))
                    ) : (
                      <div className="text-center text-gray-500 w-full">No products found</div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-600">No products found.</div>
                )}
              </div>
            </div>
          </div>

          {/* Comment Section */}
          <div className="w-full max-w-[1200px] px-6 mx-auto pb-10">
            <Card className="gap-1">
              <CardHeader>
                <CardTitle>Leave a Comment!</CardTitle>
                <CardDescription>No comments yet. Be the first to leave feedback!</CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent>
                  <div className="flex flex-row items-center gap-3">
                    <CardDescription className="text-base pl-1">Rate our Service/Store:</CardDescription>
                    <Rating rating={rating} onRate={(star) => {
                      // console.log('Rated:', star);
                      setRating(star);
                    }} editable={true} size={24} />
                  </div>

                  <Textarea
                    className="h-30 sm:h-24"
                    placeholder="Write your comment here..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </CardContent>

                <CardFooter className="mt-4">
                  <Button type="submit" variant="default">
                    Submit
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
          <Footer />
        </div>
      </ScrollArea>
    </div>
  );
}
