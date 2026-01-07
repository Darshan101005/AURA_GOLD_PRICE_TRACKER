"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, ArrowLeft, AlertCircle, TrendingUp, Activity } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import PortfolioTracker from "../components/PortfolioTracker"
import Link from "next/link"

interface PriceData {
  product_name: string
  price_with_gst: number
  price_without_gst: number
  aura_buy_price: number
  aura_sell_price: number
  updated_at: string
}

export default function PortfolioPage() {
  const [goldPrice, setGoldPrice] = useState<PriceData | null>(null)
  const [silverPrice, setSilverPrice] = useState<PriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchPrices = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/gold-prices")
      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        const goldData = result.data.find((item: PriceData) => item.product_name.toLowerCase().includes("gold"))
        const silverData = result.data.find((item: PriceData) => item.product_name.toLowerCase().includes("silver"))

        setGoldPrice(goldData || null)
        setSilverPrice(silverData || null)
        setLastUpdate(new Date())
      } else {
        throw new Error(result.message || "Failed to fetch price data")
      }
    } catch (err) {
      console.error("Error fetching prices:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrices()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPrices, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Portfolio Tracker
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  Track your gold & silver holdings in real-time
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {lastUpdate && (
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <Activity className="h-3 w-3" />
                  <span>Updated {lastUpdate.toLocaleTimeString("en-IN")}</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPrices}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Prices Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Gold Price Card */}
          <Card className="backdrop-blur-sm bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Gold Sell Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-amber-600 dark:text-amber-400" />
                  <span className="text-slate-600 dark:text-slate-400">Loading...</span>
                </div>
              ) : goldPrice ? (
                <div>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                    ₹{goldPrice.aura_sell_price.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">per gram</p>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Silver Price Card */}
          <Card className="backdrop-blur-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Silver Sell Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-slate-600 dark:text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Loading...</span>
                </div>
              ) : silverPrice ? (
                <div>
                  <p className="text-3xl font-bold text-slate-700 dark:text-slate-200">
                    ₹{silverPrice.aura_sell_price.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">per gram</p>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="flex items-center gap-2 py-4">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Tracker Component */}
        {!loading && (
          <PortfolioTracker goldPrice={goldPrice} silverPrice={silverPrice} />
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <RefreshCw className="h-10 w-10 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
              <p className="text-slate-600 dark:text-slate-300">Loading portfolio tracker...</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-slate-600 dark:text-slate-400 text-sm">
        <p className="flex items-center justify-center gap-1">
          Made with <span className="text-red-500">❤️</span> by Darshan
        </p>
        <p className="mt-1">&copy; 2025 Aura Digital Gold Dashboard. All rights reserved.</p>
      </footer>
    </div>
  )
}
