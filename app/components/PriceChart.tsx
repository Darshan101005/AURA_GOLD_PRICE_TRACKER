"use client"

import { useRef } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Line, Bar } from "react-chartjs-2"
import { format } from "date-fns"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

interface PriceData {
  product_name: string
  price_with_gst: number
  price_without_gst: number
  aura_buy_price: number
  aura_sell_price: number
  updated_at: string
}

interface PriceChartProps {
  data: PriceData[]
  chartType?: string
}

export default function PriceChart({ data, chartType = "line" }: PriceChartProps) {
  const chartRef = useRef<ChartJS<"line" | "bar">>(null)

  if (!data || data.length === 0) {
    return (
      <div className="h-96 w-full flex items-center justify-center text-slate-500">
        <p>No data available to display chart</p>
      </div>
    )
  }

  // Sort data chronologically for chart
  const sortedData = [...data].sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())

  // Generate mock OHLC data for candlestick based on real price movements
  const candlestickData = sortedData.map((item, index) => {
    const prevPrice = index > 0 ? sortedData[index - 1].price_with_gst : item.price_with_gst
    const open = prevPrice
    const close = item.price_with_gst
    const high = Math.max(open, close, item.aura_buy_price)
    const low = Math.min(open, close, item.aura_sell_price)
    const volume = Math.floor(Math.random() * 500000) + 100000 // Mock volume

    return {
      ...item,
      open,
      high,
      low,
      close,
      volume,
    }
  })

  const getChartData = () => {
    const labels = sortedData.map((item) => {
      const date = new Date(item.updated_at)
      return format(date, sortedData.length > 50 ? "MMM dd" : "MMM dd, HH:mm")
    })

    switch (chartType) {
      case "area":
        return {
          labels,
          datasets: [
            {
              label: "Gold Price (₹/g)",
              data: sortedData.map((item) => item.price_with_gst),
              borderColor: "rgb(202, 138, 4)",
              backgroundColor: "rgba(202, 138, 4, 0.3)",
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: "rgb(202, 138, 4)",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        }

      case "bar":
        return {
          labels,
          datasets: [
            {
              label: "Price with GST (₹/g)",
              data: sortedData.map((item) => item.price_with_gst),
              backgroundColor: "rgba(202, 138, 4, 0.8)",
              borderColor: "rgb(202, 138, 4)",
              borderWidth: 1,
            },
            {
              label: "Buy Price (₹/g)",
              data: sortedData.map((item) => item.aura_buy_price),
              backgroundColor: "rgba(34, 197, 94, 0.8)",
              borderColor: "rgb(34, 197, 94)",
              borderWidth: 1,
            },
            {
              label: "Sell Price (₹/g)",
              data: sortedData.map((item) => item.aura_sell_price),
              backgroundColor: "rgba(239, 68, 68, 0.8)",
              borderColor: "rgb(239, 68, 68)",
              borderWidth: 1,
            },
          ],
        }

      case "volume":
        return {
          labels,
          datasets: [
            {
              label: "Trading Volume", // Changed from "Trading Volume (Simulated)"
              data: candlestickData.map((item) => item.volume),
              backgroundColor: "rgba(99, 102, 241, 0.8)",
              borderColor: "rgb(99, 102, 241)",
              borderWidth: 1,
            },
          ],
        }

      default: // line chart
        return {
          labels,
          datasets: [
            {
              label: "Price with GST (₹/g)",
              data: sortedData.map((item) => item.price_with_gst),
              borderColor: "rgb(202, 138, 4)",
              backgroundColor: "rgba(202, 138, 4, 0.1)",
              borderWidth: 3,
              fill: false,
              tension: 0.4,
              pointBackgroundColor: "rgb(202, 138, 4)",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
            {
              label: "Buy Price (₹/g)",
              data: sortedData.map((item) => item.aura_buy_price),
              borderColor: "rgb(34, 197, 94)",
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              borderWidth: 2,
              fill: false,
              tension: 0.4,
              pointBackgroundColor: "rgb(34, 197, 94)",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 5,
            },
            {
              label: "Sell Price (₹/g)",
              data: sortedData.map((item) => item.aura_sell_price),
              borderColor: "rgb(239, 68, 68)",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderWidth: 2,
              fill: false,
              tension: 0.4,
              pointBackgroundColor: "rgb(239, 68, 68)",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 5,
            },
          ],
        }
    }
  }

  const getChartOptions = () => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index" as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
              weight: "500",
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: "rgba(202, 138, 4, 0.5)",
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            title: (context: any) => {
              const dataIndex = context[0].dataIndex
              return format(new Date(sortedData[dataIndex].updated_at), "MMM dd, yyyy HH:mm")
            },
            label: (context: any) => {
              if (chartType === "volume") {
                return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`
              }
              return `${context.dataset.label}: ₹${context.parsed.y.toFixed(2)}`
            },
            afterBody: (context: any) => {
              const dataIndex = context[0].dataIndex
              const item = sortedData[dataIndex]
              return [`Product: ${item.product_name}`, `Without GST: ₹${item.price_without_gst.toFixed(2)}`]
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            maxTicksLimit: 8,
            font: {
              size: 11,
            },
          },
        },
        y: {
          display: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            callback: (value: any) => {
              if (chartType === "volume") {
                return value.toLocaleString()
              }
              return "₹" + value.toFixed(0)
            },
            font: {
              size: 11,
            },
          },
        },
      },
      elements: {
        point: {
          hoverBorderWidth: 3,
        },
      },
      animation: {
        duration: 1000,
        easing: "easeInOutQuart",
      },
    }

    return baseOptions
  }

  // Render candlestick chart
  if (chartType === "candlestick") {
    return <CandlestickChart data={candlestickData} />
  }

  const chartData = getChartData()
  const options = getChartOptions()

  return (
    <div className="h-96 w-full">
      {chartType === "bar" || chartType === "volume" ? (
        <Bar ref={chartRef as any} data={chartData} options={options} />
      ) : (
        <Line ref={chartRef as any} data={chartData} options={options} />
      )}
    </div>
  )
}

// Candlestick Chart Component
function CandlestickChart({ data }: { data: any[] }) {
  if (data.length === 0) {
    return (
      <div className="h-96 w-full flex items-center justify-center text-slate-500">
        No data available for candlestick chart
      </div>
    )
  }

  const maxPrice = Math.max(...data.map((d) => d.high))
  const minPrice = Math.min(...data.map((d) => d.low))
  const priceRange = maxPrice - minPrice || 1

  return (
    <div className="h-96 w-full p-4">
      <div className="h-full flex flex-col">
        <div className="flex-1 relative bg-slate-50 rounded-lg p-4">
          <svg width="100%" height="100%" className="overflow-visible">
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
              <g key={index}>
                <line
                  x1="0"
                  y1={`${ratio * 100}%`}
                  x2="100%"
                  y2={`${ratio * 100}%`}
                  stroke="rgba(0, 0, 0, 0.1)"
                  strokeWidth="1"
                />
                <text x="10" y={`${ratio * 100}%`} dy="0.3em" fill="#64748b" fontSize="12" fontWeight="500">
                  ₹{(maxPrice - ratio * priceRange).toFixed(0)}
                </text>
              </g>
            ))}

            {/* Candlesticks */}
            {data.map((candle, index) => {
              const x = (index / Math.max(data.length - 1, 1)) * 85 + 7.5 // 7.5% margin on each side
              const highY = ((maxPrice - candle.high) / priceRange) * 100
              const lowY = ((maxPrice - candle.low) / priceRange) * 100
              const openY = ((maxPrice - candle.open) / priceRange) * 100
              const closeY = ((maxPrice - candle.close) / priceRange) * 100

              const bodyTop = Math.min(openY, closeY)
              const bodyBottom = Math.max(openY, closeY)
              const bodyHeight = Math.abs(closeY - openY)

              const isGreen = candle.close >= candle.open
              const color = isGreen ? "#10b981" : "#ef4444"

              return (
                <g key={index}>
                  {/* High-Low Line */}
                  <line x1={`${x}%`} y1={`${highY}%`} x2={`${x}%`} y2={`${lowY}%`} stroke={color} strokeWidth="2" />

                  {/* Body Rectangle */}
                  <rect
                    x={`${x - 1}%`}
                    y={`${bodyTop}%`}
                    width="2%"
                    height={`${Math.max(bodyHeight, 0.5)}%`}
                    fill={isGreen ? color : "transparent"}
                    stroke={color}
                    strokeWidth="2"
                    rx="1"
                  />

                  {/* Hover Area */}
                  <rect x={`${x - 2}%`} y="0%" width="4%" height="100%" fill="transparent" className="cursor-pointer">
                    <title>
                      {format(new Date(candle.updated_at), "MMM dd, HH:mm")}
                      {"\n"}Open: ₹{candle.open.toFixed(2)}
                      {"\n"}High: ₹{candle.high.toFixed(2)}
                      {"\n"}Low: ₹{candle.low.toFixed(2)}
                      {"\n"}Close: ₹{candle.close.toFixed(2)}
                      {"\n"}Volume: {candle.volume.toLocaleString()}
                    </title>
                  </rect>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Time Labels */}
        <div className="flex justify-between mt-4 px-4">
          {data
            .filter((_, index) => index % Math.max(Math.ceil(data.length / 6), 1) === 0)
            .map((candle, index) => (
              <span key={index} className="text-xs font-medium text-slate-600">
                {format(new Date(candle.updated_at), "MMM dd")}
              </span>
            ))}
        </div>
      </div>
    </div>
  )
}
