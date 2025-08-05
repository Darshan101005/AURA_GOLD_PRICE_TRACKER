import { type NextRequest, NextResponse } from "next/server"

interface PriceData {
  product_name: string
  price_with_gst: number
  price_without_gst: number
  aura_buy_price: number
  aura_sell_price: number
  updated_at: string
}

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching data from external API...")

    const response = await fetch("https://webwatch.tech/aura_gold_prices.json", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; Aura-Gold-Dashboard/1.0)",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`External API error: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        {
          success: false,
          message: `External API returned ${response.status}: ${response.statusText}`,
          error: "EXTERNAL_API_ERROR",
        },
        { status: response.status },
      )
    }

    const contentType = response.headers.get("content-type")
    if (!contentType?.includes("application/json")) {
      console.error("Invalid content type:", contentType)
      return NextResponse.json(
        {
          success: false,
          message: "External API returned invalid content type",
          error: "INVALID_CONTENT_TYPE",
        },
        { status: 502 },
      )
    }

    const data: PriceData[] = await response.json()

    if (!Array.isArray(data)) {
      console.error("Invalid data format - not an array")
      return NextResponse.json(
        {
          success: false,
          message: "External API returned invalid data format",
          error: "INVALID_DATA_FORMAT",
        },
        { status: 502 },
      )
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
      console.error("Invalid data structure")
      return NextResponse.json(
        {
          success: false,
          message: "External API returned data with invalid structure",
          error: "INVALID_DATA_STRUCTURE",
        },
        { status: 502 },
      )
    }

    console.log(`Successfully fetched ${data.length} records`)

    return NextResponse.json({
      success: true,
      data: data,
      count: data.length,
      source: "https://webwatch.tech/aura_gold_prices.json",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("API Error:", error)

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to connect to external data source",
          error: "NETWORK_ERROR",
        },
        { status: 503 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error occurred",
        error: "INTERNAL_ERROR",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  if (action !== "fetch") {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid action parameter",
        error: "INVALID_ACTION",
      },
      { status: 400 },
    )
  }

  // For POST requests, just redirect to GET
  return GET(request)
}
