import { NextRequest, NextResponse } from 'next/server'

const EVAL_API = 'https://eval.plc.hadron43.in/eval-bars'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const fen = searchParams.get('fen')

  if (!fen) {
    return NextResponse.json({ error: 'FEN parameter required' }, { status: 400 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const encodedFen = encodeURIComponent(fen)
    const response = await fetch(`${EVAL_API}/?fen=${encodedFen}`, {
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`Evaluation API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    clearTimeout(timeout)
    if ((error as Error).name === 'AbortError') {
      return NextResponse.json({ error: 'Evaluation timeout' }, { status: 504 })
    }
    return NextResponse.json({ error: 'Failed to fetch evaluation' }, { status: 500 })
  }
}
