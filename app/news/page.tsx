"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, ArrowLeft, AlertCircle, Newspaper, ExternalLink, Calendar, TrendingUp } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

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

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isCached, setIsCached] = useState(false)

  const fetchNews = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/news")
      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        setArticles(result.data)
        setLastUpdate(new Date())
        setIsCached(result.cached || false)
      } else {
        throw new Error(result.message || "Failed to fetch news data")
      }
    } catch (err) {
      console.error("Error fetching news:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
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
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
                  <Newspaper className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                  Market News
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  Latest gold & silver market updates
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {lastUpdate && (
                <div className="hidden sm:flex flex-col items-end text-xs text-slate-600 dark:text-slate-400">
                  <span>Updated {lastUpdate.toLocaleTimeString("en-IN")}</span>
                  {isCached && <span className="text-amber-600 dark:text-amber-400">Cached data</span>}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchNews}
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
        {/* Info Banner */}
        <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="flex items-start gap-3 py-4">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                News updates refresh every 3 hours to stay within API limits
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Showing the latest news about gold and silver prices from trusted sources
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="flex items-center gap-2 py-4">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && articles.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <RefreshCw className="h-10 w-10 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
              <p className="text-slate-600 dark:text-slate-300">Loading latest news...</p>
            </div>
          </div>
        )}

        {/* Articles Grid */}
        {!loading && articles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                Latest Articles
              </h2>
              <Badge variant="outline" className="text-xs">
                {articles.length} articles
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map((article, index) => (
                <Card
                  key={`${article.url}-${index}`}
                  className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] flex flex-col"
                >
                  {article.urlToImage && (
                    <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                      <img
                        src={article.urlToImage}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {article.source.name}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100 line-clamp-3">
                      {article.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 flex-1">
                      {article.description || "No description available"}
                    </p>
                    {article.author && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        By {article.author}
                      </p>
                    )}
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      Read full article
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Articles State */}
        {!loading && articles.length === 0 && !error && (
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
            <CardContent className="py-16">
              <div className="text-center space-y-4">
                <Newspaper className="h-16 w-16 mx-auto text-slate-400 dark:text-slate-500" />
                <div>
                  <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                    No news articles available
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Check back later for the latest market updates
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
