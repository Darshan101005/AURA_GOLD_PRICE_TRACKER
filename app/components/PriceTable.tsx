"use client"

import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Minus, Download } from "lucide-react"

interface PriceData {
  product_name: string
  price_with_gst: number
  price_without_gst: number
  aura_buy_price: number
  aura_sell_price: number
  updated_at: string
}

interface PriceTableProps {
  data: PriceData[]
}

export default function PriceTable({ data }: PriceTableProps) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-slate-500">No price data available</div>
  }

  // Sort data by date (newest first)
  const sortedData = [...data].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  const exportTableToCSV = () => {
    const headers = ["Date", "Time", "Product", "Price (₹/g)", "Price (₹/10g)", "Buy Price", "Sell Price", "Change"]
    const csvData = sortedData.map((item, index) => {
      const previousItem = sortedData[index + 1]
      const priceChange = previousItem
        ? getPriceChange(item.price_with_gst, previousItem.price_with_gst)
        : { change: 0, type: "neutral" }

      return [
        format(new Date(item.updated_at), "yyyy-MM-dd"),
        format(new Date(item.updated_at), "HH:mm:ss"),
        item.product_name,
        item.price_with_gst.toFixed(2),
        (item.price_with_gst * 10).toFixed(2),
        item.aura_buy_price.toFixed(2),
        item.aura_sell_price.toFixed(2),
        `${priceChange.change >= 0 ? "+" : ""}${priceChange.change.toFixed(2)}`,
      ]
    })

    const csvContent = [headers, ...csvData].map((row) => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `aura-gold-table-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getPriceChange = (currentPrice: number, previousPrice: number) => {
    const change = currentPrice - previousPrice
    if (Math.abs(change) < 0.01) return { change: 0, type: "neutral" }
    return {
      change: change,
      type: change > 0 ? "increase" : "decrease",
    }
  }

  return (
    <div className="overflow-x-auto">
      {/* Export Button */}
      <div className="flex justify-end mb-4">
        <Button onClick={exportTableToCSV} variant="outline" size="sm" className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Export Table
        </Button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="text-left p-3 font-semibold text-slate-700">Date & Time</th>
              <th className="text-left p-3 font-semibold text-slate-700">Product</th>
              <th className="text-right p-3 font-semibold text-slate-700">Price (₹/g)</th>
              <th className="text-right p-3 font-semibold text-slate-700">Price (₹/10g)</th>
              <th className="text-right p-3 font-semibold text-slate-700">Buy Price</th>
              <th className="text-right p-3 font-semibold text-slate-700">Sell Price</th>
              <th className="text-center p-3 font-semibold text-slate-700">Change</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => {
              const previousItem = sortedData[index + 1]
              const priceChange = previousItem
                ? getPriceChange(item.price_with_gst, previousItem.price_with_gst)
                : { change: 0, type: "neutral" }

              return (
                <tr
                  key={`${item.updated_at}-${index}`}
                  className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors duration-200"
                >
                  <td className="p-3">
                    <div className="space-y-1">
                      <div className="font-medium text-slate-900">
                        {format(new Date(item.updated_at), "MMM dd, yyyy")}
                      </div>
                      <div className="text-xs text-slate-500">{format(new Date(item.updated_at), "hh:mm a")}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-slate-700 text-xs">{item.product_name}</div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="font-semibold text-slate-900">₹{item.price_with_gst.toFixed(2)}</div>
                    <div className="text-xs text-slate-500">₹{item.price_without_gst.toFixed(2)} (ex-GST)</div>
                  </td>
                  <td className="p-3 text-right font-semibold text-slate-900">
                    ₹{(item.price_with_gst * 10).toFixed(2)}
                  </td>
                  <td className="p-3 text-right">
                    <span className="font-medium text-green-600">₹{item.aura_buy_price.toFixed(2)}</span>
                  </td>
                  <td className="p-3 text-right">
                    <span className="font-medium text-red-600">₹{item.aura_sell_price.toFixed(2)}</span>
                  </td>
                  <td className="p-3 text-center">
                    {priceChange.type === "neutral" ? (
                      <Badge variant="secondary" className="gap-1">
                        <Minus className="h-3 w-3" />
                        No Change
                      </Badge>
                    ) : (
                      <Badge variant={priceChange.type === "increase" ? "default" : "destructive"} className="gap-1">
                        {priceChange.type === "increase" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        ₹{Math.abs(priceChange.change).toFixed(2)}
                      </Badge>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
