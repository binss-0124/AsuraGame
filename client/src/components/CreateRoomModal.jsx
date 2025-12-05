import React, { useState } from 'react';
import './CreateRoomModal.css';

function CreateRoomModal({ onClose, onCreate }) {
  const [roomName, setRoomName] = useState('');
  const [selectedMap, setSelectedMap] = useState('map1');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [visibility, setVisibility] = useState('public');
  const [roundTime, setRoundTime] = useState(180);

  const handleCreate = () => {
    if (!roomName.trim()) {
      alert('방 이름을 입력해주세요.');
      return;
    }

    onCreate({
      map: selectedMap,
      maxPlayers,
      visibility,
      roundTime,
      roomName: roomName.trim(),
    });
  };

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content create-room-modal" onClick={(e) => e.stopPropagation()}>
        <h2>방 생성 설정</h2>
        
        <div className="form-group">
          <label>방 이름:</label>
          <input
            type="text"
            className="input-field"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="방 이름을 입력하세요"
            maxLength={30}
          />
        </div>

        <div className="form-group">
          <label>맵 선택:</label>
          <div className="map-selection">
            <div
              className={`map-thumbnail ${selectedMap === 'map1' ? 'selected' : ''}`}
              onClick={() => setSelectedMap('map1')}
            >
              <img src="/resources/Map1.png" alt="Map 1" />
              <p>도시</p>
            </div>
            <div className={`map-thumbnail ${selectedMap === 'map2' ? 'selected' : ''}`}>
              <img src="/resources/Map2.png" alt="Map 2" />
              <div className="map-overlay">추후 추가 예정</div>
              <p>당구대</p>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>최대 인원:</label>
          <input
            type="number"
            className="input-field"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Math.min(8, Math.max(2, parseInt(e.target.value) || 2)))}
            min="2"
            max="8"
          />
        </div>

        <div className="form-group">
          <label>방 공개 여부:</label>
          <select
            className="select-field"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="public">공개</option>
            <option value="private">비밀</option>
          </select>
        </div>

        <div className="form-group">
          <label>라운드 시간 (초):</label>
          <div className="round-time-options">
            {[120, 150, 180, 210, 240].map((time) => (
              <button
                key={time}
                type="button"
                className={`round-time-btn ${roundTime === time ? 'selected' : ''}`}
                onClick={() => setRoundTime(time)}
              >
                {time}초
              </button>
            ))}
          </div>
        </div>

        <div className="modal-buttons">
          <button className="btn-primary" onClick={handleCreate}>
            생성
          </button>
          <button className="btn-secondary" onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateRoomModal;
