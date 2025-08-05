"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"

interface PriceData {
  product_name: string
  price_with_gst: number
  price_without_gst: number
  aura_buy_price: number
  aura_sell_price: number
  updated_at: string
}

interface GoldCalculatorProps {
  latestPrice: PriceData | null
  metalType: "gold" | "silver" // New prop to indicate metal type
}

const GST_RATE = 0.03 // 3% GST

export default function GoldCalculator({ latestPrice, metalType }: GoldCalculatorProps) {
  const [calculationType, setCalculationType] = useState<"rupees" | "grams">("rupees")
  const [inputValue, setInputValue] = useState<string>("")
  const [calculatedResults, setCalculatedResults] = useState<{
    goldQuantity: number
    goldValue: number
    gstAmount: number
    amountPayable: number
  } | null>(null)

  useEffect(() => {
    // Reset inputs and results when latestPrice or metalType changes
    setInputValue("")
    setCalculatedResults(null)
  }, [latestPrice, calculationType, metalType]) // Added metalType to dependency array

  const handleCalculate = () => {
    if (!latestPrice || !inputValue) {
      setCalculatedResults(null)
      return
    }

    const buyPricePerGram = latestPrice.aura_buy_price
    const parsedValue = Number.parseFloat(inputValue)

    if (isNaN(parsedValue) || parsedValue <= 0) {
      setCalculatedResults(null)
      return
    }

    let goldQuantity = 0
    let goldValue = 0

    if (calculationType === "rupees") {
      // If buying in rupees, the input value is the amount payable including GST
      const amountIncludingGST = parsedValue
      goldValue = amountIncludingGST / (1 + GST_RATE) // Gold value before GST
      goldQuantity = goldValue / buyPricePerGram
    } else {
      // calculationType === "grams"
      goldQuantity = parsedValue
      goldValue = goldQuantity * buyPricePerGram
    }

    const gstAmount = goldValue * GST_RATE
    const amountPayable = goldValue + gstAmount

    setCalculatedResults({
      goldQuantity,
      goldValue,
      gstAmount,
      amountPayable,
    })
  }

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-700">
          {metalType === "gold" ? "Gold" : "Silver"} Purchase Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <RadioGroup
            defaultValue="rupees"
            value={calculationType}
            onValueChange={(value: "rupees" | "grams") => setCalculationType(value)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rupees" id="option-rupees" />
              <Label htmlFor="option-rupees">Buy in Rupees (₹)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="grams" id="option-grams" />
              <Label htmlFor="option-grams">Buy in Grams (g)</Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="input-value" className="text-slate-600">
              {calculationType === "rupees" ? "Enter amount in ₹" : "Enter quantity in grams"}
            </Label>
            <Input
              id="input-value"
              type="number"
              placeholder={calculationType === "rupees" ? "e.g., 50000" : "e.g., 5.0"}
              value={inputValue}
              onChange={(e) => {
                const value = e.target.value
                if (/^\d*\.?\d*$/.test(value) || value === "") {
                  setInputValue(value)
                }
              }}
              min="0"
              step={calculationType === "rupees" ? "0.01" : "0.001"}
              disabled={!latestPrice}
            />
          </div>

          <Button onClick={handleCalculate} disabled={!latestPrice || !inputValue}>
            Calculate
          </Button>

          {!latestPrice && <p className="text-sm text-red-500">Latest price not available. Cannot calculate.</p>}
        </div>

        {calculatedResults && (
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-slate-700">Calculation Details:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Current Buy Rate:</span>
                <span className="font-medium text-slate-800">
                  {latestPrice ? `₹${latestPrice.aura_buy_price.toFixed(2)}/g` : "N/A"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-slate-600">{metalType === "gold" ? "Gold" : "Silver"} Quantity:</span>
                <span className="font-medium text-slate-800">{calculatedResults.goldQuantity.toFixed(4)} g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Value (ex-GST):</span>
                <span className="font-medium text-slate-800">₹{calculatedResults.goldValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">GST ({GST_RATE * 100}%):</span>
                <span className="font-medium text-slate-800">₹{calculatedResults.gstAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold text-yellow-600">
                <span>Amount Payable:</span>
                <span>₹{calculatedResults.amountPayable.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
