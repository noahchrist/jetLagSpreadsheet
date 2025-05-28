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
  return (
    <div className="container" style={{ backgroundColor: '#0047AB', color: 'white', minHeight: '100vh', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '2rem' }}>Jet Lag League History</h1>

      {sortedHistory.map((season) => (
        <section key={`${season.year}-${season.league}`} className="season-block" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.25rem', marginBottom: '1rem' }}>
            {season.year} {season.league.charAt(0).toUpperCase() + season.league.slice(1)}
          </h2>
          <ol style={{ listStyle: 'none', padding: 0 }}>
            {season.results.sort((a, b) => a.place - b.place).map((result) => {
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

              // Format: TeamName W-L (#R)
              const record = (typeof result.wins === 'number' && typeof result.losses === 'number')
                ? ` ${result.wins}-${result.losses} (#${result.regularSeasonRank})`
                : ` (#${result.regularSeasonRank})`;

              // Add place index for 4th and below
              const placeLabel = result.place > 3 ? `${result.place}. ` : '';

              return (
                <li key={result.teamId} style={{ fontSize, marginBottom: '0.5rem' }}>
                  {placeLabel}{emoji}{' '}
                  {isActive(team) ? (
                    <>
                      <Link
                        to={link}
                        style={{
                          color: 'yellow',
                          textDecoration: 'none',
                          fontWeight: 'bold',
                        }}
                      >
                        {ownerDisplay} - {teamDisplay}
                      </Link>
                      <span
                        style={{
                          fontSize: `calc(${fontSize} / 1.7)`,
                          color: '#fff8',
                          marginLeft: 6,
                          verticalAlign: 'middle',
                        }}
                      >
                        {record}
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontWeight: 'bold' }}>
                        {ownerDisplay} - {teamDisplay}
                      </span>
                      <span
                        style={{
                          fontSize: `calc(${fontSize} / 1.7)`,
                          color: '#fff8',
                          marginLeft: 6,
                          verticalAlign: 'middle',
                        }}
                      >
                        {record}
                      </span>
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