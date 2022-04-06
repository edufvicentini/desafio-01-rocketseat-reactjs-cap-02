import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

     if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const cartProduct = cart.find(product => product.id === productId) as Product;
      const productData = await api.get(`/products?id=${productId}`).then(product => product.data[0]);
      const productStock = await api.get(`/stock?id=${productId}`).then(product => product.data[0]);

      if (productStock < 1)
      {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if (!cartProduct) {
        setCart([...cart, {...productData, amount: 1}]);}
    } catch {
      toast.error('Erro ao adicionar no carrinho');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const cartProduct = cart.find(product => product.id === productId) as Product;
      const cartProductIndex = cart.indexOf(cartProduct);
      setCart(cart.splice(cartProductIndex))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productStock = await api.get(`/stock?id=${productId}`).then(product => product.data[0]);
      const cartProduct = cart.find(product => product.id === productId) as Product;

      if (amount > productStock.amount){
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const cartIndex = cart.indexOf(cartProduct);
      cartProduct.amount = amount;
      cart[cartIndex] = cartProduct
      setCart([...cart])
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
