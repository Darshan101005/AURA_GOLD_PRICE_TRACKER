"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, TrendingUp, Wallet } from "lucide-react"

interface PriceData {
  product_name: string
  price_with_gst: number
  price_without_gst: number
  aura_buy_price: number
  aura_sell_price: number
  updated_at: string
}

interface Holding {
  id: string
  metalType: "gold" | "silver"
  grams: number
  addedAt: string
}

interface PortfolioTrackerProps {
  goldPrice: PriceData | null
  silverPrice: PriceData | null
}

export default function PortfolioTracker({ goldPrice, silverPrice }: PortfolioTrackerProps) {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [metalType, setMetalType] = useState<"gold" | "silver">("gold")
  const [grams, setGrams] = useState<string>("")
  const [mounted, setMounted] = useState(false)

  // Load holdings from localStorage on mount (client-side only)
  useEffect(() => {
    setMounted(true)
    const savedHoldings = localStorage.getItem("portfolio-holdings")
    if (savedHoldings) {
      try {
        setHoldings(JSON.parse(savedHoldings))
      } catch (error) {
        console.error("Failed to load holdings:", error)
      }
    }
  }, [])

  // Save holdings to localStorage whenever they change
  useEffect(() => {
    if (holdings.length > 0) {
      localStorage.setItem("portfolio-holdings", JSON.stringify(holdings))
    } else {
      localStorage.removeItem("portfolio-holdings")
    }
  }, [holdings])

  const addHolding = () => {
    const parsedGrams = Number.parseFloat(grams)
    if (isNaN(parsedGrams) || parsedGrams <= 0) {
      return
    }

    const newHolding: Holding = {
      id: Date.now().toString(),
      metalType,
      grams: parsedGrams,
      addedAt: new Date().toISOString(),
    }

    setHoldings([...holdings, newHolding])
    setGrams("")
  }

  const removeHolding = (id: string) => {
    setHoldings(holdings.filter((h) => h.id !== id))
  }

  const calculateHoldingValue = (holding: Holding): number => {
    const price = holding.metalType === "gold" ? goldPrice : silverPrice
    if (!price) return 0
    return holding.grams * price.aura_sell_price
  }

  const totalPortfolioValue = holdings.reduce((sum, holding) => {
    return sum + calculateHoldingValue(holding)
  }, 0)

  const goldHoldings = holdings.filter((h) => h.metalType === "gold")
  const silverHoldings = holdings.filter((h) => h.metalType === "silver")

  const totalGoldGrams = goldHoldings.reduce((sum, h) => sum + h.grams, 0)
  const totalSilverGrams = silverHoldings.reduce((sum, h) => sum + h.grams, 0)

  const totalGoldValue = goldHoldings.reduce((sum, h) => sum + calculateHoldingValue(h), 0)
  const totalSilverValue = silverHoldings.reduce((sum, h) => sum + calculateHoldingValue(h), 0)

  // Prevent hydration mismatch by not rendering until mounted on client
  if (!mounted) {
    return (
      <div className="space-y-6">
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <div className="text-slate-600 dark:text-slate-300">Loading...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Holding Card */}
      <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Holding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metal-type" className="text-slate-600 dark:text-slate-300">
              Metal Type
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={metalType === "gold" ? "default" : "outline"}
                onClick={() => setMetalType("gold")}
                className="flex-1"
              >
                Gold
              </Button>
              <Button
                type="button"
                variant={metalType === "silver" ? "default" : "outline"}
                onClick={() => setMetalType("silver")}
                className="flex-1"
              >
                Silver
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grams" className="text-slate-600 dark:text-slate-300">
              Quantity (grams)
            </Label>
            <Input
              id="grams"
              type="number"
              step="0.001"
              min="0"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              placeholder="e.g., 10"
              className="bg-white dark:bg-slate-900"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addHolding()
                }
              }}
            />
          </div>

          <Button onClick={addHolding} className="w-full" disabled={!grams || Number.parseFloat(grams) <= 0}>
            <Plus className="h-4 w-4 mr-2" />
            Add to Portfolio
          </Button>
        </CardContent>
      </Card>

      {/* Portfolio Summary Card */}
      <Card className="backdrop-blur-sm bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Portfolio Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-slate-900/40 rounded-lg">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Portfolio Value</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                  ₹{totalPortfolioValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>

            <Separator className="bg-slate-200 dark:bg-slate-600" />

            {/* Gold Summary */}
            {totalGoldGrams > 0 && (
              <div className="space-y-2 p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Gold Holdings</span>
                  <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    {totalGoldGrams.toFixed(3)}g
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Current Value</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    ₹{totalGoldValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </span>
                </div>
                {goldPrice && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Sell Price</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      ₹{goldPrice.aura_sell_price.toFixed(2)}/g
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Silver Summary */}
            {totalSilverGrams > 0 && (
              <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Silver Holdings</span>
                  <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {totalSilverGrams.toFixed(3)}g
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Current Value</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    ₹{totalSilverValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </span>
                </div>
                {silverPrice && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Sell Price</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      ₹{silverPrice.aura_sell_price.toFixed(2)}/g
                    </span>
                  </div>
                )}
              </div>
            )}

            {holdings.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No holdings added yet</p>
                <p className="text-xs mt-1">Add your first holding above to start tracking</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Holdings List Card */}
      {holdings.length > 0 && (
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-700 dark:text-slate-200">Your Holdings</CardTitle>
              <Badge variant="outline" className="text-xs">
                {holdings.length} {holdings.length === 1 ? "item" : "items"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {holdings.map((holding) => {
                const value = calculateHoldingValue(holding)
                const price = holding.metalType === "gold" ? goldPrice : silverPrice

                return (
                  <div
                    key={holding.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/70 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={holding.metalType === "gold" ? "default" : "secondary"}
                          className={
                            holding.metalType === "gold"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }
                        >
                          {holding.metalType.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {holding.grams.toFixed(3)}g
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          Added: {new Date(holding.addedAt).toLocaleDateString("en-IN")}
                        </span>
                        {price && (
                          <span>
                            @ ₹{price.aura_sell_price.toFixed(2)}/g
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                          ₹{value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Current Value</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeHolding(holding.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
