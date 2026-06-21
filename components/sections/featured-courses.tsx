'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Star, Clock, Users, PlayCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const courses = [
  {
    id: 1,
    title: 'Complete Web Development Bootcamp 2024',
    instructor: 'Sarah Johnson',
    description: 'Learn HTML, CSS, JavaScript, React, Node.js and more',
    price: 99,
    originalPrice: 199,
    rating: 4.9,
    reviews: 2547,
    students: 45230,
    duration: '42 hours',
    lessons: 320,
    level: 'Beginner',
    image: '/courses/web-dev.jpg',
    badge: 'Best Seller',
    category: 'Web Development',
  },
  {
    id: 2,
    title: 'UI/UX Design Masterclass',
    instructor: 'Michael Chen',
    description: 'Master Figma, user research, and design thinking',
    price: 79,
    originalPrice: 159,
    rating: 4.8,
    reviews: 1893,
    students: 32100,
    duration: '28 hours',
    lessons: 185,
    level: 'All Levels',
    image: '/courses/uiux.jpg',
    badge: 'Popular',
    category: 'Design',
  },
  {
    id: 3,
    title: 'Digital Marketing Pro',
    instructor: 'Emily Davis',
    description: 'SEO, social media, content marketing strategies',
    price: 69,
    originalPrice: 139,
    rating: 4.7,
    reviews: 1456,
    students: 28500,
    duration: '24 hours',
    lessons: 156,
    level: 'Intermediate',
    image: '/courses/marketing.jpg',
    badge: null,
    category: 'Marketing',
  },
  {
    id: 4,
    title: 'Data Science & Machine Learning',
    instructor: 'David Kim',
    description: 'Python, pandas, scikit-learn, and TensorFlow',
    price: 89,
    originalPrice: 179,
    rating: 4.9,
    reviews: 2103,
    students: 38900,
    duration: '36 hours',
    lessons: 245,
    level: 'Advanced',
    image: '/courses/data-science.jpg',
    badge: 'New',
    category: 'Data Science',
  },
]

export function FeaturedCourses() {
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
              Learn New Skills
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#111827] mt-2">
              Featured Courses
            </h2>
          </div>
          <Link 
            href="/courses"
            className="inline-flex items-center gap-2 text-[#1D4ED8] font-medium hover:gap-3 transition-all"
          >
            View All Courses
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Link 
                href={`/courses/${course.id}`}
                className="flex flex-col sm:flex-row bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#E2E8F0] hover:border-[#1D4ED8]/20"
              >
                <div className="relative sm:w-64 shrink-0">
                  {course.badge && (
                    <span className={`absolute top-3 left-3 px-3 py-1 text-xs font-semibold rounded-full z-10 ${
                      course.badge === 'Best Seller' ? 'bg-[#D30000] text-white' :
                      course.badge === 'Popular' ? 'bg-[#1D4ED8] text-white' :
                      course.badge === 'New' ? 'bg-[#FBBF24] text-[#111827]' :
                      'bg-[#475569] text-white'
                    }`}>
                      {course.badge}
                    </span>
                  )}
                  <div className="aspect-video sm:aspect-[4/3] bg-gradient-to-br from-[#1D4ED8] to-[#60A5FA] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                    <PlayCircle className="w-12 h-12 text-white opacity-80 group-hover:scale-110 transition-transform" />
                  </div>
                </div>

                <div className="flex-1 p-5 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-[#1D4ED8] bg-[#1D4ED8]/10 px-2 py-1 rounded">
                      {course.category}
                    </span>
                    <span className="text-xs text-[#475569]">{course.level}</span>
                  </div>
                  
                  <h3 className="font-semibold text-lg text-[#111827] group-hover:text-[#1D4ED8] transition-colors mb-1 line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-sm text-[#475569] mb-3 line-clamp-1">
                    {course.description}
                  </p>
                  
                  <p className="text-sm text-[#475569] mb-3">
                    By <span className="text-[#111827] font-medium">{course.instructor}</span>
                  </p>

                  <div className="flex items-center gap-4 text-sm text-[#475569] mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <PlayCircle className="w-4 h-4" />
                      <span>{course.lessons} lessons</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{(course.students / 1000).toFixed(1)}k</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-4">
                    <span className="font-bold text-[#111827]">{course.rating}</span>
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < Math.floor(course.rating) ? 'text-[#FBBF24] fill-[#FBBF24]' : 'text-[#E2E8F0]'}`} 
                      />
                    ))}
                    <span className="text-sm text-[#475569]">({course.reviews.toLocaleString()})</span>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xl text-[#111827]">${course.price}</span>
                      <span className="text-sm text-[#475569] line-through">${course.originalPrice}</span>
                    </div>
                    <Button className="bg-[#D30000] hover:bg-[#D30000]/90 text-white">
                      Enroll Now
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
