import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import { useAppState } from './hooks/useAppState.js';
import Login from './pages/Login.jsx';
import Roster from './pages/Roster.jsx';
import GenerateLineup from './pages/GenerateLineup.jsx';
import History from './pages/History.jsx';
import Settings from './pages/Settings.jsx';
import './App.css';

function App() {
  const { user, loading, logOut } = useAuth();
  const state = useAppState(user);

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>{state.teamName ? `${state.teamName} Lineup Generator` : 'Lineup Generator'}</h1>
          <button className="btn-signout" onClick={logOut} title="Sign out">
            Sign Out
          </button>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/generate" replace />} />
          <Route
            path="/roster"
            element={
              <Roster
                players={state.players}
                addPlayer={state.addPlayer}
                removePlayer={state.removePlayer}
                updatePlayer={state.updatePlayer}
              />
            }
          />
          <Route
            path="/generate"
            element={
              <GenerateLineup
                players={state.players}
                generateLineup={state.generateLineup}
                saveLineup={state.saveLineup}
              />
            }
          />
          <Route
            path="/history"
            element={
              <History
                players={state.players}
                lineups={state.lineups}
                teamName={state.teamName}
                updateLineup={state.updateLineup}
                deleteLineup={state.deleteLineup}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <Settings
                resetHistory={state.resetHistory}
                resetAll={state.resetAll}
                lineups={state.lineups}
                battingHistory={state.battingHistory}
                teamName={state.teamName}
                setTeamName={state.setTeamName}
              />
            }
          />
        </Routes>
      </main>

      <nav className="bottom-nav">
        <NavLink to="/roster" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">&#9881;</span>
          <span className="nav-label">Roster</span>
        </NavLink>
        <NavLink to="/generate" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">&#9889;</span>
          <span className="nav-label">Generate</span>
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">&#128203;</span>
          <span className="nav-label">History</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">&#9881;</span>
          <span className="nav-label">Settings</span>
        </NavLink>
      </nav>
    </div>
  );
}

export default App;
