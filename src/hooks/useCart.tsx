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
    
      const productStock = (await api.get(`/stock/${productId}`)).data as Stock;
      if (productStock.amount < 1)
      {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if (cartProduct) {
        const newAmount = cartProduct.amount + 1;

        if (newAmount > productStock.amount) {
          toast.error('Quantidade solicitada fora de estoque') 
          return
        }

        const cartIndex = updatedCart.indexOf(cartProduct);
        cartProduct.amount = newAmount;
        updatedCart[cartIndex] = cartProduct
        setCart([...updatedCart])
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      } else {
        const productData = (await api.get(`/products/${productId}`)).data as Product;
        // const productData = (await api.get(`/products/10`)).data as Product;
        if (!productData){
          throw Error('Erro na adição do produto') 
        }

        const newCart = [...updatedCart, {...productData, amount: 1}]
        setCart([...newCart]);
        console.log(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      }
      
    } catch(e) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = cart.find(product => productId === product.id)

      if (!product)
      {
        throw Error("Erro na remoção do produto");
      }
      const newCart = cart.filter(product => product.id !== productId) as Product[];
      setCart([...newCart])
      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...newCart]))
    } catch(e) {
      toast.error((e as Error).message);
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const updatedCart = [...cart]
      const cartProduct = updatedCart.find(product => product.id === productId) as Product;
      if (!cartProduct || amount < 1)
        throw Error("Erro na alteração de quantidade do produto")
      
      const productStock = (await api.get(`/stock/${productId}`)).data;

      if(productStock.amount === 0 || 
        amount > productStock.amount){
          throw Error("Quantidade solicitada fora de estoque");
      }

      const cartIndex = updatedCart.indexOf(cartProduct);
      cartProduct.amount = amount;
      updatedCart[cartIndex] = cartProduct
      setCart([...updatedCart])
      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...updatedCart]))
    } catch(e) {
      toast.error((e as Error).message);
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
