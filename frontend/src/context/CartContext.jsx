import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { toast } from 'react-toastify';
import {
  getCart,
  addToCart as addToCartApi,
  updateCartItem,
  removeFromCart as removeFromCartApi,
  clearCart as clearCartApi,
  validateCoupon,
} from '../services/api';

export const CartContext = createContext();
// Hàm này sẽ được sử dụng để cung cấp các chức năng liên quan đến giỏ hàng cho các component khác trong ứng dụng.
export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponId, setCouponId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedCoupon = localStorage.getItem('coupon');
    if (savedCoupon) {
      try {
        const couponData = JSON.parse(savedCoupon);
        setCouponCode(couponData.code);
        setDiscountAmount(couponData.discount);
        setCouponId(couponData.id);
      } catch (err) {
        console.error('[CartContext] Error parsing saved coupon:', err);
        localStorage.removeItem('coupon');
      }
    }
  }, []);
  // Hàm này sẽ được gọi khi component được mount hoặc khi user thay đổi.
  useEffect(() => {
    console.log('[CartContext] User state changed:', user ? `userId=${user.id}` : 'No user');
    if (user && localStorage.getItem('token')) {
      fetchCart();
    } else {
      setCart([]);
      removeCoupon();
    }
  }, [user]);
  // Hàm này sẽ được gọi khi user thay đổi, để lấy giỏ hàng từ API nếu user đã đăng nhập.
  const fetchCart = async () => {
    setIsLoading(true);
    console.log('[CartContext] Fetching cart');
    try {
      const response = await getCart();
      const cartData = response.data.cart || [];
      console.log('[CartContext] Raw cart data from API:', cartData);

      const normalizedCart = cartData
        .map(item => {
          if (!item.id && !item.productId) {
            console.warn('[CartContext] Item không hợp lệ, thiếu id/productId:', item);
            return null;
          }

          // Normalize size
          let normalizedSize = [];
          if (item.size) {
            if (Array.isArray(item.size)) {
              normalizedSize = item.size;
            } else if (typeof item.size === 'string') {
              try {
                normalizedSize = item.size.startsWith('[') && item.size.endsWith(']')
                  ? JSON.parse(item.size)
                  : [item.size];
              } catch (err) {
                console.error(`[CartContext] Error parsing size for productId=${item.productId}:`, err.message);
                normalizedSize = [item.size];
              }
            }
          }

          // Normalize color
          let normalizedColor = [];
          if (item.color) {
            if (Array.isArray(item.color)) {
              normalizedColor = item.color;
            } else if (typeof item.color === 'string') {
              try {
                normalizedColor = item.color.startsWith('[') && item.color.endsWith(']')
                  ? JSON.parse(item.color)
                  : [item.color];
              } catch (err) {
                console.error(`[CartContext] Lỗi khi phân tích màu sắc cho productId=${item.productId}:`, err.message);
                normalizedColor = [item.color];
              }
            }
          }

          return {
            // Giữ nguyên các thuộc tính khác của item
            ...item,
            id: item.id || item.productId,
            productId: item.productId || item.id,
            size: normalizedSize,
            color: normalizedColor,
          };
        })
        .filter(item => item !== null);

      if (normalizedCart.length !== cartData.length) {
        toast.error('Một số sản phẩm trong giỏ hàng không hợp lệ đã bị loại bỏ');
      }

      setCart(normalizedCart);
      console.log('[CartContext] Normalized cart:', normalizedCart);

      if (couponCode) {
        const subtotal = normalizedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        validateCouponSilently(couponCode, subtotal);
      }
    } catch (err) {
      console.error('[CartContext] Error fetching cart:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Lỗi tải giỏ hàng');
      setCart([]);
    } finally {
      setIsLoading(false);
    }
  };
  // Hàm này sẽ được gọi để lấy giỏ hàng từ API và cập nhật state cart.
  const validateCouponSilently = async (code, subtotal) => {
    try {
      console.log('[CartContext] Validating coupon silently:', { code, subtotal });
      const response = await validateCoupon(code, subtotal);
      console.log('[CartContext] Silent validation result:', response.data);
      if (response.data.valid) {
        setCouponCode(code);
        setDiscountAmount(response.data.discount_amount);
        setCouponId(response.data.coupon_id);

        localStorage.setItem('coupon', JSON.stringify({
          code,
          discount: response.data.discount_amount,
          id: response.data.coupon_id
        }));
      } else {
        removeCoupon();
      }
    } catch (err) {
      console.error('[CartContext] Error validating coupon silently:', err.response?.data || err.message);
      removeCoupon();
    }
  };
  // Hàm này sẽ được gọi để thêm sản phẩm vào giỏ hàng.
  const addToCart = async (product, quantity = 1, { size, color }) => { 
    console.log('[CartContext] addToCart called:', { productId: product?.id, quantity, size, color });
    if (!product?.id || !product?.price || !product?.name) {
      console.log('[CartContext] Invalid product:', product);
      toast.error('Sản phẩm không hợp lệ');
      return;
    }
    if (!user || !localStorage.getItem('token')) {
      console.log('[CartContext] User not logged in or no token');
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }
    if (!size || !color) {
      console.log('[CartContext] Missing size or color:', { size, color });
      toast.error('Vui lòng chọn kích thước và màu sắc');
      return;
    }
    try {
      const response = await addToCartApi(product.id, quantity, size, color);
      await fetchCart(); // Cập nhật giỏ hàng sau khi thêm
      toast.success(`Bạn đã thêm sản phẩm ${product.name} vào giỏ hàng!`);
      console.log('[CartContext] Added to cart:', { productId: product.id, quantity, size, color, response: response.data });
    } catch (err) {
      console.error('[CartContext] Error adding to cart:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Lỗi thêm vào giỏ hàng. Vui lòng thử lại!');
    }
  };
  // Hàm này sẽ được gọi để cập nhật số lượng sản phẩm trong giỏ hàng.
  const updateQuantity = async (productId, quantity, size, color) => { 
    console.log('[CartContext] updateQuantity called:', { productId, quantity, size, color });
    if (quantity < 1) {
      console.log('[CartContext] Invalid quantity:', quantity);
      toast.error('Số lượng phải lớn hơn 0');
      return;
    }
    try {
      const response = await updateCartItem(productId, quantity, size, color);
      await fetchCart();
      toast.success(`Bạn đã cập nhật số lượng sản phẩm trong giỏ hàng!`);
      console.log('[CartContext] Updated quantity:', { productId, quantity, size, color, response: response.data });
    } catch (err) {
      console.error('[CartContext] Error updating cart:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Lỗi cập nhật giỏ hàng');
    }
  };

  const removeFromCart = async (productId, size, color) => {
    console.log('[CartContext] removeFromCart called:', { productId, size, color });
    try {
      const response = await removeFromCartApi(productId, size, color);
      await fetchCart();
      toast.success(`Bạn đã xóa sản phẩm khỏi giỏ hàng!`);
      console.log('[CartContext] Removed from cart:', { productId, size, color, response: response.data });
    } catch (err) {
      console.error('[CartContext] Error removing from cart:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Lỗi xóa sản phẩm');
    }
  };
  // Hàm này sẽ được gọi để xóa toàn bộ giỏ hàng.
  const clearCart = async () => { 
    console.log('[CartContext] clearCart called');
    try {
      const response = await clearCartApi();
      setCart([]);
      removeCoupon();
      toast.success('Bạn đã xóa toàn bộ giỏ hàng!');
      console.log('[CartContext] Cleared cart:', response.data);
    } catch (err) {
      console.error('[CartContext] Error clearing cart:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Lỗi xóa giỏ hàng');
    }
  };
  // Hàm này sẽ được gọi để áp dụng mã giảm giá vào giỏ hàng.
  const applyCoupon = async (code, cartTotal) => { 
    console.log('[CartContext] applyCoupon called:', { code, cartTotal });
    try {
      const response = await validateCoupon(code, cartTotal);
      console.log('[CartContext] Kết quả validateCoupon:', response.data);
      if (response.data.valid) {
        setCouponCode(code);
        setDiscountAmount(response.data.discount_amount);
        setCouponId(response.data.coupon_id);

        localStorage.setItem('coupon', JSON.stringify({
          code,
          discount: response.data.discount_amount,
          id: response.data.coupon_id
        }));

        toast.success('Áp dụng mã giảm giá thành công!');
        return { valid: true, discount_amount: response.data.discount_amount };
      } else {
        removeCoupon();
        toast.error(response.data.message || 'Mã giảm giá không hợp lệ');
        return { valid: false, message: response.data.message };
      }
    } catch (err) {
      console.error('[CartContext] Lỗi applyCoupon:', err.response?.data || err.message);
      removeCoupon();
      toast.error(err.response?.data?.message || 'Lỗi áp dụng mã giảm giá');
      throw err;
    }
  };

  const removeCoupon = () => {
    console.log('[CartContext] removeCoupon called');
    setCouponCode('');
    setDiscountAmount(0);
    setCouponId(null);
    localStorage.removeItem('coupon');
    toast.info('Đã xóa mã giảm giá');
  };
  // Cung cấp các giá trị và hàm cho các component con sử dụng CartContext
  return ( 
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        couponCode,
        discountAmount,
        couponId,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};