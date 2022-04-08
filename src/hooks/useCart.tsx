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
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => Promise<void>;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

     if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    // localStorage.clear();

    return []
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const cartProduct = updatedCart.find(product => product.id === productId) as Product;
      const productData = await api.get(`/products?id=${productId}`).then(product => product.data[0]) as Product;
      // const productData = await api.get(`/products?id=10`).then(product => product.data[0]) as Product;
      const productStock = await api.get(`/stock?id=${productId}`).then(product => product.data[0]) as Stock;
      
      if (productStock.amount < 1)
      {
        toast.error(() => 'Quantidade solicitada fora de estoque');
        return
      }

      if (!productData){
        toast.error('Erro na adição do produto');
        return  
      }

      if (!cartProduct) {
        setCart([...cart, {...productData, amount: 1}]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
      } else {
        const amount = cartProduct.amount + 1
        updateProductAmount({productId, amount})
      }
      
    } catch {
      toast.error(() => 'Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = cart.find(product => productId === product.id)

      if (!product)
      {
        toast.error('Erro na remoção do produto');
        return
      }
      const newCart = cart.filter(product => product.id !== productId) as Product[];
      setCart([...newCart])
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const cartProduct = cart.find(product => product.id === productId) as Product;
      const productStock = await api.get(`/stock?id=${productId}`).then(product => product.data[0]);

      if (!cartProduct || 
          productStock.amount === 0 || 
          amount > productStock.amount){
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const cartIndex = cart.indexOf(cartProduct);
      cartProduct.amount = amount;
      cart[cartIndex] = cartProduct
      setCart([...cart])
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
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
