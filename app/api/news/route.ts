import { type NextRequest, NextResponse } from "next/server"

interface NewsArticle {
  source: {
    id: string | null
    name: string
  }
  author: string | null
  title: string
  description: string | null
  url: string
  urlToImage: string | null
  publishedAt: string
  content: string | null
}

interface NewsAPIResponse {
  status: string
  totalResults: number
  articles: NewsArticle[]
}

// Cache for storing news data
let newsCache: {
  data: NewsArticle[]
  timestamp: number
} | null = null

// Cache duration: 3 hours (to stay well under 100 requests/day limit)
const CACHE_DURATION = 3 * 60 * 60 * 1000 // 3 hours in milliseconds

export async function GET(request: NextRequest) {
  try {
    // Check if we have cached data that's still fresh
    if (newsCache && Date.now() - newsCache.timestamp < CACHE_DURATION) {
      console.log("Returning cached news data")
      return NextResponse.json({
        success: true,
        data: newsCache.data,
        cached: true,
        cachedAt: new Date(newsCache.timestamp).toISOString(),
      })
    }

    console.log("Fetching fresh news data from NewsAPI...")

    // Fetch news from NewsAPI.org
    const apiKey = "YOUR_NEWSAPI_KEY_HERE" // API KEY FROM NEWSAPI.ORG
    const query = "(gold OR silver) AND (price OR market OR commodity)"
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
    
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${from}&sortBy=publishedAt&language=en&apiKey=${apiKey}&pageSize=50`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Aura-Gold-Dashboard/1.0",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`NewsAPI error: ${response.status} ${response.statusText}`, errorData)
      
      // If we have cached data, return it even if expired
      if (newsCache) {
        console.log("Returning stale cached data due to API error")
        return NextResponse.json({
          success: true,
          data: newsCache.data,
          cached: true,
          cachedAt: new Date(newsCache.timestamp).toISOString(),
          warning: "Using cached data due to API error",
        })
      }
      
      return NextResponse.json(
        {
          success: false,
          message: `NewsAPI returned ${response.status}: ${response.statusText}`,
          error: "NEWS_API_ERROR",
        },
        { status: response.status },
      )
    }

    const data: NewsAPIResponse = await response.json()

    if (data.status !== "ok") {
      throw new Error("NewsAPI returned non-ok status")
    }

    // Filter articles to ensure they're relevant to gold/silver
    const relevantArticles = data.articles.filter((article) => {
      const text = `${article.title} ${article.description || ""}`.toLowerCase()
      return (
        (text.includes("gold") || text.includes("silver")) &&
        (text.includes("price") || 
         text.includes("market") || 
         text.includes("commodity") ||
         text.includes("precious metal") ||
         text.includes("trading"))
      )
    })

    // Update cache
    newsCache = {
      data: relevantArticles,
      timestamp: Date.now(),
    }

    console.log(`Successfully fetched ${relevantArticles.length} relevant news articles`)

    return NextResponse.json({
      success: true,
      data: relevantArticles,
      cached: false,
      totalResults: data.totalResults,
      filteredCount: relevantArticles.length,
    })
  } catch (error) {
    console.error("Error fetching news:", error)
    
    // If we have cached data, return it even if expired
    if (newsCache) {
      console.log("Returning stale cached data due to error")
      return NextResponse.json({
        success: true,
        data: newsCache.data,
        cached: true,
        cachedAt: new Date(newsCache.timestamp).toISOString(),
        warning: "Using cached data due to error",
      })
    }
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch news",
        error: "INTERNAL_ERROR",
      },
      { status: 500 },
    )
  }
}
