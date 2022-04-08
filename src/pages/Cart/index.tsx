import {
  MdDelete,
  MdAddCircleOutline,
  MdRemoveCircleOutline,
} from 'react-icons/md';

import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../util/format';
import { Container, ProductTable, Total } from './styles';

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
  amount: number;
}

const Cart = (): JSX.Element => {
  const { cart, removeProduct, updateProductAmount } = useCart();

  const cartFormatted = cart.map((product:Product) => {
    return {
      formattedPrice: formatPrice(product.price),
      subTotal: formatPrice(product.amount*product.price)
    }
  })
  const total =
    formatPrice(
      cart.reduce((sumTotal, product) => {
        sumTotal += product.price * product.amount;
        return sumTotal
      }, 0)
    )

  async function handleProductIncrement(product: Product) {
    const amount = product.amount + 1 as number;
    const productId = product.id as number;
      await updateProductAmount({productId, amount})
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
  }

  function handleProductDecrement(product: Product) {
    const amount = product.amount - 1 as number;
    const productId = product.id as number;
      updateProductAmount({productId, amount})

  }

  function handleRemoveProduct(productId: number) {
    
    removeProduct(productId);
  }

  return (
    <Container>
      <ProductTable>
        <thead>
          <tr>
            <th aria-label="product image" />
            <th>PRODUTO</th>
            <th>QTD</th>
            <th>SUBTOTAL</th>
            <th aria-label="delete icon" />
          </tr>
        </thead>
        <tbody>
          {cart.map((product => {
            return(
              <tr data-testid="product" key={product.id}>
            <td>
              <img src={product.image} alt={product.title}/>
            </td>
            <td>
              <strong>{product.title}</strong>
              <span>{cartFormatted[cart.indexOf(product)].formattedPrice}</span>
            </td>
            <td>
              <div>
                <button
                  type="button"
                  data-testid="decrement-product"
                  disabled={product.amount <= 1}
                  onClick={() => handleProductDecrement(product)}
                >
                  <MdRemoveCircleOutline size={20} />
                </button>
                <input
                  type="text"
                  data-testid="product-amount"
                  readOnly
                  value={product.amount}
                />
                <button
                  type="button"
                  data-testid="increment-product"
                  onClick={() => handleProductIncrement(product)}
                >
                  <MdAddCircleOutline size={20} />
                </button>
              </div>
            </td>
            <td>
              <strong>{product.title}</strong>
              <span>{cartFormatted[cart.indexOf(product)].subTotal}</span>
            </td>
            <td>
              <button
                type="button"
                data-testid="remove-product"
                onClick={() => handleRemoveProduct(product.id)}
              >
                <MdDelete size={20} />
              </button>
            </td>
          </tr>
          )
          }))}
          

        </tbody>
      </ProductTable>

      <footer>
        <button type="button">Finalizar pedido</button>

        <Total>
          <span>TOTAL</span>
          <strong>{total}</strong>
        </Total>
      </footer>
    </Container>
  );
};

export default Cart;
