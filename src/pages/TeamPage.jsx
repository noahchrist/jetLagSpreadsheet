import { useParams } from 'react-router-dom';
import './TeamPage.css';

function TeamPage() {
  const { teamId } = useParams();
  return (
    <div className="team-container">
      <h1>Team Page: {teamId}</h1>
      <p>Detailed stats for team: {teamId} will go here.</p>
    </div>
  );
}

export default TeamPage;