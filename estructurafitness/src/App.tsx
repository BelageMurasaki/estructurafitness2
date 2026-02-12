import { useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { ClientDashboard } from './components/ClientDashboard';
import { TrainerDashboard } from './components/TrainerDashboard';

function App() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-600 flex items-center justify-center">
        <div className="text-white text-2xl font-semibold">Cargando...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Login />;
  }

  if (profile.role === 'trainer') {
    return <TrainerDashboard />;
  }

  return <ClientDashboard />;
}

export default App;
