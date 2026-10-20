import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types';

import { calculateDeliveryFee, DeliveryFeeCalculation } from '../utils/deliveryFee';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItemsCount: number;
  totalWeightKg: number;
  subtotal: number;
  deliveryZone: 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA';
  setDeliveryZone: (zone: 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA') => void;
  deliveryFee: number;
  deliveryFeeDetails: DeliveryFeeCalculation;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('agro_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deliveryZone, setDeliveryZone] = useState<'INSIDE_DHAKA' | 'OUTSIDE_DHAKA'>(() => {
    try {
      const savedZone = localStorage.getItem('agro_delivery_zone');
      return (savedZone as any) || 'INSIDE_DHAKA';
    } catch {
      return 'INSIDE_DHAKA';
    }
  });

  useEffect(() => {
    localStorage.setItem('agro_cart_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('agro_delivery_zone', deliveryZone);
  }, [deliveryZone]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  // Convert product quantity to weight in kg:
  // kg -> 1kg, maund -> 40kg, ton -> 1000kg, crate -> 10kg, piece -> 0.5kg
  const calculateItemWeightKg = (item: CartItem): number => {
    const qty = item.quantity;
    const unit = item.product.unit;
    switch (unit) {
      case 'maund':
        return qty * 40;
      case 'ton':
        return qty * 1000;
      case 'crate':
        return qty * 10;
      case 'piece':
        return qty * 0.5;
      case 'kg':
      default:
        return qty;
    }
  };

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalWeightKg = items.reduce((sum, item) => sum + calculateItemWeightKg(item), 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.pricePerUnit * item.quantity, 0);

  // Calculate delivery fee using exact AgroChain rules
  const addressLookup = deliveryZone === 'INSIDE_DHAKA' ? 'Dhaka' : 'Chittagong';
  const deliveryFeeDetails = items.length > 0 
    ? calculateDeliveryFee(addressLookup, totalWeightKg)
    : { isDhaka: deliveryZone === 'INSIDE_DHAKA', baseFee: 0, weightFee: 0, totalDeliveryFee: 0, totalWeightKg: 0 };

  const deliveryFee = deliveryFeeDetails.totalDeliveryFee;
  const total = subtotal + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItemsCount,
        totalWeightKg,
        subtotal,
        deliveryZone,
        setDeliveryZone,
        deliveryFee,
        deliveryFeeDetails,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
