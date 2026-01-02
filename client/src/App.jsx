import { Routes, Route, NavLink } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import {
  LayoutDashboard,
  Building2,
  Landmark,
  UserCircle,
  TrendingUp,
  Bell,
  Menu,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap
} from 'lucide-react'

import Dashboard from './pages/Dashboard'
import Institutions from './pages/Institutions'
import Congress from './pages/Congress'
import Insider from './pages/Insider'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/institutions', icon: Building2, label: 'Institutions' },
  { to: '/congress', icon: Landmark, label: 'Congress' },
  { to: '/insider', icon: UserCircle, label: 'Insider' },
]

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [connected, setConnected] = useState(false)
  const notificationRef = useRef(null)

  // Close notification panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // In production, connect to same origin; in dev, connect to localhost:3001
    const socketUrl = import.meta.env.PROD ? window.location.origin : 'http://localhost:3001'
    const socket = io(socketUrl)

    socket.on('connect', () => {
      setConnected(true)
      console.log('Connected to server')
      // Add connection notification
      addNotification({
        type: 'system',
        title: 'Connected to NJ Trades',
        message: 'Real-time updates enabled',
        icon: 'zap'
      })
    })

    socket.on('disconnect', () => {
      setConnected(false)
      console.log('Disconnected from server')
    })

    socket.on('update', (data) => {
      console.log('Received update:', data)
      if (data.type === 'insider' && data.data?.length > 0) {
        addNotification({
          type: 'insider',
          title: 'New Insider Trade',
          message: `${data.data.length} new Form 4 filings detected`,
          icon: 'insider'
        })
      } else if (data.type === 'congress' && data.data?.length > 0) {
        addNotification({
          type: 'congress',
          title: 'Congress Trade Alert',
          message: `${data.data.length} new congressional trades`,
          icon: 'congress'
        })
      } else if (data.type === '13f') {
        addNotification({
          type: '13f',
          title: '13F Update',
          message: 'Institutional holdings updated',
          icon: 'institution'
        })
      }
    })

    // Add some initial demo notifications
    setTimeout(() => {
      addNotification({
        type: 'insider',
        title: 'Insider Buy Alert',
        message: 'Multiple insiders buying NVDA',
        icon: 'buy'
      })
    }, 3000)

    setTimeout(() => {
      addNotification({
        type: 'congress',
        title: 'Pelosi Trade Detected',
        message: 'Nancy Pelosi purchased GOOGL calls',
        icon: 'congress'
      })
    }, 6000)

    return () => socket.disconnect()
  }, [])

  function addNotification(notif) {
    setNotifications(prev => [
      { ...notif, id: Date.now(), time: new Date() },
      ...prev.slice(0, 19) // Keep last 20
    ])
  }

  function clearNotifications() {
    setNotifications([])
    setNotificationOpen(false)
  }

  function formatTime(date) {
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString()
  }

  function getNotificationIcon(type) {
    switch (type) {
      case 'buy':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />
      case 'sell':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />
      case 'congress':
        return <Landmark className="h-4 w-4 text-purple-500" />
      case 'insider':
        return <UserCircle className="h-4 w-4 text-orange-500" />
      case 'institution':
        return <Building2 className="h-4 w-4 text-blue-500" />
      case 'zap':
        return <Zap className="h-4 w-4 text-yellow-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <TrendingUp className="h-8 w-8 text-primary-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">NJ Trades</span>
                <span className="hidden sm:inline text-xs text-gray-400 ml-2">LIVE</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Status & Notifications */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-500 hidden sm:block">
                  {connected ? 'Live' : 'Offline'}
                </span>
              </div>

              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-bounce">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                    <div className="px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-5 w-5" />
                        <span className="font-semibold">Notifications</span>
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearNotifications}
                          className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No notifications yet</p>
                          <p className="text-xs text-gray-400">Trade alerts will appear here</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="mt-1 p-1.5 bg-gray-100 rounded-lg">
                                {getNotificationIcon(notif.icon)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                                <p className="text-sm text-gray-500 truncate">{notif.message}</p>
                                <div className="flex items-center space-x-1 mt-1">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-400">{formatTime(notif.time)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                        <p className="text-xs text-center text-gray-500">
                          Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/institutions" element={<Institutions />} />
          <Route path="/congress" element={<Congress />} />
          <Route path="/insider" element={<Insider />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            NJ Trades - Real-time data from SEC EDGAR, House & Senate Disclosures. Not financial advice.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
