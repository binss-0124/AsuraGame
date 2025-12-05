import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import './JoinRoomModal.css';

function JoinRoomModal({ onClose, onJoin }) {
  const { socket } = useSocket();
  const [publicRooms, setPublicRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [privateRoomCode, setPrivateRoomCode] = useState('');

  useEffect(() => {
    if (!socket) return;

    socket.emit('getPublicRooms');

    socket.on('publicRoomsList', (rooms) => {
      setPublicRooms(rooms);
    });

    return () => {
      socket.off('publicRoomsList');
    };
  }, [socket]);

  const handleJoin = () => {
    const roomId = selectedRoomId || privateRoomCode.trim();
    
    if (!roomId) {
      alert('공개방을 선택하거나 비밀방 코드를 입력해주세요.');
      return;
    }

    onJoin(roomId);
  };

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content join-room-modal" onClick={(e) => e.stopPropagation()}>
        <h2>방 참가</h2>
        
        <div className="public-rooms-section">
          <h3>공개방 목록</h3>
          <div className="public-rooms-list">
            {publicRooms.length === 0 ? (
              <div className="no-rooms">공개방이 없습니다.</div>
            ) : (
              publicRooms.map((room) => (
                <div
                  key={room.id}
                  className={`room-item ${selectedRoomId === room.id ? 'selected' : ''} ${room.status === 'playing' ? 'disabled' : ''}`}
                  onClick={() => room.status !== 'playing' && setSelectedRoomId(room.id)}
                >
                  <div className="room-info">
                    <span className="room-name">{room.name}</span>
                    <span className="room-details">
                      ({room.players}/{room.maxPlayers} 명 | {room.map})
                    </span>
                  </div>
                  <span className={`room-status ${room.status}`}>
                    {room.status === 'playing' ? '게임중' : '대기중'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="divider">또는</div>

        <div className="private-room-section">
          <h3>비밀방 참가</h3>
          <input
            type="text"
            className="input-field"
            value={privateRoomCode}
            onChange={(e) => {
              setPrivateRoomCode(e.target.value);
              setSelectedRoomId(null);
            }}
            placeholder="비밀방 코드 입력"
          />
        </div>

        <div className="modal-buttons">
          <button className="btn-primary" onClick={handleJoin}>
            입장
          </button>
          <button className="btn-secondary" onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

export default JoinRoomModal;
