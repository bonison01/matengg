import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useState, useRef, memo, useEffect, useCallback } from "react";
import { Info, ShoppingBasket, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
// At the top of components/product/productCard.tsx


import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Product } from "@/utils/types/product";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, increaseQuantity, decreaseQuantity, CartProduct } from "@/lib/cart/cartSlice";
import { RootState } from "@/lib/cart/store";
import Image from 'next/image'
import "./productCard.css";

// Define the props interface for the ProductImage component
interface ProductImageProps {
    src: string;
    alt: string;
    onClick?: () => void;
    className?: string;
}

// Create a separate component for the product image to prevent unnecessary re-renders
const ProductImage = memo(({ src, alt, onClick, className = "" }: ProductImageProps) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const [imgSrc, setImgSrc] = useState(src || "/unavailable.jpg");

    return (
        <img
            ref={imgRef}
            src={imgSrc}
            alt={alt}
            width={600}
            height={700}
            className={`w-full h-full object-cover ${className}`}
            loading="lazy"
            onClick={onClick}
            onError={() => setImgSrc("/unavailable.jpg")}
        />
    );
});

ProductImage.displayName = 'ProductImage';

const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

// Reusable media component
const ProductMedia = ({ src, alt }: { src: string; alt: string }) => {
    if (isVideo(src)) {
        return (
            <video
                src={src}
                controls
                className="w-full h-full object-cover rounded"
            >
                Your browser does not support the video tag.
            </video>
        );
    }
    return (
        <img
            width={600}
            height={700}
            src={src}
            alt={alt}
            className="w-full h-full object-cover rounded"
        />
    );
};

// Define the props interface for the ProductDialog component
interface ProductDialogProps {
    product: Product;
    isOpen: boolean;
    onClose: () => void;
    selectedImage: string;
    onImageSelect: (image: string) => void;
}

const ProductDialog = ({ product, isOpen, onClose, selectedImage, onImageSelect }: ProductDialogProps) => {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="pt-4 mt-[2rem]  overflow-y-auto">
                <ScrollArea className="h-auto max-h-[80svh]">
                    <DialogHeader className="gap-1 text-left pr-4">
                        <DialogTitle className="text-xl leading-none">Product Details</DialogTitle>
                        <DialogTitle className="mt-4">{product.name}</DialogTitle>
                        <DialogDescription>
                            {product.unit_quantity !== undefined && product.unit_quantity !== null
                                ? Number(product.unit_quantity)
                                : 'n/a'} {product.unit || ''}
                        </DialogDescription>

                        {/* <DialogDescription>{product.unit_quantity || 'n/a'}{" "}{product.unit || ''}</DialogDescription> */}
                        <DialogDescription>{product.description}</DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-row gap-5">
                        {/* Large Image Preview */}
                        <div className="h-fit w-72 bg-stone-300">
                            <ProductMedia src={selectedImage} alt="Product Media" />
                        </div>

                        {/* Scrollable Thumbnail Images */}
                        <ScrollArea>
                            <div className="flex flex-col h-84 gap-5 pr-4 overflow-y-auto">
                                {(product.media_urls?.length) ? (
                                    product.media_urls.map((img: string, index: number) => (
                                        <div
                                            key={index}
                                            className={`max-w-20 max-h-20 bg-stone-300 cursor-pointer border-2 ${selectedImage === img ? "border-blue-500" : "border-transparent"}`}
                                            onClick={() => onImageSelect(img)}
                                        >
                                            <ProductMedia
                                                src={img}
                                                alt={`Thumbnail ${index + 1}`}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-gray-500">No images available</div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="flex flex-col items-start font-semibold">
                        <CardDescription className="line-through text-xs">MRP: ₹{product.price_inr}</CardDescription>
                        <CardDescription className="text-[#4C4646]">Discount Price: ₹{product.discounted_price}</CardDescription>
                        <CardDescription><span className="text-[#4C4646]">Seller:</span> {product.user_name}</CardDescription>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

// Define the props interface for the ProductCard component
interface ProductCardProps {
    product: Product;
}

// Main ProductCard component with memo to prevent unnecessary re-renders
const ProductCard = memo(({ product }: ProductCardProps) => {
    const dispatch = useDispatch();
    const cartItems = useSelector((state: RootState) => state.cart.items);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(product.media_urls?.[0] || "/unavailable.jpg");

    // Check if the product is already in the cart
    const cartItem = cartItems.find(item => item.id === product.id);
    const isInCart = Boolean(cartItem);
    const quantity = cartItem?.quantity || 0;

    // Handle cart actions
    const handleAddToCart = () => {
        const itemPrice = product.discounted_price ?? product.price_inr ?? 0;
        const originalPrice = product.price_inr ?? 0;

        const cartProduct: CartProduct = {
            id: product.id,
            name: product.name,
            price_inr: product.price_inr,
            discounted_price: product.discounted_price,
            quantity: 1,
            media_urls: product.media_urls,
            unit_quantity: product.unit_quantity,
            user_name: product.user_name,
            description: product.description,
            itemPrice,
            originalPrice,
        };

        dispatch(addToCart(cartProduct));
    };


    const handleIncreaseQuantity = useCallback(() => {
        dispatch(increaseQuantity(product.id));
    }, [dispatch, product.id]);

    const handleDecreaseQuantity = useCallback(() => {
        dispatch(decreaseQuantity(product.id));
    }, [dispatch, product.id]);


    const handleOpenDialog = () => setIsDialogOpen(true);
    const handleCloseDialog = () => setIsDialogOpen(false);

    return (
        <>
            <div className="poppins w-1/2 h-[22rem] sm:w-[32%] md:w-[31%] md:h-[26rem] lg:w-[320px] lg:h-[470px] flex flex-col bg-transparent border-r border-b p-2 sm:p-4 pt-0 mb-6 sm:mb-0 sm:m-1">
                {/* Image container */}
                <div
                    className="bg-gray-300 w-full h-3/4 rounded-xl overflow-hidden relative cursor-pointer"
                    onClick={handleOpenDialog}
                >
                    <ProductImage
                        src={product.media_urls?.[0] || "/unavailable.jpg"}
                        alt={product.name}
                    />
                    <div className="absolute top-2 right-2">
                        <button
                            className="details-btn absolute text-stone-200 top-0 right-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDialog();
                            }}
                        >
                            <div className="details-sign flex justify-center items-center p-0 rounded-full relative overflow-hidden">
                                <Info />
                            </div>
                            <div className="details-text">Details</div>
                        </button>
                    </div>
                </div>

                <div className="flex flex-row justify-between items-top mt-2 text-stone-900 text-xl font-semibold px-1">
                    <div className="flex flex-col leading-none w-3/4">
                        <CardTitle className="text-sm">{product.name}</CardTitle>
                    </div>
                    <span className="w-fit text-xs text-[#4371BB] bg-[#B8C7DF57] mb-auto py-1.5 px-3 rounded-full leading-none">
                        {/* {product.unit_quantity || 'n/a'}{" "}{product.unit || ''} */}

                        {product.unit_quantity !== undefined && product.unit_quantity !== null
                            ? Number(product.unit_quantity)
                            : 'n/a'} {product.unit || ''}


                    </span>
                </div>

                <div className="flex flex-col justify-between p-1">
                    <div className="flex flex-col items-start font-semibold mb-2">
                        <CardDescription className="line-through text-[10px] sm:text-xs">MRP: ₹{product.price_inr}</CardDescription>
                        <CardDescription className="text-[#4C4646] text-xs sm:text-sm">Discount Price: ₹{product.discounted_price}</CardDescription>
                        {/* <CardDescription className="text-[#4C4646]">Quantity: {product.quantity}</CardDescription> */}
                    </div>

                    <div className="flex flex-col-reverse lg:flex-row  justify-between gap-2">
                        {/* {Number(product.quantity ?? 0) > 0 ? (
                            <Button
                                className="bg-gradient-to-b from-[#38D932] to-[#12850E]"
                                onClick={handleAddToCart}
                            >
                                Add to Cart <ShoppingBasket className="ml-2 mb-1" />
                            </Button>
                        ) : (
                            <Button
                                className="bg-gray-400 cursor-not-allowed"
                                disabled
                            >
                                Out of Stock
                            </Button>
                        )} */}
                        <Button
                            className="bg-gradient-to-b from-[#38D932] to-[#12850E]"
                            onClick={handleAddToCart}
                        >
                            Add to Cart <ShoppingBasket className="ml-2 mb-1" />
                        </Button>

                        {isInCart && (
                            <div className="flex items-center justify-between text-[#624b4b] w-full md:w-44 lg:w-32 h-8 border rounded-md shadow-md bg-neutral-100/70 text-gray-900">
                                <button
                                    className="px-4 sm:px-2 border-r border-[#C3C2B6]"
                                    onClick={handleDecreaseQuantity}
                                    disabled={!isInCart}
                                >
                                    <Minus size={18} />
                                </button>
                                <span className="text-base text-[#876767] font-medium">{quantity}</span>
                                <button
                                    className="px-4 sm:px-2 border-l border-[#C3C2B6]"
                                    onClick={handleIncreaseQuantity}
                                    disabled={!isInCart}
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Product Dialog */}
            <ProductDialog
                product={product}
                isOpen={isDialogOpen}
                onClose={handleCloseDialog}
                selectedImage={selectedImage}
                onImageSelect={setSelectedImage}
            />
        </>
    );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;