import React, { useState } from 'react';
import { SocketProvider } from './contexts/SocketContext';
import MainMenu from './pages/MainMenu';
import WaitingRoom from './pages/WaitingRoom';
import GamePage from './pages/GamePage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('menu'); // 'menu', 'waiting', 'game'
  const [roomInfo, setRoomInfo] = useState(null);
  const [playerInfo, setPlayerInfo] = useState(null);
  const [gameData, setGameData] = useState(null);

  return (
    <SocketProvider>
      <div className="app">
        {currentPage === 'menu' && (
          <MainMenu
            onRoomCreated={(info) => {
              setRoomInfo(info);
              setCurrentPage('waiting');
            }}
            onRoomJoined={(info) => {
              setRoomInfo(info);
              setCurrentPage('waiting');
            }}
            setPlayerInfo={setPlayerInfo}
          />
        )}
        
        {currentPage === 'waiting' && (
          <WaitingRoom
            roomInfo={roomInfo}
            onGameStart={(gameData) => {
              console.log('[App] onGameStart 호출, gameData:', gameData);
              setGameData(gameData);
              setCurrentPage('game');
            }}
            onLeave={() => {
              setCurrentPage('menu');
              setRoomInfo(null);
            }}
          />
        )}
        
        {currentPage === 'game' && (
          <GamePage
            roomInfo={roomInfo}
            playerInfo={playerInfo}
            gameData={gameData}
            onGameEnd={() => {
              setCurrentPage('menu');
              setRoomInfo(null);
              setGameData(null);
            }}
          />
        )}
      </div>
    </SocketProvider>
  );
}

export default App;
