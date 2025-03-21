import React, { createContext, useContext, useState, useCallback } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  triggerAnimation: boolean;
  setTriggerAnimation: (value: boolean) => void;
  verifyCartItems: () => Promise<{
    valid: boolean;
    updatedItems?: CartItem[];
    message?: string;
    removedItems?: any[];
  }>;
  updateCartItems: (newItems: CartItem[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [triggerAnimation, setTriggerAnimation] = useState(false);

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems(currentItems => {
      const existingItemIndex = currentItems.findIndex(item => item.id === newItem.id);
      
      if (existingItemIndex > -1) {
        return currentItems.map((item, i) => {
          if (i === existingItemIndex) {
            return { ...item, quantity: item.quantity + quantity };
          }
          return item;
        });
      } else {
        return [...currentItems, { ...newItem, quantity }];
      }
    });

    // Trigger animation
    setTriggerAnimation(true);
    setTimeout(() => setTriggerAnimation(false), 3000);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const updateCartItems = useCallback((newItems: CartItem[]) => {
    setItems(newItems);
  }, []);

  // Verify items exist in database and have valid quantities
  const verifyCartItems = useCallback(async () => {
    if (items.length === 0) {
      return { valid: true, updatedItems: [] };
    }

    try {
      const response = await fetch('/api/products/verify-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify cart items');
      }

      const data = await response.json();
      
      // If we need to update the cart based on database state
      if (data.needsUpdate) {
        // Update cart items if needed
        setItems(data.validItems);
        
        if (data.removedItems.length > 0) {
          return {
            valid: data.validItems.length > 0,
            updatedItems: data.validItems,
            removedItems: data.removedItems,
            message: `Some items were removed from your cart because they no longer exist in our inventory.`
          };
        }
        
        if (data.updatedItems.length > 0) {
          return {
            valid: true,
            updatedItems: data.validItems,
            message: `Some quantities were adjusted based on available stock.`
          };
        }
      }
      
      return { 
        valid: data.validItems.length > 0,
        updatedItems: data.validItems 
      };
    } catch (error) {
      console.error('Error verifying cart items:', error);
      return { 
        valid: false, 
        message: 'Failed to verify cart items with the database. Please try again.' 
      };
    }
  }, [items]);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount,
    triggerAnimation,
    setTriggerAnimation,
    verifyCartItems,
    updateCartItems
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 