"use client"
import React, { useRef, useState, useEffect } from 'react'

interface Props {
    quillRef: React.RefObject<any>
}

const COLORS = [
    // Row 1 — neutrals
    '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#FFFFFF',
    // Row 2 — reds / pinks
    '#FF0000', '#FF4444', '#FF6B6B', '#FF9999', '#FFB3B3', '#FFD6D6', '#FFE8E8', '#FFF0F0',
    // Row 3 — oranges / yellows
    '#FF6600', '#FF8800', '#FFAA00', '#FFCC00', '#FFD966', '#FFE599', '#FFF2CC', '#FFFDE7',
    // Row 4 — greens
    '#00AA00', '#00CC00', '#33CC33', '#66BB6A', '#A5D6A7', '#C8E6C9', '#E8F5E9', '#F1F8E9',
    // Row 5 — blues / teals
    '#0000FF', '#1565C0', '#1976D2', '#0097A7', '#00BCD4', '#80DEEA', '#B2EBF2', '#E0F7FA',
    // Row 6 — purples / pinks
    '#9C27B0', '#AB47BC', '#CE93D8', '#E91E8C', '#F06292', '#F48FB1', '#FCE4EC', '#F3E5F5',
]

export default function ColorPicker({ quillRef }: Props) {
    const [selected, setSelected] = useState('#000000')
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const savedSelection = useRef<any>(null)

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault()
        const editor = quillRef.current?.getEditor()
        if (editor) {
            // Save selection BEFORE the palette opens
            savedSelection.current = editor.getSelection()
        }
        setOpen(prev => !prev)
    }

    const applyColor = (e: React.MouseEvent | React.KeyboardEvent, color: string) => {
        e.preventDefault() // Never let this steal focus
        const editor = quillRef.current?.getEditor()
        if (editor) {
            if (savedSelection.current !== null) {
                editor.setSelection(savedSelection.current)
            }
            editor.format('color', color)
            editor.focus()
        }
        setSelected(color)
        setOpen(false)
    }

    return (
        <div ref={containerRef} className="relative">
            {/* Color circle trigger */}
            <button
                onMouseDown={handleToggle}
                className="w-[1.25rem] h-[1.25rem] p-0 rounded-full border-2 border-gray-200 hover:border-gray-400 transition-colors shrink-0"
                style={{ background: selected }}
                title="Text color"
            />

            {/* Swatch palette */}
            {open && (
                <div className="absolute top-[calc(100%+0.5rem)] left-0 z-50 bg-white border border-[#E6E6E6] rounded-[0.75rem] shadow-lg p-2">
                    <div className="grid grid-cols-8 gap-1">
                        {COLORS.map((color) => (
                            <button
                                key={color}
                                onMouseDown={(e) => applyColor(e, color)}
                                className="w-5 h-5 rounded-full border border-gray-200 hover:scale-110 transition-transform shrink-0"
                                style={{ background: color }}
                                title={color}
                            />
                        ))}
                    </div>

                    {/* Custom hex input */}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                        <div
                            className="w-5 h-5 rounded-full border border-gray-200 shrink-0"
                            style={{ background: selected }}
                        />
                        <input
                            type="text"
                            value={selected}
                            onChange={(e) => setSelected(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') applyColor(e as any, selected)
                            }}
                            className="flex-1 text-xs border border-gray-200 rounded px-2 py-0.5 outline-none font-mono"
                            placeholder="#000000"
                            maxLength={7}
                        />
                        <button
                            onMouseDown={(e) => applyColor(e, selected)}
                            className="text-xs px-2 py-0.5 bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}