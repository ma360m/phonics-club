import { CartBadge } from './cart-badge'
import { WishlistNavLink } from './wishlist-nav-link'
import { NavbarClient } from './navbar-client'

export function Navbar() {
  return (
    <NavbarClient
      cartSlot={<CartBadge />}
      wishlistSlot={<WishlistNavLink />}
    />
  )
}
