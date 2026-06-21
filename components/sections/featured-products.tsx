'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Star, ShoppingCart, Heart, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const products = [
  {
    id: 1,
    name: 'Complete UI/UX Design Kit',
    description: 'Figma templates for modern apps',
    price: 79,
    originalPrice: 129,
    rating: 4.9,
    reviews: 342,
    image: '/products/design-kit.jpg',
    badge: 'Best Seller',
    category: 'Templates',
  },
  {
    id: 2,
    name: 'Developer Productivity Bundle',
    description: 'Tools and shortcuts for faster coding',
    price: 49,
    originalPrice: 89,
    rating: 4.8,
    reviews: 256,
    image: '/products/dev-bundle.jpg',
    badge: 'Popular',
    category: 'Tools',
  },
  {
    id: 3,
    name: 'The Complete Business Guide',
    description: 'From startup to scale-up strategies',
    price: 34,
    originalPrice: 59,
    rating: 4.7,
    reviews: 189,
    image: '/products/business-guide.jpg',
    badge: null,
    category: 'Books',
  },
  {
    id: 4,
    name: 'Marketing Mastery eBook',
    description: 'Digital marketing strategies that work',
    price: 29,
    originalPrice: 49,
    rating: 4.9,
    reviews: 421,
    image: '/products/marketing-ebook.jpg',
    badge: 'New',
    category: 'Books',
  },
]

export function FeaturedProducts() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12"
        >
          <div>
            <span className="text-sm font-semibold text-[#D30000] uppercase tracking-wider">
              Shop Products
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#111827] mt-2">
              Featured Products
            </h2>
          </div>
          <Link 
            href="/shop"
            className="inline-flex items-center gap-2 text-[#1D4ED8] font-medium hover:gap-3 transition-all"
          >
            View All Products
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Link href={`/shop/${product.id}`} className="block">
                <div className="relative bg-[#F8FAFC] rounded-2xl overflow-hidden mb-4">
                  {product.badge && (
                    <span className={`absolute top-3 left-3 px-3 py-1 text-xs font-semibold rounded-full z-10 ${
                      product.badge === 'Best Seller' ? 'bg-[#D30000] text-white' :
                      product.badge === 'Popular' ? 'bg-[#1D4ED8] text-white' :
                      product.badge === 'New' ? 'bg-[#FBBF24] text-[#111827]' :
                      'bg-[#475569] text-white'
                    }`}>
                      {product.badge}
                    </span>
                  )}
                  <button 
                    className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-[#D30000] hover:text-white"
                    aria-label="Add to wishlist"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                  <div className="aspect-square bg-gradient-to-br from-[#1D4ED8]/20 to-[#60A5FA]/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <span className="text-6xl opacity-50">{product.category === 'Books' ? '📚' : product.category === 'Templates' ? '🎨' : '🛠️'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-[#475569] uppercase tracking-wider">
                    {product.category}
                  </span>
                  <h3 className="font-semibold text-[#111827] group-hover:text-[#1D4ED8] transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-[#475569] line-clamp-1">
                    {product.description}
                  </p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-[#FBBF24] fill-[#FBBF24]' : 'text-[#E2E8F0]'}`} 
                      />
                    ))}
                    <span className="text-sm text-[#475569] ml-1">({product.reviews})</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-[#111827]">${product.price}</span>
                      <span className="text-sm text-[#475569] line-through">${product.originalPrice}</span>
                    </div>
                    <Button size="sm" className="bg-[#1D4ED8] hover:bg-[#1D4ED8]/90 text-white">
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
