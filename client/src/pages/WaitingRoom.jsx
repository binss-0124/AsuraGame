import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import PlayerSlot from '../components/PlayerSlot';
import './WaitingRoom.css';

function WaitingRoom({ roomInfo, onGameStart, onLeave }) {
  const { socket } = useSocket();
  const [players, setPlayers] = useState([]);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [isReady, setIsReady] = useState(false);
  const [isRoomCreator, setIsRoomCreator] = useState(false);
  const [canStartGame, setCanStartGame] = useState(false);

  useEffect(() => {
    if (!socket) {
      console.log('[WaitingRoom] 소켓이 없음');
      return;
    }

    console.log('[WaitingRoom] 이벤트 리스너 등록');

    // 방장인지 확인
    socket.on('updatePlayers', (updatedPlayers, max) => {
      console.log('[WaitingRoom] updatePlayers 이벤트 수신:', updatedPlayers, 'maxPlayers:', max);
      setPlayers(updatedPlayers);
      setMaxPlayers(max);
      
      if (updatedPlayers.length > 0 && updatedPlayers[0].id === socket.id) {
        console.log('[WaitingRoom] 현재 사용자가 방장임');
        setIsRoomCreator(true);
        const allReady = updatedPlayers.every(p => p.ready);
        console.log('[WaitingRoom] 모든 플레이어 준비 상태:', allReady);
        setCanStartGame(allReady && updatedPlayers.length > 0);
      }
    });

    socket.on('startGame', (gameData) => {
      console.log('[WaitingRoom] startGame 이벤트 수신:', gameData);
      onGameStart(gameData);
    });

    socket.on('roomError', (message) => {
      console.log('[WaitingRoom] roomError 이벤트 수신:', message);
      alert(`방 오류: ${message}`);
      onLeave();
    });

    return () => {
      socket.off('updatePlayers');
      socket.off('startGame');
      socket.off('roomError');
    };
  }, [socket, onGameStart, onLeave]);

  const handleReady = () => {
    console.log('[WaitingRoom] handleReady 클릭, 현재 준비 상태:', isReady);
    socket.emit('ready');
    setIsReady(!isReady);
  };

  const handleStartGame = () => {
    console.log('[WaitingRoom] handleStartGame 클릭, canStartGame:', canStartGame);
    if (canStartGame) {
      console.log('[WaitingRoom] startGameRequest 서버로 emit');
      socket.emit('startGameRequest');
    } else {
      console.log('[WaitingRoom] 게임 시작 불가 - 모든 플레이어가 준비되지 않음');
    }
  };

  const handleCloseSlot = (index) => {
    socket.emit('closePlayerSlot', index);
  };

  const handleIncreaseSlots = () => {
    socket.emit('increaseMaxPlayers');
  };

  return (
    <div className="waiting-room">
      <div className="waiting-room-container">
        <div className="waiting-room-header">
          <h2 className="room-title">{roomInfo?.name}</h2>
          {roomInfo?.visibility === 'private' && (
            <p className="room-id">방 ID: {roomInfo.id}</p>
          )}
        </div>

        <div className="player-slots-container">
          {Array.from({ length: 8 }).map((_, index) => (
            <PlayerSlot
              key={index}
              index={index}
              player={players[index]}
              isOpen={index < maxPlayers}
              isRoomCreator={isRoomCreator}
              onClose={() => handleCloseSlot(index)}
              onOpen={handleIncreaseSlots}
            />
          ))}
        </div>

        <div className="waiting-room-footer">
          <div className="map-preview">
            {roomInfo?.map && (
              <img 
                src={`/resources/${roomInfo.map.charAt(0).toUpperCase() + roomInfo.map.slice(1)}.png`}
                alt="Map Preview"
                className="map-image"
              />
            )}
          </div>
          
          <div className="action-buttons">
            <button 
              className="btn-primary ready-btn"
              onClick={handleReady}
            >
              {isReady ? '준비 취소' : '준비'}
            </button>
            
            {isRoomCreator && (
              <button 
                className="btn-primary start-btn"
                onClick={handleStartGame}
                disabled={!canStartGame}
                style={{ opacity: canStartGame ? 1 : 0.5 }}
              >
                게임 시작
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WaitingRoom;
