import React, { useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import './GamePage.css';

function GamePage({ roomInfo, playerInfo, gameData, onGameEnd }) {
  const { socket } = useSocket();
  const containerRef = useRef(null);
  const gameInstanceRef = useRef(null);

  useEffect(() => {
    // gameData가 전달되어 옴 (App.jsx에서 WaitingRoom의 onGameStart로부터)
    if (!gameData || !socket || !containerRef.current) {
      console.log('[GamePage] useEffect: gameData, socket, 또는 containerRef가 없음', { 
        hasGameData: !!gameData, 
        hasSocket: !!socket, 
        hasContainerRef: !!containerRef.current 
      });
      return;
    }

    console.log('[GamePage] useEffect: gameData 수신됨:', gameData);
    handleGameStart(gameData);
  }, [gameData, socket]);

  const handleGameStart = async (gameData) => {
    console.log('[GamePage] handleGameStart 호출:', gameData);

    // 동적으로 게임 모듈 로드
    const { GameStage1 } = await import('../game/GameStage1');
    console.log('[GamePage] GameStage1 모듈 로드 완료');

    // 게임 시작 카운트다운
    let count = 3;
    const countdownElement = document.getElementById('gameStartCountdown');
    if (countdownElement) {
      countdownElement.textContent = `잠시 후 게임이 시작됩니다... ${count}`;
      const countdownInterval = setInterval(() => {
        count--;
        countdownElement.textContent = `잠시 후 게임이 시작됩니다... ${count}`;
        console.log(`[GamePage] 카운트다운: ${count}`);
        if (count === 0) {
          clearInterval(countdownInterval);
          countdownElement.style.display = 'none';
          
          // 게임 인스턴스 생성
          try {
            gameInstanceRef.current = new GameStage1(
              socket,
              gameData.players,
              gameData.map,
              gameData.spawnedWeapons,
              () => {
                // 대기실로 돌아가기
                console.log('[GamePage] onGameEnd 호출 - 메인 화면으로 이동');
                onGameEnd();
              }
            );
            console.log('[GamePage] GameStage1 인스턴스 생성 완료');
            socket.emit('gameStart');
            console.log('[GamePage] gameStart 이벤트 서버로 emit');
          } catch (error) {
            console.error('[GamePage] GameStage1 생성 중 오류:', error);
          }
        }
      }, 1000);
    } else {
      console.log('[GamePage] countdownElement가 없음');
    }

    // 타이머 업데이트
    socket.on('updateTimer', (data) => {
      console.log('[GamePage] updateTimer 이벤트 수신:', data);
      const time = typeof data === 'object' ? data.time : data;
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      const timerElement = document.getElementById('timer');
      if (timerElement) {
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        timerElement.style.display = 'block';
      }
    });

    // 게임 종료
    socket.on('gameEnd', (finalScores) => {
      console.log('[GamePage] gameEnd 이벤트 수신:', finalScores);
      if (gameInstanceRef.current && gameInstanceRef.current.ui) {
        gameInstanceRef.current.ui.showFinalScoreboard(finalScores);
      }
    });
  };

  return (
    <div className="game-page">
      <div id="container" ref={containerRef}></div>
      
      <div className="game-ui-container">
        <div id="gameStartCountdown" className="game-countdown">
          잠시 후 게임이 시작됩니다
        </div>
        
        <div id="timer" className="game-timer"></div>
        
        <div id="killFeed" className="kill-feed"></div>
        
        <div id="scoreboard" className="scoreboard">
          <table id="scoreboardTable">
            <thead>
              <tr>
                <th>Player</th>
                <th>Kills</th>
                <th>Deaths</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
        
        <div id="gameEndScreen" className="game-end-screen">
          <div id="finalScoreboard" className="final-scoreboard"></div>
          <button id="backToLobbyButton" className="back-to-lobby-btn">대기실로 돌아가기</button>
        </div>
      </div>
    </div>
  );
}

export default GamePage;
