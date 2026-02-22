import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAppState } from './hooks/useAppState.js';
import Roster from './pages/Roster.jsx';
import GenerateLineup from './pages/GenerateLineup.jsx';
import History from './pages/History.jsx';
import Settings from './pages/Settings.jsx';
import './App.css';

function App() {
  const state = useAppState();

  return (
    <div className="app">
      <header className="app-header">
        <h1>Lineup Generator</h1>
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
