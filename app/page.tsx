"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  CalendarIcon,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Download,
  LineChart,
  BarChart3,
  Activity,
  BarChart,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"
import PriceChart from "./components/PriceChart"
import PriceTable from "./components/PriceTable"
import GoldCalculator from "./components/GoldCalculator"
import { cn } from "@/lib/utils"

interface PriceData {
  product_name: string
  price_with_gst: number
  price_without_gst: number
  aura_buy_price: number
  aura_sell_price: number
  updated_at: string
}

const timeframes = [
  { id: "30min", label: "30 Min" },
  { id: "hour", label: "1 Hour" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "1 Week" },
  { id: "month", label: "1 Month" },
  { id: "year", label: "1 Year" },
  { id: "all", label: "All Time" },
  { id: "custom", label: "Custom" },
]

const chartTypes = [
  { id: "area", label: "Area Chart", icon: Activity },
  { id: "line", label: "Line Chart", icon: LineChart },
  { id: "bar", label: "Bar Chart", icon: BarChart },
  { id: "volume", label: "Volume Chart", icon: BarChart3 },
]

export default function Dashboard() {
  const [selectedMetal, setSelectedMetal] = useState<"gold" | "silver">("gold")
  const [allPriceData, setAllPriceData] = useState<PriceData[]>([])
  const [filteredPriceData, setFilteredPriceData] = useState<PriceData[]>([])
  const [latestPrice, setLatestPrice] = useState<PriceData | null>(null)
  const [activeTimeframe, setActiveTimeframe] = useState("today")
  const [showTable, setShowTable] = useState(true)
  const [loading, setLoading] = useState(true)
  const [customStartDate, setCustomStartDate] = useState<Date>()
  const [customEndDate, setCustomEndDate] = useState<Date>()
  const [chartType, setChartType] = useState("area")
  const [error, setError] = useState<string | null>(null)

  // Client-side filter function (for custom date range and initial display)
  const filterDataByTimeframeClient = (
    data: PriceData[],
    timeframe: string,
    startDate?: Date,
    endDate?: Date,
  ): PriceData[] => {
    if (!data || data.length === 0) return []

    const now = new Date()
    let filterDate: Date

    switch (timeframe) {
      case "30min":
        filterDate = new Date(now.getTime() - 30 * 60 * 1000)
        break
      case "hour":
        filterDate = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case "today":
        filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case "yesterday": {
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
        return data.filter((item) => {
          const d = new Date(item.updated_at)
          return d >= startOfYesterday && d <= endOfYesterday
        })
      }
      case "week":
        filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "month":
        filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "year":
        filterDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      case "all":
        return data
      case "custom":
        if (startDate && endDate) {
          return data.filter((item) => {
            const itemDate = new Date(item.updated_at)
            return (
              itemDate >= startDate &&
              itemDate <= new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59)
            )
          })
        }
        return data
      default:
        return data
    }

    return data.filter((item) => new Date(item.updated_at) >= filterDate)
  }

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ metal: selectedMetal })
      const response = await fetch(`/api/prices?${params}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || "Failed to load data")
      }

      const data = result.data || []

      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received")
      }

      const sortedData = data.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

      setAllPriceData(sortedData)
      setLatestPrice(sortedData[0] || null)

      const filtered = filterDataByTimeframeClient(sortedData, activeTimeframe, customStartDate, customEndDate)
      setFilteredPriceData(filtered)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      setAllPriceData([])
      setFilteredPriceData([])
      setLatestPrice(null)
    } finally {
      setLoading(false)
    }
  }

  // Handle timeframe change
  const handleTimeframeChange = (timeframe: string) => {
    setActiveTimeframe(timeframe)
    if (timeframe !== "custom") {
      const filtered = filterDataByTimeframeClient(allPriceData, timeframe)
      setFilteredPriceData(filtered)
    }
  }

  // Handle custom date range
  const handleCustomDateSubmit = () => {
    if (customStartDate && customEndDate) {
      const filtered = filterDataByTimeframeClient(allPriceData, "custom", customStartDate, customEndDate)
      setFilteredPriceData(filtered)
    }
  }

  // Calculate price change
  const priceChange = (() => {
    if (filteredPriceData.length < 2) return 0
    const sorted = [...filteredPriceData].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    return sorted[0].price_with_gst - sorted[1].price_with_gst
  })()

  // Export to CSV
  const exportToCSV = () => {
    if (filteredPriceData.length === 0) return

    const headers = [
      "Date",
      "Time",
      "Product Name",
      "Price (₹/g)",
      "Price (₹/10g)",
      "Buy Price",
      "Sell Price",
      "Price without GST",
    ]

    const csvData = filteredPriceData.map((item) => [
      format(new Date(item.updated_at), "yyyy-MM-dd"),
      format(new Date(item.updated_at), "HH:mm:ss"),
      item.product_name,
      item.price_with_gst.toFixed(2),
      (item.price_with_gst * 10).toFixed(2),
      item.aura_buy_price.toFixed(2),
      item.aura_sell_price.toFixed(2),
      item.price_without_gst.toFixed(2),
    ])

    const csvContent = [headers, ...csvData].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `aura-${selectedMetal}-prices-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Initial data fetch and auto-refresh
  useEffect(() => {
    fetchData()

    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [selectedMetal])

  // Update filtered data when allPriceData or timeframe changes
  useEffect(() => {
    if (allPriceData.length > 0) {
      const filtered = filterDataByTimeframeClient(allPriceData, activeTimeframe, customStartDate, customEndDate)
      setFilteredPriceData(filtered)
    }
  }, [allPriceData, activeTimeframe, customStartDate, customEndDate])

  const metalColors = {
    gold: {
      gradient: "from-yellow-600 to-yellow-500",
      text: "text-yellow-600",
      buttonBg: "bg-yellow-600 hover:bg-yellow-700",
      spinner: "text-yellow-600",
    },
    silver: {
      gradient: "from-slate-500 to-slate-400",
      text: "text-slate-600",
      buttonBg: "bg-slate-500 hover:bg-slate-600",
      spinner: "text-slate-600",
    },
  }

  const currentColors = metalColors[selectedMetal]

  // Derived stats: today's and all-time high/low with timestamps
  const { todayHigh, todayLow, allTimeHigh, allTimeLow } = useMemo(() => {
    const result = {
      todayHigh: null as null | PriceData,
      todayLow: null as null | PriceData,
      allTimeHigh: null as null | PriceData,
      allTimeLow: null as null | PriceData,
    }

    if (!allPriceData || allPriceData.length === 0) return result

    // All-time
    result.allTimeHigh = allPriceData.reduce((max, curr) =>
      !max || curr.price_with_gst > max.price_with_gst ? curr : max,
    null as null | PriceData)
    result.allTimeLow = allPriceData.reduce((min, curr) =>
      !min || curr.price_with_gst < min.price_with_gst ? curr : min,
    null as null | PriceData)

    // Today (local time)
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    const todayData = allPriceData.filter((item) => {
      const d = new Date(item.updated_at)
      return d >= startOfToday && d <= endOfToday
    })

    if (todayData.length > 0) {
      result.todayHigh = todayData.reduce((max, curr) =>
        !max || curr.price_with_gst > max.price_with_gst ? curr : max,
      null as null | PriceData)
      result.todayLow = todayData.reduce((min, curr) =>
        !min || curr.price_with_gst < min.price_with_gst ? curr : min,
      null as null | PriceData)
    }

    return result
  }, [allPriceData])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1
            className={cn(
              "text-4xl font-bold bg-clip-text text-transparent",
              `bg-gradient-to-r ${currentColors.gradient}`,
            )}
          >
            Aura Digital {selectedMetal === "gold" ? "Gold 24K" : "Silver"}
          </h1>
          <p className="text-slate-600">Real-time {selectedMetal} price tracking dashboard</p>
          {!loading && !error && (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Live Data • Auto-refresh every 5 minutes
            </div>
          )}
        </div>

        {/* Metal Toggle */}
        <div className="flex justify-center mb-6">
          <ToggleGroup
            type="single"
            value={selectedMetal}
            onValueChange={(value: "gold" | "silver") => {
              if (value) {
                setSelectedMetal(value)
                setActiveTimeframe("today")
                setCustomStartDate(undefined)
                setCustomEndDate(undefined)
              }
            }}
            className="bg-white/80 rounded-lg shadow-xl p-1"
          >
            <ToggleGroupItem
              value="gold"
              aria-label="Toggle Gold"
              className="px-6 py-2 text-lg font-semibold data-[state=on]:bg-yellow-600 data-[state=on]:text-white data-[state=on]:shadow-md"
            >
              Gold
            </ToggleGroupItem>
            <ToggleGroupItem
              value="silver"
              aria-label="Toggle Silver"
              className="px-6 py-2 text-lg font-semibold data-[state=on]:bg-slate-500 data-[state=on]:text-white data-[state=on]:shadow-md"
            >
              Silver
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="backdrop-blur-sm bg-red-50/80 border-red-200 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Unable to load price data</p>
                  <p className="text-sm text-red-500 mt-1">{error}</p>
                  <Button
                    onClick={fetchData}
                    size="sm"
                    variant="outline"
                    className="mt-2 text-red-600 border-red-300 bg-transparent"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Latest Price Card */
        }
        {latestPrice && !loading && (
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-700">
                  Latest {selectedMetal === "gold" ? "Gold" : "Silver"} Price
                </CardTitle>
                <Button
                  onClick={fetchData}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                  className="gap-2 bg-transparent"
                >
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-3xl font-bold", currentColors.text)}>
                      ₹{latestPrice.price_with_gst.toFixed(2)}
                    </span>
                    <span className="text-sm text-slate-500">/gram</span>
                    {priceChange !== 0 && (
                      <Badge variant={priceChange > 0 ? "default" : "destructive"} className="gap-1">
                        {priceChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}₹
                        {Math.abs(priceChange).toFixed(2)}
                      </Badge>
                    )}
                  </div>
                  <div className="text-2xl font-semibold text-slate-700">
                    ₹{(latestPrice.price_with_gst * 10).toFixed(2)} <span className="text-sm font-normal">/10g</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Buy Price:</span>
                    <span className="font-semibold text-green-600">₹{latestPrice.aura_buy_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Sell Price:</span>
                    <span className="font-semibold text-red-600">₹{latestPrice.aura_sell_price.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-sm text-slate-500">Last Updated</div>
                  <div className="font-medium text-slate-700">
                    {format(new Date(latestPrice.updated_at), "MMM dd, yyyy")}
                  </div>
                  <div className="text-sm text-slate-500">{format(new Date(latestPrice.updated_at), "hh:mm a")}</div>
                </div>
              </div>

              {/* High/Low Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="rounded-lg border border-yellow-100 bg-yellow-50/50 p-4">
                  <div className="text-sm font-semibold text-yellow-800 mb-2">Today's Range</div>
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div>
                      <div className="text-slate-500">High</div>
                      <div className="font-medium text-slate-800">
                        {todayHigh ? `₹${todayHigh.price_with_gst.toFixed(2)}` : "—"}
                      </div>
                      <div className="text-slate-500">
                        {todayHigh ? format(new Date(todayHigh.updated_at), "hh:mm a") : ""}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Low</div>
                      <div className="font-medium text-slate-800">
                        {todayLow ? `₹${todayLow.price_with_gst.toFixed(2)}` : "—"}
                      </div>
                      <div className="text-slate-500">
                        {todayLow ? format(new Date(todayLow.updated_at), "hh:mm a") : ""}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-700 mb-2">All‑Time Records</div>
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div>
                      <div className="text-slate-500">Highest</div>
                      <div className="font-medium text-slate-800">
                        {allTimeHigh ? `₹${allTimeHigh.price_with_gst.toFixed(2)}` : "—"}
                      </div>
                      <div className="text-slate-500">
                        {allTimeHigh ? `${format(new Date(allTimeHigh.updated_at), "MMM dd, yyyy")} • ${format(new Date(allTimeHigh.updated_at), "hh:mm a")}` : ""}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Lowest</div>
                      <div className="font-medium text-slate-800">
                        {allTimeLow ? `₹${allTimeLow.price_with_gst.toFixed(2)}` : "—"}
                      </div>
                      <div className="text-slate-500">
                        {allTimeLow ? `${format(new Date(allTimeLow.updated_at), "MMM dd, yyyy")} • ${format(new Date(allTimeLow.updated_at), "hh:mm a")}` : ""}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gold Calculator */}
        {latestPrice && !loading && <GoldCalculator latestPrice={latestPrice} metalType={selectedMetal} />}

        {/* Chart Controls */}
        {!loading && (
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
                {/* Timeframe Tabs */}
                <div className="flex flex-wrap gap-2">
                  {timeframes.map((timeframe) => (
                    <Button
                      key={timeframe.id}
                      onClick={() => handleTimeframeChange(timeframe.id)}
                      variant={activeTimeframe === timeframe.id ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "transition-all duration-200",
                        activeTimeframe === timeframe.id && currentColors.buttonBg,
                      )}
                    >
                      {timeframe.label}
                    </Button>
                  ))}
                </div>

                {/* Chart Type Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">Chart Type:</span>
                  <div className="flex gap-1">
                    {chartTypes.map((type) => (
                      <Button
                        key={type.id}
                        onClick={() => setChartType(type.id)}
                        variant={chartType === type.id ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "transition-all duration-200 gap-2",
                          chartType === type.id && "bg-blue-600 hover:bg-blue-700",
                        )}
                        title={type.label}
                      >
                        <type.icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{type.label.split(" ")[0]}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Export Button */}
                <Button
                  onClick={exportToCSV}
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                  disabled={filteredPriceData.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>

              {/* Custom Date Range */}
              {activeTimeframe === "custom" && (
                <div className="flex flex-wrap gap-4 items-center p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">From:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                          <CalendarIcon className="h-4 w-4" />
                          {customStartDate ? format(customStartDate, "MMM dd, yyyy") : "Start Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={customStartDate} onSelect={setCustomStartDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">To:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                          <CalendarIcon className="h-4 w-4" />
                          {customEndDate ? format(customEndDate, "MMM dd, yyyy") : "End Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={customEndDate} onSelect={setCustomEndDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button
                    onClick={handleCustomDateSubmit}
                    disabled={!customStartDate || !customEndDate}
                    size="sm"
                    className={currentColors.buttonBg}
                  >
                    Apply Filter
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Chart */}
        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-700">
                {selectedMetal === "gold" ? "Gold" : "Silver"} Price Trend -{" "}
                {chartTypes.find((t) => t.id === chartType)?.label}
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  {filteredPriceData.length} data points
                </Badge>
                <Button onClick={() => setShowTable(!showTable)} variant="outline" size="sm">
                  {showTable ? "Hide Table" : "Show Table"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <RefreshCw className={cn("h-8 w-8 animate-spin mx-auto", currentColors.spinner)} />
                  <p className="text-slate-600">Loading price data...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64 text-slate-500">
                <div className="text-center space-y-2">
                  <AlertCircle className="h-12 w-12 mx-auto text-slate-400" />
                  <p>Unable to load chart data</p>
                </div>
              </div>
              ) : filteredPriceData.length > 0 ? (
              <PriceChart data={filteredPriceData} chartType={chartType} metal={selectedMetal} />
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-500">
                <div className="text-center space-y-2">
                  <BarChart3 className="h-12 w-12 mx-auto text-slate-400" />
                  <p>No data available for the selected timeframe</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Price Table */}
        {showTable && !loading && (
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-700">
                  Historical {selectedMetal === "gold" ? "Gold" : "Silver"} Prices
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  Showing {filteredPriceData.length} records
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="flex items-center justify-center h-32 text-slate-500">
                  <div className="text-center space-y-2">
                    <AlertCircle className="h-8 w-8 mx-auto text-slate-400" />
                    <p>Unable to load table data</p>
                  </div>
                </div>
              ) : (
                <PriceTable data={filteredPriceData} />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-slate-600 text-sm">
        <p className="flex items-center justify-center gap-1">
          Made with <span className="text-red-500">❤️</span> by Darshan
        </p>
        <p className="mt-1">&copy; 2025 Aura Digital Gold Dashboard. All rights reserved.</p>
      </footer>
    </div>
  )
}
