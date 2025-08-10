import { type NextRequest, NextResponse } from "next/server"

interface PriceData {
  product_name: string
  price_with_gst: number
  price_without_gst: number
  aura_buy_price: number
  aura_sell_price: number
  updated_at: string
}

// Base URLs for gold and silver data
const GOLD_API_URL = "https://webwatch.tech/aura_gold_prices.json"
const SILVER_API_URL = "https://webwatch.tech/aura_silver_prices.json"

// Fetch data from the external JSON endpoint
async function fetchPriceData(metal: string): Promise<PriceData[]> {
  let apiUrl = ""
  if (metal === "gold") {
    apiUrl = GOLD_API_URL
  } else if (metal === "silver") {
    apiUrl = SILVER_API_URL
  } else {
    throw new Error("Invalid metal type specified.")
  }

  try {
    console.log(`Fetching ${metal} data from external API: ${apiUrl}...`)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; Aura-Gold-Dashboard/1.0)",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`External API error for ${metal}: ${response.status} ${response.statusText}`)
      throw new Error(`External API returned ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type")
    if (!contentType?.includes("application/json")) {
      console.error(`Invalid content type for ${metal}:`, contentType)
      throw new Error("External API returned invalid content type")
    }

    const data: PriceData[] = await response.json()

    if (!Array.isArray(data)) {
      console.error(`Invalid data format for ${metal} - not an array`)
      throw new Error("External API returned invalid data format")
    }

    // Validate data structure
    const isValidData = data.every(
      (item) =>
        typeof item === "object" &&
        typeof item.product_name === "string" &&
        typeof item.price_with_gst === "number" &&
        typeof item.price_without_gst === "number" &&
        typeof item.aura_buy_price === "number" &&
        typeof item.aura_sell_price === "number" &&
        typeof item.updated_at === "string",
    )

    if (!isValidData) {
      console.error(`Invalid data structure for ${metal}`)
      throw new Error("External API returned data with invalid structure")
    }

    console.log(`Successfully fetched ${data.length} ${metal} records`)

    return data
  } catch (error) {
    console.error(`Error fetching from external API for ${metal}:`, error)
    throw error // Re-throw to be caught by the main handler
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")
  const timeframe = searchParams.get("timeframe") || "today"
  const startDate = searchParams.get("start_date")
  const endDate = searchParams.get("end_date")
  const metal = searchParams.get("metal") || "gold" // Default to gold

  try {
    console.log(`API GET request - action: ${action}, timeframe: ${timeframe}, metal: ${metal}`)

    // Fetch data from external endpoint based on metal type
    const allData = await fetchPriceData(metal)

    if (action === "data") {
      // Return filtered data
      const filteredData = filterDataByTimeframe(allData, timeframe, startDate || undefined, endDate || undefined)

      return NextResponse.json({
        success: true,
        data: filteredData,
        count: filteredData.length,
        source: metal === "gold" ? GOLD_API_URL : SILVER_API_URL,
        timestamp: new Date().toISOString(),
      })
    }

    // Default: return all data
    return NextResponse.json({
      success: true,
      data: allData,
      count: allData.length,
      source: metal === "gold" ? GOLD_API_URL : SILVER_API_URL,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in GET handler:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch price data",
        message: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")
  const metal = searchParams.get("metal") || "gold" // Default to gold

  try {
    console.log(`API POST request - action: ${action}, metal: ${metal}`)

    if (action === "fetch") {
      // Fetch latest data from external endpoint
      const latestData = await fetchPriceData(metal)

      if (latestData.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "No data available from source",
            timestamp: new Date().toISOString(),
          },
          { status: 500 },
        )
      }

      // Return the latest price (most recent entry)
      const sortedData = latestData.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      const latestPrice = sortedData[0]

      return NextResponse.json({
        success: true,
        message: "Latest price fetched successfully",
        data: latestPrice,
        total_records: latestData.length,
        source: metal === "gold" ? GOLD_API_URL : SILVER_API_URL,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action",
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("Error in POST handler:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch latest price",
        message: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// Filter data based on timeframe (moved from page.tsx to be reusable on server)
function filterDataByTimeframe(
  data: PriceData[],
  timeframe: string,
  startDate?: string,
  endDate?: string,
): PriceData[] {
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
          return itemDate >= new Date(startDate) && itemDate <= new Date(endDate + "T23:59:59")
        })
      }
      return data
    default:
      return data
  }

  return data.filter((item) => new Date(item.updated_at) >= filterDate)
}
