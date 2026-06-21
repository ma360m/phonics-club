'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Calendar, Clock, ArrowRight } from 'lucide-react'

const posts = [
  {
    id: 1,
    title: '10 Web Development Trends to Watch in 2024',
    excerpt: 'Stay ahead of the curve with these emerging technologies and practices that are shaping the future of web development.',
    author: 'Sarah Johnson',
    date: 'Dec 15, 2024',
    readTime: '5 min read',
    category: 'Web Development',
    image: '/blog/web-trends.jpg',
  },
  {
    id: 2,
    title: 'How to Build a Successful Career in UX Design',
    excerpt: 'A comprehensive guide to breaking into the UX design industry and building a portfolio that stands out.',
    author: 'Michael Chen',
    date: 'Dec 12, 2024',
    readTime: '7 min read',
    category: 'Design',
    image: '/blog/ux-career.jpg',
  },
  {
    id: 3,
    title: 'The Complete Guide to Remote Learning',
    excerpt: 'Tips and strategies for maximizing your online learning experience and staying motivated.',
    author: 'Emily Davis',
    date: 'Dec 10, 2024',
    readTime: '4 min read',
    category: 'Education',
    image: '/blog/remote-learning.jpg',
  },
]

export function BlogPreview() {
  return (
    <section className="py-20 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12"
        >
          <div>
            <span className="text-sm font-semibold text-[#1D4ED8] uppercase tracking-wider">
              From Our Blog
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#111827] mt-2">
              Latest Articles
            </h2>
          </div>
          <Link 
            href="/blog"
            className="inline-flex items-center gap-2 text-[#1D4ED8] font-medium hover:gap-3 transition-all"
          >
            View All Articles
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Link href={`/blog/${post.id}`} className="block">
                <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-[#1D4ED8] to-[#60A5FA]">
                  <div className="absolute inset-0 flex items-center justify-center text-white/30 text-6xl">
                    {post.category === 'Web Development' ? '💻' : post.category === 'Design' ? '🎨' : '📚'}
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-[#475569]">
                    <span className="text-xs font-medium text-[#1D4ED8] bg-[#1D4ED8]/10 px-2 py-1 rounded">
                      {post.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{post.date}</span>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg text-[#111827] group-hover:text-[#1D4ED8] transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-[#475569] text-sm line-clamp-2">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-[#475569]">
                      By <span className="text-[#111827] font-medium">{post.author}</span>
                    </p>
                    <div className="flex items-center gap-1 text-sm text-[#475569]">
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
