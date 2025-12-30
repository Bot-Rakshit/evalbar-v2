import { NextRequest, NextResponse } from 'next/server'

const API_ENDPOINT = 'https://lichess.org/api/broadcast/-/-'

// This API route is now ONLY used as a fallback for JSON data
// The client connects directly to Lichess stream for real-time PGN
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const roundId = searchParams.get('roundId')

  if (!roundId) {
    return NextResponse.json({ error: 'roundId parameter required' }, { status: 400 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(`${API_ENDPOINT}/${roundId}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return NextResponse.json(
        { error: `Lichess API error: ${response.status}`, games: [] }, 
        { status: response.status }
      )
    }

    const data = await response.json()
    
    if (!data.games) {
      data.games = []
    }
    
    return NextResponse.json(data)
  } catch (error) {
    clearTimeout(timeout)
    if ((error as Error).name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout', games: [] }, { status: 504 })
    }
    return NextResponse.json({ error: 'Failed to fetch broadcast data', games: [] }, { status: 500 })
  }
}
