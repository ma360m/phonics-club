import { CartBadge } from './cart-badge'
import { NavbarClient } from './navbar-client'

export function Navbar() {
  return <NavbarClient cartSlot={<CartBadge />} />
}
