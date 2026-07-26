"use client"
import React, { useState, useRef, useEffect } from 'react'
import { CaretDownIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/buttonComp'

// Ensure these match your CSS class suffixes exactly
const FONTS = [
    { label: 'Inter', value: 'inter' },
    { label: 'Arial', value: 'arial' },
    { label: 'Georgia', value: 'georgia' },
    // { label: 'Times New Roman', value: 'times-new-roman' }, // Use hyphens here
    { label: 'Courier New', value: 'courier-new' },        // Use hyphens here
    { label: 'Verdana', value: 'verdana' },
    // { label: 'Trebuchet MS', value: 'trebuchet-ms' },      // Use hyphens here
]

interface Props {
    quillRef: React.RefObject<any>
}

export default function FontDropdown({ quillRef }: Props) {
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState('Inter')
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const applyFont = (font: { label: string; value: string }) => {
        const editor = quillRef.current?.getEditor()
        if (editor) {
            editor.format('font', font.value)
            editor.focus()
        }
        setSelected(font.label)
        setOpen(false)
    }

    return (
        <div ref={containerRef} className="relative">
            <Button
                variant="outline"
                onMouseDown={(e) => { e.preventDefault(); setOpen(!open) }}
                className="flex items-center !w-[5rem] !h-[1.25rem] text-sm !text-gray-800 !bg-white  border-none shadow-none !hover:bg-white rounded-lg transition-colors"
            >
                <div className="flex items-center gap-[0.5rem]">
                    <span className="font-medium truncate">{selected}</span>
                    <CaretDownIcon size={14} className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
                </div>
            </Button>

            {open && (
                <div className="absolute top-[calc(100%+0.5rem)] left-0 z-50 w-[10rem] bg-white border border-[#E6E6E6] rounded-[0.75rem] shadow-lg py-1 overflow-hidden">
                    {FONTS.map((font) => (
                        <button
                            key={font.value}
                            onMouseDown={(e) => { e.preventDefault(); applyFont(font) }}
                            className={`w-full text-left px-3 py-[0.4rem] text-sm transition-colors hover:bg-gray-50
                                ${selected === font.label ? 'text-gray-900 font-semibold bg-gray-50' : 'text-gray-600 font-normal'}`}
                            style={{ fontFamily: font.label }}
                        >
                            {font.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}