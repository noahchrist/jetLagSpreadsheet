import teams from '../data/teams.json';
import { Link } from 'react-router-dom';
import './Home.css';

const redraftTeamIds = [
  "noah", "jeremy", "connor", "gil", "david", "chris",
  "nihal", "joemass", "jaylos", "doorhy", "benny_g", "tom"
];

const dynastyTeamIds = [
  "noah", "jeremy", "connor", "gil", "david", "chris",
  "nihal", "joemass", "jaylos", "doorhy", "benny_g", "fuzzy"
];

const teamMap = Object.fromEntries(teams.map(team => [team.id, team]));

function Home() {
  const redraftTeams = redraftTeamIds.map(id => teamMap[id]).filter(Boolean);
  const dynastyTeams = dynastyTeamIds.map(id => teamMap[id]).filter(Boolean);

  return (
    <div className="container">
      <h1>Jet Lag League 2024</h1>

      <section>
        <h2>2024 Redraft</h2>
        <ol>
          {redraftTeams.map((team, index) => (
            <li key={team.id}>
              <Link to={`/team/${team.id}`}>{index + 1}. {team.redraftName || team.owner}</Link>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2>2024 Dynasty</h2>
        <ol>
          {dynastyTeams.map((team, index) => (
            <li key={team.id}>
              <Link to={`/team/${team.id}`}>{index + 1}. {team.dynastyName || team.owner}</Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export default Home;