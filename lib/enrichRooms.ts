/**
 * Rooms linked to ESPN games (espn_game_id) have no FK join to the games table.
 * This enriches those rooms with live game data from our /api/games endpoint.
 */
export async function enrichRoomsWithGameData(rooms: any[]): Promise<any[]> {
  const needsEnrichment = rooms.filter(r => !r.games && r.espn_game_id)
  if (needsEnrichment.length === 0) return rooms

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gamebooth.app'
    const res = await fetch(`${baseUrl}/api/games`, { next: { revalidate: 30 } })
    if (!res.ok) return rooms
    const { games: espnGames } = await res.json()
    if (!Array.isArray(espnGames)) return rooms

    return rooms.map(room => {
      if (room.games || !room.espn_game_id) return room
      const match = espnGames.find((g: any) => g.id === room.espn_game_id)
      if (!match) return room
      return {
        ...room,
        games: {
          league: match.league,
          home_team: match.home_team,
          away_team: match.away_team,
          home_team_logo: match.home_team_logo ?? null,
          away_team_logo: match.away_team_logo ?? null,
          status: match.status,
          home_score: match.home_score,
          away_score: match.away_score,
          period: match.period ?? null,
          game_clock: match.game_clock ?? null,
          start_time: match.start_time,
        },
      }
    })
  } catch {
    return rooms
  }
}
