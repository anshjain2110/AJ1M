import MegaMenuHeader from './MegaMenuHeader';
import StoreFooter from './StoreFooter';
import { CartProvider } from '../CartContext';

/** StoreLayout — the consistent shell for every shop page. */
export default function StoreLayout({ children }) {
  return (
    <CartProvider>
      <MegaMenuHeader />
      {children}
      <StoreFooter />
    </CartProvider>
  );
}
