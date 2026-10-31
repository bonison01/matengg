import { Product } from "@/utils/types/product";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartProduct extends Product {
  quantity: number;
  itemPrice: number;        // discounted or price_inr
  originalPrice: number;    // original price
}

interface CartState {
  items: CartProduct[];
  totalPrice: number;        // total discounted price
  totalOriginalPrice: number; // total original price
}

const initialState: CartState = {
  items: [],
  totalPrice: 0,
  totalOriginalPrice: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    hydrateCart: (state, action: PayloadAction<CartState>) => {
      return action.payload;
    },

    addToCart: (state, action: PayloadAction<Product>) => {
      const product = action.payload;
      const itemPrice = product.discounted_price ?? product.price_inr ?? 0;
      const originalPrice = product.price_inr ?? 0;

      const existingItem = state.items.find(item => item.id === product.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...product, quantity: 1, itemPrice, originalPrice });
      }

      state.totalPrice += itemPrice;
      state.totalOriginalPrice += originalPrice;
    },

    removeFromCart: (state, action: PayloadAction<number>) => {
      const index = state.items.findIndex(item => item.id === action.payload);
      if (index >= 0) {
        const item = state.items[index];
        state.totalPrice -= item.itemPrice * item.quantity;
        state.totalOriginalPrice -= item.originalPrice * item.quantity;
        state.items.splice(index, 1);
      }
    },

    increaseQuantity: (state, action: PayloadAction<number>) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item) {
        item.quantity += 1;
        state.totalPrice += item.itemPrice;
        state.totalOriginalPrice += item.originalPrice;
      }
    },

    decreaseQuantity: (state, action: PayloadAction<number>) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item) {
        if (item.quantity > 1) {
          item.quantity -= 1;
          state.totalPrice -= item.itemPrice;
          state.totalOriginalPrice -= item.originalPrice;
        } else {
          state.totalPrice -= item.itemPrice;
          state.totalOriginalPrice -= item.originalPrice;
          state.items = state.items.filter((cartItem) => cartItem.id !== action.payload);
        }
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.totalPrice = 0;
      state.totalOriginalPrice = 0;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
  hydrateCart,
} = cartSlice.actions;

export default cartSlice.reducer;
