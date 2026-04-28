"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { LayoutDashboard, Briefcase, NotepadText, Contact, TableProperties, Users, Mails, Images, FileStack, School, GraduationCap, UserRoundPen, UserRoundCogIcon, House, Info, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'

function Icon({ name }) {
  switch (name) {
    case 'dashboard':
      return (
        <LayoutDashboard className="w-5 h-5" />
      )
    case 'registration':
      return (
        <FileStack className="w-5 h-5" />
      )
    case 'school':
      return (
        <School className="w-5 h-5" />
      )
    case 'graduation':
      return (
        <GraduationCap className="w-5 h-5" />
      )
    case 'teacher':
      return (
        <UserRoundPen className="w-5 h-5" />
      )
    case 'blog':
      return (
        <NotepadText className="w-5 h-5" />
      )
    case 'Contact':
      return (
        <Contact  className="w-5 h-5" />
      )
    case 'Quote Requests':
    return (
      <TableProperties className="w-5 h-5" />
    )
    case 'Users':
    return (
      <Users className="w-5 h-5" />
    )
    case 'house':
    return (
      <House className="w-5 h-5" />
      )
    case 'about':
    return (
      <Info className="w-5 h-5" />
    )
    case 'profile':
    return (
      <UserRoundCogIcon className="w-5 h-5" />
    )
    case 'Newsletter':
    return (
      <Mails className="w-5 h-5" />
    )
    case 'Newsletter':
    return (
      <Mails className="w-5 h-5" />
    )
    case 'Gallery':
    return (
      <Images className="w-5 h-5" />
    )
    case 'calendar':
      return (
        <Calendar className="w-5 h-5" />
      )
    default:
      return null
  }
}

export default function DashboardMenu({ collapsed, mobileOpen = false, onClose = () => { } }) {
  const { user, logout } = useAuth()
  const pathname = usePathname() || ''

  const handleLogout = () => {
    logout();
    onClose();
  };
  const items = [
    { href: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['admin', 'learning-specialist', 'school-leader', 'teacher', 'parent'] },
    {
      href: '/dashboard/blog',
      label: 'Blog',
      icon: 'blog',
      roles: ['admin', 'learning-specialist'],
      children: [
        { href: '/dashboard/add-blog', label: 'Add Blog', roles: ['admin', 'learning-specialist'] },
        { href: '/dashboard/manage-blog', label: 'Manage Blogs', roles: ['admin', 'learning-specialist'] }
      ]
    },
    { href: '/blog', label: 'View Blogs', icon: 'dashboard', roles: ['school-leader', 'teacher', 'parent'] },
    { href: '/dashboard/my-children', label: 'My Children', icon: 'dashboard', roles: ['parent'] },
    { href: '/dashboard/contact-form-responses', label: 'Contact Form Responses', icon: 'Contact', roles: ['admin', 'learning-specialist'] },
    { href: '/dashboard/manage-registration', label: 'Manage Registrations', icon: 'registration', roles: ['admin', 'learning-specialist'] },
    { href: '/dashboard/manage-schools', label: 'Manage Schools', icon: 'school', roles: ['admin', 'learning-specialist'] },
    { href: '/dashboard/academic-calendar', label: 'Academic Calendar', icon: 'calendar', roles: ['admin', 'learning-specialist'] },
    { href: '/dashboard/grade-promotion', label: 'Grade Promotion', icon: 'graduation', roles: ['admin', 'learning-specialist'] },
    {
      href: '/dashboard/schools',
      label: 'School Manager',
      icon: 'graduation',
      roles: ['admin', 'school-leader'],
      children: [
        { href: '/dashboard/school-members', label: 'School members', roles: ['admin', 'school-leader'] },
        { href: '/dashboard/invite-member', label: 'Invite Members', roles: ['admin', 'school-leader'] },
        { href: '/dashboard/school-parents', label: 'Parent List', roles: ['admin', 'school-leader'] },
      ]
    },
    {
      href: '/dashboard/teachers',
      label: 'Learning Specialist',
      icon: 'teacher',
      roles: ['admin', 'school-leader', 'learning-specialist', 'teacher', 'school-leader'],
      children: [
        { href: '/dashboard/all-classes', label: 'Classes', roles: ['admin', 'school-leader', 'teacher', 'learning-specialist'] },
        { href: '/dashboard/all-students', label: 'All Students', roles: ['admin', 'school-leader', 'teacher', 'learning-specialist'] },
        { href: '/dashboard/all-subjects', label: 'Subjects', roles: ['admin', 'school-leader', 'teacher', 'learning-specialist'] },
        { href: '/dashboard/student-assessments', label: 'Student Learning Data', roles: ['admin', 'school-leader', 'teacher', 'learning-specialist'] },
        { href: '/dashboard/mark-attendance', label: 'Mark Attendance', roles: ['admin', 'school-leader', 'teacher', 'learning-specialist'] },
        { href: '/dashboard/learning-impact', label: 'Learning Impact Data', roles: ['admin', 'learning-specialist'] },
      ]
    },
    {
      href: '/dashboard/all-newsletter',
      label: 'Newsletter Management',
      icon: 'Newsletter',
      roles: ['admin', 'learning-specialist'],
      children: [
        { href: '/dashboard/send-newsletter', label: 'Send Newsletter', roles: ['admin', 'learning-specialist'] },
        { href: '/dashboard/all-newsletters', label: 'All Newsletters', roles: ['admin', 'learning-specialist'] },
        { href: '/dashboard/subscribers', label: 'Subscribers', roles: ['admin', 'learning-specialist'] },
      ]
    },
    {
      href: '/dashboard/gallery',
      label: 'Gallery Management',
      icon: 'Gallery',
      roles: ['admin', 'learning-specialist'],
      children: [
        { href: '/dashboard/add-gallery', label: 'Add Gallery', roles: ['admin', 'learning-specialist'] },
        { href: '/dashboard/all-gallery', label: 'All Gallery', roles: ['admin', 'learning-specialist'] },
      ]
    },
    { href: '/gallery', label: 'Our Gallery', icon: 'projects', roles: ['client'] },
    {
      href: '/dashboard/users',
      label: 'Manage Users',
      icon: 'Users',
      roles: ['admin'],
      children: [
        { href: '/dashboard/all-users', label: 'All Users', roles: ['admin'] },
        { href: '/dashboard/add-user', label: 'Add User', roles: ['admin'] },
        { href: '/dashboard/change-user-password', label: 'Change User Password', roles: ['admin'] }
      ]
    },
    { href: '/dashboard/my-profile', label: 'Profile', icon: 'profile', roles: ['admin', 'school-leader', 'teacher', 'parent', 'learning-specialist'] },
    {
      href: '/dashboard/home',
      label: 'Homepage Contents',
      icon: 'house',
      roles: ['admin', 'learning-specialist'],
      children: [
        { href: '/dashboard/hero-slider', label: 'Hero Slider', roles: ['admin', 'learning-specialist'] },
        { href: '/dashboard/manage-slider-message', label: 'Slider Messages', roles: ['admin', 'learning-specialist'] },
        { href: '/dashboard/home-cta', label: 'Home CTA', roles: ['admin', 'learning-specialist'] },
        { href: '/dashboard/our-services-contents', label: 'Our Services', roles: ['admin', 'learning-specialist'] },
        { href: '/dashboard/our-clients', label: 'Our Clients & Partners', roles: ['admin', 'learning-specialist'] },
        { href: '/dashboard/testimonials', label: 'Testimonials', roles: ['admin', 'learning-specialist'] },
        { href: '/dashboard/why-rayob', label: 'Why Kiddies Check', roles: ['admin', 'learning-specialist'] },
        
      ]
    },
    {
      href: '/dashboard/about-page',
      label: 'About Page Contents',
      icon: 'about',
      roles: ['admin', 'learning-specialist'],
      children: [
        { href: '/dashboard/company-overview', label: 'Company Overview', roles: ['admin', 'learning-specialist'] },
        { href: '/dashboard/history-milestones', label: 'History & Milestones', roles: ['admin', 'learning-specialist'] },
        { href: '/dashboard/team-section', label: 'Our Team Manager', roles: ['admin', 'learning-specialist'] },
      ]
    },
  ]

   // Helper function to check if user has access to item
  const hasAccess = (itemRoles) => {
    if (!itemRoles) return true; // No role restriction
    return itemRoles.includes(user?.role);
  }

  const [openKey, setOpenKey] = useState(null)

  function toggleSub(key) {
    setOpenKey(prev => (prev === key ? null : key))
  }

  // Desktop / large screens: persistent sidebar
  const desktopNav = (
    <nav className={`hidden md:flex h-full bg-blue-900 border-r border-gray-100 ${collapsed ? 'w-16' : 'w-75'} transition-width duration-200`} aria-label="Dashboard navigation">
      <div className="h-full overflow-y-auto py-6 px-2">
        <ul className="space-y-1">
          {items.map(i => {
            // Check if user has access to this item
            if (!hasAccess(i.roles)) return null;

            const active = pathname === i.href || pathname.startsWith(i.href + '/')
            const hasChildren = Array.isArray(i.children) && i.children.length > 0
            const isOpen = openKey === i.href
            // Filter children based on access
            const visibleChildren = hasChildren ? i.children.filter(c => hasAccess(c.roles)) : [];

            return (
              <li key={i.href}>
                {hasChildren ? (
                  <div>
                    <button
                      onClick={() => toggleSub(i.href)}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md ${active ? 'bg-indigo-50 text-indigo-600' : 'text-white hover:bg-blue-800'}`}
                    >
                      <span className="flex justify-start items-center gap-2">
                        <span className="shrink-0"> <Icon name={i.icon} /> </span>
                        {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{i.label}</span>}
                      </span>
                      {!collapsed && (
                        <svg className={`w-4 h-4 text-white transition-transform ${isOpen ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 6l6 4-6 4V6z" />
                        </svg>
                      )}
                    </button>

                    {/* Submenu (desktop) */}
                    {!collapsed && isOpen && (
                      <ul className="mt-1 space-y-1 pl-10">
                        {i.children.map(c => (
                          <li key={c.href}>
                            <Link href={c.href} className={`block px-3 py-2 rounded-md text-sm ${pathname === c.href ? 'bg-indigo-50 text-indigo-600' : 'text-white hover:bg-blue-600'}`}>
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link href={i.href} className={`flex items-center gap-3 px-3 py-2 rounded-md ${active ? 'bg-indigo-50 text-indigo-600' : 'text-white hover:bg-blue-800'}`}>
                    <span className="shrink-0"> <Icon name={i.icon} /> </span>
                    {!collapsed && <span className="text-sm font-medium">{i.label}</span>}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )

  // Mobile overlay nav: only visible when mobileOpen is true
  const mobileNav = mobileOpen ? (
    <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      <nav className="relative z-50 h-full w-[80%] bg-blue-900 border-r border-gray-100">
        <div className="h-full overflow-y-auto py-6 px-4">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="flex flex-col items-center gap-3">
              <Image src="/img/kiddiestrans.png" alt="Kiddies Check Logo" width={170} height={50} className="w-35 block rounded-md" />
            </Link>
            <button aria-label="Close menu" onClick={onClose} className="p-2 rounded-md text-red-600 hover:bg-gray-100">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <ul className="space-y-1">
              {items.map(i => {
                // Check if user has access to this item
                if (!hasAccess(i.roles)) return null;

                const active = pathname === i.href || pathname.startsWith(i.href + '/')
                const hasChildren = Array.isArray(i.children) && i.children.length > 0
                const isOpen = openKey === i.href
                // Filter children based on access
                const visibleChildren = hasChildren ? i.children.filter(c => hasAccess(c.roles)) : [];

                return (
                  <li key={i.href}>
                    {hasChildren ? (
                      <div>
                        <button onClick={() => toggleSub(i.href)} className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md ${active ? 'bg-indigo-50 text-blue-800' : 'text-white hover:bg-blue-900'}`}>
                          <span className="flex items-center gap-3">
                            <span className="shrink-0 text-white"> <Icon name={i.icon} /> </span>
                            <span className="text-sm font-medium">{i.label}</span>
                          </span>
                          <svg className={`w-4 h-4 text-white transition-transform ${isOpen ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor">
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 6l6 4-6 4V6z" />
                          </svg>
                        </button>

                        {/* Mobile submenu accordion */}
                        {isOpen && (
                          <ul className="mt-1 space-y-1 pl-6">
                            {i.children.map(c => (
                              <li key={c.href}>
                                <Link href={c.href} onClick={onClose} className={`block px-3 py-2 rounded-md text-sm ${pathname === c.href ? 'bg-indigo-50 text-indigo-600' : 'text-white hover:bg-blue-900'}`}>
                                  {c.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <Link href={i.href} onClick={onClose} className={`flex items-center gap-3 px-3 py-2 rounded-md ${active ? 'bg-indigo-50 text-indigo-600' : 'text-white hover:bg-blue-900'}`}>
                        <span className="shrink-0 text-white"> <Icon name={i.icon} /> </span>
                        <span className="text-sm font-medium">{i.label}</span>
                      </Link>
                    )}
                  </li>
                )
              })}
          </ul>
        </div>
      </nav>
    </div>
  ) : null

  return (
    <>
      {desktopNav}
      {mobileNav}
    </>
  )
}
