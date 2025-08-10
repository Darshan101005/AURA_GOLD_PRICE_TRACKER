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
  metal?: 'gold' | 'silver'
}

export default function PriceChart({ data, chartType = "line", metal = 'gold' }: PriceChartProps) {
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

  // Generate mock volume based on price movement
  const volumeData = sortedData.map(() => {
    return Math.floor(Math.random() * 500000) + 100000
  })

  const palette = metal === 'silver'
    ? {
        primary: 'rgb(148, 163, 184)', // slate-400
        primaryFillStrong: 'rgba(148, 163, 184, 0.8)',
        primaryFill: 'rgba(148, 163, 184, 0.3)',
        primaryLightFill: 'rgba(148, 163, 184, 0.1)',
        tooltipBorder: 'rgba(148, 163, 184, 0.5)',
      }
    : {
        primary: 'rgb(202, 138, 4)', // yellow-600
        primaryFillStrong: 'rgba(202, 138, 4, 0.8)',
        primaryFill: 'rgba(202, 138, 4, 0.3)',
        primaryLightFill: 'rgba(202, 138, 4, 0.1)',
        tooltipBorder: 'rgba(202, 138, 4, 0.5)',
      }

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
              label: "Price (₹/g)", // Generic label
              data: sortedData.map((item) => item.price_with_gst),
              borderColor: palette.primary,
              backgroundColor: palette.primaryFill,
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: palette.primary,
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
              backgroundColor: palette.primaryFillStrong,
              borderColor: palette.primary,
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
              label: "Trading Volume",
              data: volumeData,
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
              borderColor: palette.primary,
              backgroundColor: palette.primaryLightFill,
              borderWidth: 3,
              fill: false,
              tension: 0.4,
              pointBackgroundColor: palette.primary,
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
          borderColor: palette.tooltipBorder,
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

  // Candlestick chart removed

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
