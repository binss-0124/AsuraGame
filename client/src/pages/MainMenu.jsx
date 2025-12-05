import React, { useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import CreateRoomModal from '../components/CreateRoomModal';
import JoinRoomModal from '../components/JoinRoomModal';
import CharacterSelectModal from '../components/CharacterSelectModal';
import './MainMenu.css';

function MainMenu({ onRoomCreated, onRoomJoined, setPlayerInfo }) {
  const { socket } = useSocket();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [roomSettings, setRoomSettings] = useState(null);
  const [joinRoomId, setJoinRoomId] = useState(null);

  const handleCreateRoom = (settings) => {
    setRoomSettings(settings);
    setShowCreateModal(false);
    setShowCharacterModal(true);
  };

  const handleJoinRoom = (roomId) => {
    setJoinRoomId(roomId);
    setShowJoinModal(false);
    setShowCharacterModal(true);
  };

  const handleCharacterSelect = ({ character, nickname }) => {
    setPlayerInfo({ character, nickname });
    
    if (roomSettings) {
      // 방 생성
      socket.emit('createRoom', { 
        ...roomSettings, 
        nickname, 
        character 
      });
      
      socket.once('roomCreated', (roomInfo) => {
        onRoomCreated(roomInfo);
      });
    } else if (joinRoomId) {
      // 방 참가
      socket.emit('joinRoom', joinRoomId, nickname, character);
      
      socket.once('roomJoined', (roomInfo) => {
        onRoomJoined(roomInfo);
      });
    }
    
    setShowCharacterModal(false);
    setRoomSettings(null);
    setJoinRoomId(null);
  };

  return (
    <div className="main-menu">
      <div className="menu-content">
        <h1 className="game-title">격투 게임</h1>
        <div className="menu-buttons">
          <button 
            className="btn-primary menu-btn"
            onClick={() => setShowCreateModal(true)}
          >
            방 생성
          </button>
          <button 
            className="btn-primary menu-btn"
            onClick={() => setShowJoinModal(true)}
          >
            방 참가
          </button>
        </div>
      </div>

      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRoom}
        />
      )}

      {showJoinModal && (
        <JoinRoomModal
          onClose={() => setShowJoinModal(false)}
          onJoin={handleJoinRoom}
        />
      )}

      {showCharacterModal && (
        <CharacterSelectModal
          onClose={() => {
            setShowCharacterModal(false);
            setRoomSettings(null);
            setJoinRoomId(null);
          }}
          onSelect={handleCharacterSelect}
        />
      )}
    </div>
  );
}

export default MainMenu;
