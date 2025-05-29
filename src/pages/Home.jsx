// File: src/pages/Home.jsx
import teams from '../data/teams.json';
import leagueHistory from '../data/leagueHistory.json';
import { Link } from 'react-router-dom';
import './Home.css';

const teamMap = Object.fromEntries(teams.map(team => [team.id, team]));

// Helper to check if a team is active in dynasty or redraft
function isActive(team) {
  return team?.dynastyActive || team?.redraftActive;
}

// Sort league history descending by year, dynasty first within each year
const sortedHistory = [...leagueHistory].sort((a, b) => {
  if (a.year !== b.year) return b.year - a.year;
  return a.league === 'dynasty' ? -1 : 1;
});

function Home() {
  // Flattened and grouped results by team
  const resultsByTeam = {};
  let totalSeasons = 0;

  leagueHistory.forEach(season => {
    totalSeasons++;
    season.results.forEach(result => {
      if (!resultsByTeam[result.teamId]) resultsByTeam[result.teamId] = [];
      resultsByTeam[result.teamId].push({ ...result, year: season.year, league: season.league });
    });
  });

  const eligibleTeams = Object.entries(resultsByTeam).filter(([_, entries]) => entries.length >= totalSeasons / 2);

  const calcStats = entries => {
    const games = entries.map(e => ({ w: e.wins || 0, l: e.losses || 0 }));
    const winPct = games.reduce((acc, g) => acc + (g.w + g.l > 0 ? g.w / (g.w + g.l) : 0), 0) / entries.length;
    const playoffPct = entries.filter(e => e.place <= 6).length / entries.length;
    const avgFinish = entries.reduce((sum, r) => sum + (r.place || 0), 0) / entries.length;
    const avgReg = entries.reduce((sum, r) => sum + (r.regularSeasonRank || 0), 0) / entries.length;
    const playoffDelta = entries.map(e => (e.regularSeasonRank || e.place) - (e.place || e.regularSeasonRank));
    const avgDelta = playoffDelta.reduce((sum, d) => sum + d, 0) / entries.length;
    const rings = entries.filter(r => r.place === 1).length;
    const top3 = entries.filter(r => r.place && r.place <= 3).length;
    const bestReg = entries.reduce((best, r) => {
      const total = (r.wins || 0) + (r.losses || 0);
      const pct = total > 0 ? (r.wins || 0) / total : 0;
      return pct > best ? pct : best;
    }, 0);
    return { winPct, playoffPct, avgFinish, avgReg, avgDelta, rings, top3, bestReg };
  };

  const sortAndFormat = (key, desc = true, filter = () => true) => {
    return eligibleTeams
      .map(([id, entries]) => ({ id, ...calcStats(entries), owner: teamMap[id]?.owner }))
      .filter(filter)
      .sort((a, b) => desc ? b[key] - a[key] : a[key] - b[key])
      .slice(0, 5);
  };

  const categories = [
    { title: 'Mr. GOAT 🐐', key: 'avgFinish', desc: false },
    { title: 'Mr. Winner Winner Chicken Dinner 🍗', key: 'winPct' },
    { title: 'Mr. Playoff Perennial 📈', key: 'playoffPct', filter: x => x.playoffPct > 0.5 },
    { title: 'Mr. Postseason 🔥', key: 'avgDelta', filter: x => x.avgDelta > 0 },
    { title: 'Mr. Meltdown 😬', key: 'avgDelta', desc: false, filter: x => x.avgDelta < 0 },
    { title: 'Mr. Bust Down 💍', key: 'rings', filter: x => x.rings >= 2 },
    { 
      title: 'Mr. Podium 🏆', 
      key: 'top3', 
      filter: x => x.top3 >= 4 // Require at least 4 playoff appearances (top 3 finishes)
    },
    { title: 'Mr. No Clothes No Money No Hoes 🫵😹', key: 'rings', desc: true, filter: x => x.rings === 0 },
  ];

  // Add descriptive subtitles for each leaderboard category
  const categorySubtitles = {
    avgFinish: 'Highest Average Final Ranking',
    winPct: 'Highest Win Percentage',
    playoffPct: 'Highest Playoff Appearance Percentage',
    avgDelta: 'Best Playoff Performer',
    rings: 'Most Rings',
    top3: 'Most Top 3 Finishes',
    bestReg: 'Best Regular Season',
    // Special case for worst playoff performer and zero rings
    meltdown: 'Worst Playoff Performer',
    zeroRings: 'Zero Rings',
  };

  return (
    <div className="container" style={{ backgroundColor: '#0047AB', color: 'white', minHeight: '100vh', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '2rem' }}>THIS LEAGUE.</h1>

      {/* --- LEAGUE LEADERBOARD FIRST --- */}
      <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '1rem' }}>🏅 League Leaderboard</h2>
      {categories.map(cat => {
        // Map category key/title to subtitle
        let subtitle = '';
        if (cat.key === 'avgFinish') subtitle = 'Highest Average Final Ranking';
        else if (cat.key === 'winPct') subtitle = 'Highest Win Percentage';
        else if (cat.key === 'playoffPct') subtitle = 'Highest Playoff Appearance Percentage';
        else if (cat.key === 'avgDelta' && cat.title.includes('Postseason')) subtitle = 'Best Playoff Performer';
        else if (cat.key === 'avgDelta' && cat.title.includes('Meltdown')) subtitle = 'Worst Playoff Performer';
        else if (cat.key === 'rings' && cat.title.includes('Bust Down')) subtitle = 'Most Rings';
        else if (cat.key === 'top3') subtitle = 'Most Top 3 Finishes';
        else if (cat.key === 'bestReg') subtitle = 'Best Regular Season';
        else if (cat.key === 'rings' && cat.title.includes('No Clothes')) subtitle = 'Zero Rings';

        return (
          <section key={cat.title} style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              {cat.title} <span style={{ color: '#fff8', fontWeight: 400, fontSize: '1rem' }}>// {subtitle}</span>
            </h3>
            <ol style={{ listStyle: 'none', padding: 0 }}>
              {sortAndFormat(cat.key, cat.desc !== false, cat.filter).map((team, i, arr) => {
                // For "most rings" and "least rings" categories, remove indexes if tied
                const isRingsCat =
                  cat.key === 'rings' &&
                  (cat.title.includes('Bust Down') || cat.title.includes('No Clothes'));
                // If all teams in this category have the same number of rings, don't show index
                const allSameRings =
                  isRingsCat && arr.every(t => t.rings === arr[0].rings);

                return (
                  <li key={team.id} style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                    {!allSameRings ? `${i + 1}. ` : ''}
                    <Link to={`/team/${team.id}`} style={{ color: 'yellow', textDecoration: 'none', fontWeight: 'bold' }}>
                      {team.owner}
                    </Link>
                    <span style={{ color: '#fff8', marginLeft: 8 }}>
                      {(() => {
                        const value = team[cat.key];
                        if (cat.key === 'winPct' || cat.key === 'playoffPct') {
                          return ` (${(value * 100).toFixed(1)}%)`;
                        }
                        if (cat.key === 'avgFinish' || cat.key === 'avgReg') {
                          return ` (${value.toFixed(2)})`;
                        }
                        if (cat.key === 'avgDelta') {
                          // Add + sign for Mr. Postseason only (positive delta)
                          if (cat.title.includes('Postseason')) {
                            return ` (+${value.toFixed(2)})`;
                          }
                          return ` (${value.toFixed(2)})`;
                        }
                        return ` (${value})`;
                      })()}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      <hr style={{ borderColor: 'white', margin: '3rem 0' }} />

      {/* --- LEAGUE HISTORY SECOND --- */}
      {sortedHistory.map((season) => (
        <section key={`${season.year}-${season.league}`} className="season-block" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.25rem', marginBottom: '1rem' }}>
            {season.year} {season.league.charAt(0).toUpperCase() + season.league.slice(1)}
            {season.year === 2021 ? '*' : ''}
          </h2>
          <ol style={{ listStyle: 'none', padding: 0 }}>
            {season.results.sort((a, b) => a.place - b.place).map((result, idx) => {
              const team = teamMap[result.teamId];
              const ownerDisplay = team?.owner || result.teamId;
              const teamDisplay = result.teamName || "Unnamed Team";
              const link = `/team/${team?.id}`;
              let fontSize = '1.2rem';
              let emoji = '';

              if (result.place === 1) {
                fontSize = '2.25rem';
                emoji = '🥇';
              } else if (result.place === 2) {
                fontSize = '1.75rem';
                emoji = '🥈';
              } else if (result.place === 3) {
                fontSize = '1.5rem';
                emoji = '🥉';
              }

              const record = (typeof result.wins === 'number' && typeof result.losses === 'number')
                ? ` ${result.wins}-${result.losses} (#${result.regularSeasonRank})`
                : ` (#${result.regularSeasonRank})`;

              const placeLabel = result.place > 3 ? `${result.place}. ` : '';

              return (
                <li key={result.teamId} style={{ fontSize, marginBottom: '0.5rem' }}>
                  {placeLabel}{emoji}{' '}
                  {isActive(team) ? (
                    <>
                      <Link
                        to={link}
                        style={{ color: 'yellow', textDecoration: 'none', fontWeight: 'bold' }}
                      >
                        {ownerDisplay} - {teamDisplay}
                      </Link>
                      <span style={{ fontSize: `calc(${fontSize} / 1.7)`, color: '#fff8', marginLeft: 6, verticalAlign: 'middle' }}>
                        {record}
                      </span>
                      {/* Show Finals MVP if this is the champion and result.finalsMVP exists */}
                      {result.place === 1 && result.finalsMVP && (
                        <div style={{ fontSize: '1rem', color: '#FFD700', marginTop: 2 }}>
                          Finals MVP: <span style={{ fontWeight: 500 }}>{result.finalsMVP}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <span style={{ fontWeight: 'bold' }}>{ownerDisplay} - {teamDisplay}</span>
                      <span style={{ fontSize: `calc(${fontSize} / 1.7)`, color: '#fff8', marginLeft: 6, verticalAlign: 'middle' }}>
                        {record}
                      </span>
                      {result.place === 1 && result.finalsMVP && (
                        <div style={{ fontSize: '1rem', color: '#FFD700', marginTop: 2 }}>
                          Finals MVP: <span style={{ fontWeight: 500 }}>{result.finalsMVP}</span>
                        </div>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

export default Home;
