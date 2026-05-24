"use client"

import * as Slider from "@radix-ui/react-slider"
import { useState } from "react"

export default function PriceRangeSlider({ searchParams, updateParam, maxPrice = 500 }: any) {
    const min = Number(searchParams.get("minPrice") || 0)
    const max = Number(searchParams.get("maxPrice") || maxPrice)
    const [value, setValue] = useState([min, max])

    return (
        <div className="mb-6">
            <div className="flex justify-between text-xs font-stats text-muted mb-3">
                <span>€{value[0]}</span>
                <span className="text-muted-2 text-[10px] tracking-wider uppercase">Price / day</span>
                <span>€{value[1]}{value[1] >= maxPrice ? "+" : ""}</span>
            </div>

            <Slider.Root
                className="relative flex items-center w-full h-5 cursor-pointer"
                min={0}
                max={maxPrice}
                step={10}
                value={value}
                onValueChange={val => setValue(val)}
                onValueCommit={val => {
                    updateParam("minPrice", String(val[0]))
                    updateParam("maxPrice", String(val[1]))
                }}
            >
                <Slider.Track className="relative grow rounded-full h-1 bg-surface-3">
                    <Slider.Range className="absolute bg-gold rounded-full h-full" />
                </Slider.Track>

                <Slider.Thumb className="block w-4 h-4 bg-gold border-2 border-gold-dark rounded-full shadow-lg hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gold/40 transition-transform" />
                <Slider.Thumb className="block w-4 h-4 bg-gold border-2 border-gold-dark rounded-full shadow-lg hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gold/40 transition-transform" />
            </Slider.Root>
        </div>
    )
}
