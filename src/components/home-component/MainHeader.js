"use client"
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MainHeader() {
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const panelRef = useRef(null)
  const router = useRouter()
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close on Escape or click outside
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onClick(e) {
      if (!panelRef.current || !btnRef.current) return
      if (open && !panelRef.current.contains(e.target) && !btnRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about-us', label: 'About Us' },
    { href: '/blog', label: 'Blog' },
    { href: '/contact-us', label: 'Contact Us' }
  ]
  const pathname = usePathname()

  // About submenu state/ref
  const [aboutOpen, setAboutOpen] = useState(false)
  const aboutRef = useRef(null)
  const mobileSubmenuRef = useRef(null)

  // Close about submenu on outside click or Escape
  useEffect(() => {
    function onDocClick(e) {
      if (!aboutRef.current) return
      // Don't close if clicking inside the mobile submenu
      if (mobileSubmenuRef.current && mobileSubmenuRef.current.contains(e.target)) return
      if (!aboutRef.current.contains(e.target)) setAboutOpen(false)
    }
    function onDocKey(e) {
      if (e.key === 'Escape') setAboutOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onDocKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onDocKey)
    }
  }, [])

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  const isActive = (href) => {
    if (!pathname) return false
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/') || pathname.startsWith(href)
  }

  return (
    <>
    <header className="w-full left-0 right-0 bg-white/60 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50 shadow-md">
      <div className="mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-23 md:h-27">
          {/* Logo */}
          <div className="flex items-center gap-3 p-1">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/img/kiddiestrans.png" alt="KiddiesCheck" width={170} height={50} className="w-[120px] md:w-[180px] block rounded-md" />
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex lg:items-center lg:space-x-6" ref={aboutRef}>
            {navLinks.map((l) => {
              if (l.label === 'About Us') {
                const submenu = [
                  { href: '/about-us', label: 'About Us' },
                  { href: '/gallery', label: 'Gallery' },
                ]

                return (
                  <div
                    key={l.href}
                    className="relative"
                    onMouseEnter={() => setAboutOpen(true)}
                    onMouseLeave={() => setAboutOpen(false)}
                  >
                    <button
                      aria-haspopup="menu"
                      aria-expanded={aboutOpen}
                      onClick={() => setAboutOpen(s => !s)}
                      className={`transition inline-flex items-center gap-2 ${isActive(l.href) ? 'text-blue-900 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}
                    >
                      {l.label}
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06-.02L10 10.672l3.71-3.484a.75.75 0 111.04 1.08l-4.24 3.99a.75.75 0 01-1.04 0l-4.24-3.99a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Dropdown */}
                    {aboutOpen && (
                      <div className="absolute left-0 mt-0 w-48 bg-white rounded-md shadow-lg py-2 z-40">
                        {submenu.map(si => (
                          <Link
                            key={si.href}
                            href={si.href}
                            className={`block px-4 py-2 text-sm ${isActive(si.href) ? 'text-blue-900 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            {si.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`transition ${isActive(l.href) ? 'text-blue-900 font-semibold' : 'text-gray-700 hover:text-gray-900'}`}
                >
                  {l.label}
                </Link>
              )
            })}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border border-gray-300">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="flex flex-col text-sm font-semibold text-gray-700">
                        {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.firstName}</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <Link href="/dashboard" className="block px-4 py-2 font-medium text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-300">
                      Dashboard
                    </Link>
                    {user?.role === 'admin' || user?.role === 'learning-specialist' ? (
                    <Link href="/dashboard/manage-registration" className="block px-4 py-2 font-medium text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-300">
                     Manage Applications
                    </Link>
                    ) : null}
                    <Link href="/dashboard/my-profile" className="block px-4 py-2 font-medium text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-300">
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout()
                        setDropdownOpen(false)
                      }}
                      className="block w-full text-left px-4 py-2 font-medium text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm font-semibold border border-blue-900 hover:border-blue-800 text-gray-900 hover:text-blue-950 rounded-md">Login</Link>
                <Link href="/register" className="px-4 py-2 bg-blue-900 text-white rounded-md text-sm font-medium hover:bg-blue-800">Register</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="lg:hidden flex items-center">
            <button
              ref={btnRef}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((s) => !s)}
              className="relative z-20 flex items-center justify-center w-11 h-11 rounded-lg bg-white/70 backdrop-blur border border-blue-200 shadow-sm"
            >
              <Menu size={24} className="text-blue-600" /> 
            </button>
          </div>
        </div>
      </div>
    </header>

    {/* Mobile panel (render only when open) */}
    {open && (
      <div ref={panelRef} className="fixed inset-0 z-50" aria-hidden={!open}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)}></div>

        <div className="absolute right-0 top-0 h-full w-80 max-w-full bg-white shadow-2xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Link href="/" className="flex items-center gap-3">
                <Image src="/img/kiddiestrans.png" alt="KiddiesCheck" width={100} height={50} className="w-[180px] block rounded-md" />
              </Link>
              <button onClick={() => setOpen(false)} className="text-red-600 text-2xl font-semibold">✕</button>
            </div>

            <nav className="flex flex-col space-y-3">
              {navLinks.map((l) => {
                if (l.label === 'About Us') {
                  const submenu = [
                    { href: '/about-us', label: 'About Us' },
                    { href: '/gallery', label: 'Gallery' },
                  ]

                  return (
                    <div key={l.href}>
                      <button
                        onClick={() => setAboutOpen(s => !s)}
                        className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 ${isActive(l.href) ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
                      >
                        {l.label}
                      </button>
                      {aboutOpen && (
                        <div ref={mobileSubmenuRef} className="pl-4 mt-1 flex flex-col gap-1">
                          {submenu.map(si => (
                            <Link key={si.href} href={si.href} onClick={() => {
                              setOpen(false)
                              setAboutOpen(false)
                            }} className={`block px-3 py-2 rounded-md ${isActive(si.href) ? 'text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                              {si.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`block px-3 py-2 rounded-md hover:bg-gray-50 ${isActive(l.href) ? 'text-blue-500 font-semibold' : 'text-gray-700'}`}
                  >
                    {l.label}
                  </Link>
                )
              })}
            </nav>
            <div className="mt-6 border-t pt-6 flex flex-col gap-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-3 bg-gray-50 rounded-lg mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border border-gray-300">
                      {user.avatar ? (
                        <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold text-gray-700">
                          {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="block text-center text-gray-700 border border-blue-500 rounded-md px-4 py-2 hover:text-blue-600">Dashboard</Link>
                  <Link href="/dashboard/my-profile" onClick={() => setOpen(false)} className="block text-center text-gray-700 border border-blue-500 rounded-md px-4 py-2 hover:text-blue-600">My Profile</Link>
                  <button onClick={() => {
                    logout()
                    setOpen(false)
                  }} className="block w-full bg-red-500 text-white px-4 py-2 rounded-md text-center hover:bg-red-600">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="block text-center text-gray-700 border border-blue-500 rounded-md px-4 py-2 hover:text-blue-600">Login</Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="block bg-blue-500 text-white px-4 py-2 rounded-md text-center">Register</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
