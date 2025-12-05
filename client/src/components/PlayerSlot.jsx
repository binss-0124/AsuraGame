import React from 'react';
import './PlayerSlot.css';

function PlayerSlot({ index, player, isOpen, isRoomCreator, onClose, onOpen }) {
  if (!isOpen) {
    // 닫힌 슬롯
    return (
      <div
        className={`player-slot closed ${isRoomCreator ? 'clickable' : ''}`}
        onClick={isRoomCreator ? onOpen : undefined}
      >
        <span className="slot-number">슬롯 {index + 1}</span>
        <span className="close-mark">✕</span>
      </div>
    );
  }

  if (!player) {
    // 빈 슬롯
    return (
      <div className="player-slot empty">
        <span className="slot-number">슬롯 {index + 1}</span>
        <span className="empty-text">(비어있음)</span>
        {isRoomCreator && (
          <button className="close-slot-btn" onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}>
            ✕
          </button>
        )}
      </div>
    );
  }

  // 플레이어가 있는 슬롯
  return (
    <div className={`player-slot occupied ${player.ready ? 'ready' : ''}`}>
      <img
        src={`/resources/character/${player.character}.png`}
        alt={player.nickname}
        className="player-avatar"
      />
      <div className="player-name">{player.nickname}</div>
      <div className="player-status">
        {player.ready ? '(준비)' : '(대기)'}
      </div>
      {isRoomCreator && (
        <button className="close-slot-btn" onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}>
          ✕
        </button>
      )}
    </div>
  );
}

export default PlayerSlot;
