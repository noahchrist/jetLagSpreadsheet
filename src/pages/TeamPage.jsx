import { useParams } from 'react-router-dom';
import teams from '../data/teams.json';
import leagueHistory from '../data/leagueHistory.json';
import React, { useState } from 'react';

// Simple SVG line graph component
function PlayoffFinishGraph({ results, filter, selected }) {
  // Filter results based on selected league type
  const filteredResults = React.useMemo(() => {
    if (filter === 'redraft') return results.filter(r => r.league === 'redraft');
    if (filter === 'dynasty') return results.filter(r => r.league === 'dynasty');
    return results;
  }, [results, filter]);

  if (!filteredResults.length) return (
    <div style={{ color: '#fff', marginTop: 40, textAlign: 'center' }}>
      No results for {selected.charAt(0).toUpperCase() + selected.slice(1)} seasons.
    </div>
  );

  // Map all finishes to a max of 12 (treat 13/14 as 12)
  const normalizedFinishes = filteredResults.map(r =>
    r.place > 12 ? 12 : r.place
  );

  // SVG dimensions (logical, not physical)
  const height = 420;
  const padding = 60;
  const bottomExtra = 50;
  const width = Math.max(600, filteredResults.length * 60);

  // Y scale: 1st place at top, 12th at bottom
  const yScale = place => padding + ((place - 1) * ((height - bottomExtra - 2 * padding) / 11));
  // X scale: spread evenly across width
  const xScale = idx => padding + idx * ((width - 2 * padding) / (filteredResults.length - 1 || 1));

  // Points for the line
  const points = normalizedFinishes.map((place, idx) => ({
    x: xScale(idx),
    y: yScale(place),
    label: filteredResults[idx].label,
    year: filteredResults[idx].year,
    league: filteredResults[idx].league,
    place: filteredResults[idx].place,
  }));

  // Axis labels (1-12)
  const yLabels = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20,
        width: '100%',
        overflowX: 'auto',
      }}
    >
      <div style={{ width: '100%', maxWidth: 700 }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="auto"
          style={{ background: '#003366', borderRadius: 8, display: 'block', width: '100%', height: 'auto' }}
        >
          {/* Y axis grid and labels */}
          {yLabels.map(i => (
            <g key={i}>
              <line
                x1={padding - 5}
                x2={width - padding + 5}
                y1={yScale(i)}
                y2={yScale(i)}
                stroke="#fff2"
                strokeDasharray="2,4"
              />
              <text
                x={padding - 20}
                y={yScale(i) + 5}
                fill="#fff"
                fontSize={16}
                textAnchor="end"
              >
                {i}
              </text>
            </g>
          ))}
          {/* Line connecting points */}
          <polyline
            fill="none"
            stroke="#FFD700"
            strokeWidth={4}
            points={points.map(pt => `${pt.x},${pt.y}`).join(' ')}
          />
          {/* Points */}
          {points.map((pt, idx) => (
            <g key={idx}>
              <circle cx={pt.x} cy={pt.y} r={10} fill="#FFD700" stroke="#fff" strokeWidth={3} />
              <text
                x={pt.x}
                y={pt.y - 16}
                fill="#fff"
                fontSize={18}
                textAnchor="middle"
                fontWeight="bold"
              >
                {pt.place}
              </text>
            </g>
          ))}
          {/* X axis labels (years/leagues) at a slant, close to graph */}
          {points.map((pt, idx) => (
            <g key={idx}>
              <text
                x={pt.x + 10}
                y={height - bottomExtra}
                fill="#fff"
                fontSize={16}
                textAnchor="start"
                transform={`rotate(-35,${pt.x - 5},${height - bottomExtra + 50})`}
                style={{ pointerEvents: 'none' }}
              >
                {pt.year} {pt.league[0].toUpperCase()}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function TeamPage() {
  const { teamId } = useParams();
  const team = teams.find(t => t.id === teamId);

  if (!team) {
    return (
      <div className="container" style={{ backgroundColor: '#0047AB', color: 'white', minHeight: '100vh', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center' }}>Team not found</h2>
      </div>
    );
  }

  // Build display string based on available names
  let teamNames = '';
  if (team.dynastyName && team.redraftName && team.dynastyName !== team.redraftName) {
    teamNames = `${team.dynastyName} // ${team.redraftName}`;
  } else if (team.dynastyName) {
    teamNames = team.dynastyName;
  } else if (team.redraftName) {
    teamNames = team.redraftName;
  }

  // Gather all results for this team across all seasons
  const allResults = leagueHistory
    .flatMap(season =>
      season.results
        .filter(result => result.teamId === team.id)
        .map(result => ({
          ...result,
          year: season.year,
          league: season.league,
        }))
    );

  // Sort by year, then redraft before dynasty for consistent graph order
  const sortedResults = [...allResults].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    // Redraft before dynasty
    if (a.league === b.league) return 0;
    if (a.league === 'redraft') return -1;
    return 1;
  });

  // Seasons played
  const seasonsPlayed = allResults.length;
  const years = allResults.map(r => r.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  // Overall record
  const totalWins = allResults.reduce((sum, r) => sum + (r.wins || 0), 0);
  const totalLosses = allResults.reduce((sum, r) => sum + (r.losses || 0), 0);
  const totalGames = totalWins + totalLosses;
  const winPct = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  // Playoff appearances: place 1-6
  const playoffAppearances = allResults.filter(r => typeof r.place === 'number' && r.place >= 1 && r.place <= 6).length;
  const playoffPct = seasonsPlayed > 0 ? ((playoffAppearances / seasonsPlayed) * 100).toFixed(0) : '-';

  // Avg regular season finish (regularSeasonRank)
  const avgRegFinish = allResults.length
    ? (allResults.reduce((sum, r) => sum + (r.regularSeasonRank || 0), 0) / allResults.length).toFixed(2)
    : '-';

  // Avg playoff finish (place)
  const avgPlayoffFinish = allResults.length
    ? (allResults.reduce((sum, r) => sum + (r.place || 0), 0) / allResults.length).toFixed(2)
    : '-';

  // Only include results with a valid place for the graph
  const graphResults = sortedResults
    .filter(r => typeof r.place === 'number' && r.place >= 1)
    .map(r => ({
      ...r,
      place: r.place > 12 ? 12 : r.place,
      label: `${r.year} ${r.league[0].toUpperCase()}`,
    }));

  // Count number of championships (place === 1)
  const numRings = allResults.filter(r => r.place === 1).length;
  const rings = numRings > 0 ? ' ' + '💍'.repeat(numRings) : '';
  
    // Add state for graph filter
  const [graphFilter, setGraphFilter] = useState('both');

  // Button styling
  const buttonStyle = selected => ({
    padding: '0.5rem 1.2rem',
    margin: '0 0.5rem',
    border: 'none',
    borderRadius: 20,
    background: selected ? '#FFD700' : '#fff2',
    color: selected ? '#003366' : '#fff',
    fontWeight: selected ? 700 : 400,
    fontSize: '1.1rem',
    cursor: 'pointer',
    outline: selected ? '2px solid #FFD700' : 'none',
    transition: 'background 0.15s, color 0.15s',
  });

  return (
    <div
      className="container"
      style={{
        backgroundColor: '#0047AB',
        color: 'white',
        minHeight: '100vh',
        padding: '2rem',
      }}
    >
      <h1 style={{ textTransform: 'uppercase', fontSize: '3rem', textAlign: 'center', marginBottom: '1.5rem' }}>
        {team.owner}{rings}
      </h1>
      <h2 style={{ textAlign: 'center', marginBottom: '2.5rem' }}>{teamNames}</h2>
      <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'left' }}>
        <div style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
          <strong>Seasons played:</strong> {seasonsPlayed} {seasonsPlayed > 0 && `(${minYear} - ${maxYear})`}
        </div>
        <div style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
          <strong>Overall Record:</strong> {totalWins} - {totalLosses} ({winPct}%)
        </div>
        <div style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
          <strong>Playoff Appearances:</strong> {playoffAppearances} / {seasonsPlayed} {seasonsPlayed > 0 && `(${playoffPct}%)`}
        </div>
        <div style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
          <strong>Avg Regular Season Finish:</strong> {avgRegFinish}
        </div>
        <div style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
          <strong>Avg Playoff Finish:</strong> {avgPlayoffFinish}
        </div>
      </div>
      {/* Toggle buttons for graph filter */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '2.5rem 0 1.5rem 0' }}>
        <button
          style={buttonStyle(graphFilter === 'redraft')}
          onClick={() => setGraphFilter('redraft')}
        >
          Redraft
        </button>
        <button
          style={buttonStyle(graphFilter === 'dynasty')}
          onClick={() => setGraphFilter('dynasty')}
        >
          Dynasty
        </button>
        <button
          style={buttonStyle(graphFilter === 'both')}
          onClick={() => setGraphFilter('both')}
        >
          Both
        </button>
      </div>
      <PlayoffFinishGraph results={graphResults} filter={graphFilter} selected={graphFilter} />
    </div>
  );
}

export default TeamPage;