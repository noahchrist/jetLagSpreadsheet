// File: src/pages/Home.jsx
import teams from '../data/teams.json';
import leagueHistory from '../data/leagueHistory.json';
import { Link } from 'react-router-dom';
import './Home.css';

const teamMap = Object.fromEntries(teams.map(team => [team.id, team]));

// Sort league history descending by year, dynasty first within each year
const sortedHistory = [...leagueHistory].sort((a, b) => {
  if (a.year !== b.year) return b.year - a.year;
  return a.league === 'dynasty' ? -1 : 1;
});

function Home() {
  return (
    <div className="container" style={{ backgroundColor: '#0047AB', color: 'white', minHeight: '100vh', padding: '2rem' }}>
      <h1>Jet Lag League History</h1>

      {sortedHistory.map((season) => (
        <section key={`${season.year}-${season.league}`} className="season-block">
          <h2>{season.year} {season.league.charAt(0).toUpperCase() + season.league.slice(1)}</h2>
          <ol>
            {season.results.sort((a, b) => a.place - b.place).map((result, index) => {
              const team = teamMap[result.teamId];
              return (
                <li key={result.teamId}>
                  {team?.owner || result.teamId} - {result.teamName || "Unnamed Team"}
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
