"use client"

import { forwardRef, useImperativeHandle, useRef, useEffect, useState, useCallback } from "react"
import type { CanvasHandle, DrawStrokePayload } from "~/types/events"

const COLORS = [
  "#1E1A14", // ink black
  "#C0311A", // red ink
  "#1A4DC0", // blue ink
  "#1A8C3A", // forest green
  "#C07A1A", // amber
  "#6B1AC0", // violet
  "#C0B01A", // golden yellow
  "#1AAFC0", // teal
  "#C01A7A", // crimson pink
  "#8B6914", // warm brown
]

const BRUSH_SIZES = [2, 6, 14, 26]

const PAPER = "#F8F3E8"

interface CanvasProps {
  isDrawer: boolean
  onStroke: (payload: DrawStrokePayload) => void
  onClear: () => void
}

// Shared drawing logic used by both local draw handler and applyStroke
function drawSegment(canvas: HTMLCanvasElement | null, payload: DrawStrokePayload) {
  if (!canvas) return
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  ctx.lineWidth = payload.width
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.strokeStyle = payload.color
  ctx.beginPath()
  ctx.moveTo(payload.x0, payload.y0)
  ctx.lineTo(payload.x1, payload.y1)
  ctx.stroke()
}

const Canvas = forwardRef<CanvasHandle, CanvasProps>(function Canvas(
  { isDrawer, onStroke, onClear },
  ref,
) {
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  // Local drawing state (color/brush not yet wired to WS)
  const [color, setColor] = useState(COLORS[0])
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1])
  const [tool, setTool] = useState<"pen" | "eraser" | "fill">("pen")
  const [isDrawing, setIsDrawing] = useState(false)

  // Expose imperative methods for parent to call when receiving remote strokes
  useImperativeHandle(
    ref,
    () => ({
      applyStroke(payload: DrawStrokePayload) {
        drawSegment(canvasElRef.current, payload)
      },
      clearCanvas() {
        const c = canvasElRef.current
        if (!c) return
        const ctx = c.getContext("2d")
        if (!ctx) return
        ctx.fillStyle = PAPER
        ctx.fillRect(0, 0, c.width, c.height)
      },
    }),
    [],
  )

  // ResizeObserver: fill container, preserve aspect when resizing
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasElRef.current
    if (!container || !canvas) return

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        canvas.width = Math.floor(entry.contentRect.width)
        canvas.height = Math.floor(entry.contentRect.height)
        // Re-fill with paper color after resize (canvas.width assignment clears)
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.fillStyle = PAPER
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // Helper to get pointer position relative to canvas
  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasElRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawer) return
      e.preventDefault()

      isDrawingRef.current = true
      setIsDrawing(true)
      const pos = getPos(e)
      lastPointRef.current = pos

      // Capture pointer to keep move events even if pointer leaves canvas
      e.currentTarget.setPointerCapture(e.pointerId)

      // Draw initial dot
      drawSegment(canvasElRef.current, {
        x0: pos.x,
        y0: pos.y,
        x1: pos.x,
        y1: pos.y,
        color,
        width: tool === "eraser" ? brushSize * 2 : brushSize,
      })
    },
    [isDrawer, color, tool, brushSize],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !isDrawer) return
      e.preventDefault()

      const canvas = canvasElRef.current
      if (!canvas) return

      const pos = getPos(e)
      const prev = lastPointRef.current
      if (!prev) return

      const payload: DrawStrokePayload = {
        x0: prev.x,
        y0: prev.y,
        x1: pos.x,
        y1: pos.y,
        color: tool === "eraser" ? PAPER : color,
        width: tool === "eraser" ? brushSize * 2 : brushSize,
      }

      // Local draw
      drawSegment(canvasElRef.current, payload)
      // Send to server
      onStroke(payload)
      lastPointRef.current = pos
    },
    [isDrawer, color, tool, brushSize, onStroke],
  )

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false
    setIsDrawing(false)
    lastPointRef.current = null
  }, [])

  const handleClearCanvas = useCallback(() => {
    const c = canvasElRef.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = PAPER
    ctx.fillRect(0, 0, c.width, c.height)
    onClear()
  }, [onClear])

  const floodFill = useCallback(
    (x: number, y: number, fillColor: string) => {
      const canvas = canvasElRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      const px = (Math.round(x) + Math.round(y) * canvas.width) * 4
      const startR = data[px],
        startG = data[px + 1],
        startB = data[px + 2],
        startA = data[px + 3]

      const hexToRgb = (hex: string) => ({
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16),
      })
      const { r: fr, g: fg, b: fb } = hexToRgb(fillColor)
      if (startR === fr && startG === fg && startB === fb) return

      const stack = [[Math.round(x), Math.round(y)]]
      while (stack.length) {
        const [cx, cy] = stack.pop()!
        const i = (cx + cy * canvas.width) * 4
        if (
          cx < 0 ||
          cx >= canvas.width ||
          cy < 0 ||
          cy >= canvas.height ||
          data[i] !== startR ||
          data[i + 1] !== startG ||
          data[i + 2] !== startB ||
          data[i + 3] !== startA
        )
          continue
        data[i] = fr
        data[i + 1] = fg
        data[i + 2] = fb
        data[i + 3] = 255
        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
      }
      ctx.putImageData(imageData, 0, 0)
    },
    [],
  )

  const handlePointerDownFill = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawer) return
      e.preventDefault()
      const pos = getPos(e)
      floodFill(pos.x, pos.y, color)
    },
    [isDrawer, color, floodFill],
  )

  // TODO: Strokes use absolute pixel coords. If viewer canvas size differs from
  // drawer's, strokes will be misaligned. Normalize to [0,1] relative coords in phase 2.

  return (
    <div className="flex flex-col h-full">
      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden"
        style={{
          border: "2px solid var(--brut-ink)",
          background: PAPER,
        }}
      >
        <canvas
          ref={canvasElRef}
          className="w-full h-full block"
          style={{
            cursor: isDrawer ? (tool === "eraser" ? "cell" : "crosshair") : "not-allowed",
          }}
          onPointerDown={tool === "fill" ? handlePointerDownFill : handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      {/* Toolbar */}
      {isDrawer && (
        <div
          className="bg-card p-3 flex flex-wrap items-center gap-3"
          style={{ border: "2px solid var(--brut-ink)" }}
        >
          {/* Tool toggles */}
          <div className="flex gap-1">
            {(["pen", "eraser", "fill"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTool(t)}
                className="brut-press font-mono text-[10px] uppercase tracking-widest px-3 py-1.5"
                style={{
                  border: "1.5px solid var(--brut-ink)",
                  background: tool === t ? "var(--brut-ink)" : "transparent",
                  color: tool === t ? "#F8F3E8" : "var(--muted-foreground)",
                }}
              >
                {t === "pen" ? "PEN" : t === "eraser" ? "ERASER" : "FILL"}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Brush sizes */}
          <div className="flex items-center gap-1.5">
            {BRUSH_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setBrushSize(s)}
                className="flex items-center justify-center w-7 h-7 transition-colors"
                style={{
                  border: `1.5px solid ${brushSize === s ? "var(--brut-ink)" : "var(--border)"}`,
                }}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: Math.min(s, 20),
                    height: Math.min(s, 20),
                    background: "var(--foreground)",
                  }}
                />
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Color palette */}
          <div className="flex items-center gap-1 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c)
                  setTool("pen")
                }}
                className="w-6 h-6 transition-transform"
                style={{
                  background: c,
                  transform: color === c && tool !== "eraser" ? "scale(1.25)" : "scale(1)",
                  outline: color === c && tool !== "eraser" ? "2px solid var(--brut-ink)" : "none",
                  outlineOffset: "1px",
                }}
                title={c}
              />
            ))}
          </div>

          <div className="ml-auto">
            <button
              onClick={handleClearCanvas}
              className="brut-press font-mono font-bold uppercase tracking-widest text-[10px] px-3 py-1.5 bg-transparent"
              style={{ border: "2px solid var(--brut-ink)", color: "var(--brut-ink)" }}
            >
              CLEAR
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

Canvas.displayName = "Canvas"

export default Canvas
