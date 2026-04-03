import { Link } from 'react-router-dom';

export default function MainPage() {
  return (
    <div>
      <h1>Welcome to the main page!</h1>
      <p>
        <Link to="/dashboard">Go to dashboard</Link>
      </p>
    </div>
  );
}
