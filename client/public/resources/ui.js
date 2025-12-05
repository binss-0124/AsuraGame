export class UI {
  constructor() {
    this.scoreboard = document.getElementById('scoreboard');
    this.scoreboardTableBody = document.querySelector('#scoreboardTable tbody');
    this.killFeed = document.getElementById('killFeed');
    this.gameEndScreen = document.getElementById('gameEndScreen');
    this.finalScoreboard = document.getElementById('finalScoreboard');
    this.backToLobbyButton = document.getElementById('backToLobbyButton');

    this.backToLobbyButton.addEventListener('click', () => {
      window.location.reload();
    });
  }

  updateScoreboard(scores) {
    this.scoreboardTableBody.innerHTML = '';
    scores.forEach(player => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="padding: 10px;">${player.nickname}</td>
        <td style="padding: 10px;">${player.kills}</td>
        <td style="padding: 10px;">${player.deaths}</td>
      `;
      this.scoreboardTableBody.appendChild(row);
    });
  }

  showScoreboard() {
    this.scoreboard.style.display = 'block';
  }

  hideScoreboard() {
    this.scoreboard.style.display = 'none';
  }

  // attackerCharacter와 victimCharacter 매개변수 추가
  addKillFeedMessage(attackerName, victimName, attackerCharacter, victimCharacter) { //%%수정됨
    // 킬로그 컨테이너를 보이도록 설정
    this.killFeed.style.display = 'block'; //%%수정됨

    const killMessage = document.createElement('div');
    killMessage.style.display = 'flex'; // Flexbox를 사용하여 이미지와 텍스트를 정렬
    killMessage.style.alignItems = 'center'; // 세로 중앙 정렬
    killMessage.style.justifyContent = 'flex-end'; // 오른쪽 정렬
    killMessage.style.color = 'white';
    killMessage.style.marginBottom = '8px'; // 마진 증가
    killMessage.style.fontSize = '22px'; // 폰트 크기 증가
    killMessage.style.fontWeight = 'bold'; // 폰트 굵기 조정
    killMessage.style.textShadow = '1px 1px 3px rgba(0,0,0,0.9)'; // 텍스트 그림자 강화

    // 공격자 이미지
    const attackerImg = document.createElement('img');
    attackerImg.src = `./resources/character/${attackerCharacter}.png`;
    attackerImg.style.width = '40px'; // 이미지 크기 증가
    attackerImg.style.height = '40px';
    attackerImg.style.borderRadius = '50%'; // 원형 이미지
    attackerImg.style.marginRight = '8px'; // 마진 증가
    attackerImg.style.border = '2px solid #00ff00'; // 공격자 테두리 색상 및 두께 증가

    // 해골 아이콘 (킬 표시)
    const skullIcon = document.createElement('img');
    skullIcon.src = `./resources/knife_icon.png`; // 해골 아이콘 경로 (추후 추가 필요)
    skullIcon.style.width = '25px'; // 아이콘 크기 증가
    skullIcon.style.height = '25px';
    skullIcon.style.margin = '0 8px'; // 마진 증가

    // 피해자 이미지
    const victimImg = document.createElement('img');
    victimImg.src = `./resources/character/${victimCharacter}.png`;
    victimImg.style.width = '40px'; // 이미지 크기 증가
    victimImg.style.height = '40px';
    victimImg.style.borderRadius = '50%';
    victimImg.style.marginLeft = '8px'; // 마진 증가
    victimImg.style.border = '2px solid #ff0000'; // 피해자 테두리 색상 및 두께 증가

    // 텍스트 요소
    const attackerText = document.createElement('span');
    attackerText.textContent = attackerName;
    attackerText.style.color = '#00ff00'; // 공격자 닉네임 색상

    const victimText = document.createElement('span');
    victimText.textContent = victimName;
    victimText.style.color = '#ff0000'; // 피해자 닉네임 색상

    killMessage.appendChild(attackerImg);
    killMessage.appendChild(attackerText);
    killMessage.appendChild(skullIcon); // 해골 아이콘 추가
    killMessage.appendChild(victimText);
    killMessage.appendChild(victimImg);

    this.killFeed.appendChild(killMessage);

    // 메시지가 사라진 후 킬로그 컨테이너를 숨길지 결정
    setTimeout(() => {
      this.killFeed.removeChild(killMessage);
      // 모든 메시지가 사라지면 킬로그 컨테이너를 숨김
      if (this.killFeed.children.length === 0) { //%%수정됨
        this.killFeed.style.display = 'none'; //%%수정됨
      } //%%수정됨
    }, 5000);
  }

  showFinalScoreboard(finalScores) {
    // 기존 스코어보드 테이블 제거 및 새로운 디자인 적용
    this.finalScoreboard.innerHTML = ''; // 기존 내용 비우기

    const gameEndTitle = document.createElement('h2');
    gameEndTitle.textContent = 'Game Over';
    gameEndTitle.style.fontSize = '60px'; // 제목 크기 증가
    gameEndTitle.style.color = 'white';
    gameEndTitle.style.textShadow = '3px 3px 6px rgba(0,0,0,0.8)';
    gameEndTitle.style.marginBottom = '30px';
    this.finalScoreboard.appendChild(gameEndTitle);

    const finalScoreboardTable = document.createElement('table');
    finalScoreboardTable.style.color = 'white';
    finalScoreboardTable.style.width = '600px'; // 테이블 너비 증가
    finalScoreboardTable.style.borderCollapse = 'collapse';
    finalScoreboardTable.style.background = 'rgba(0, 0, 0, 0.7)'; // 배경 추가
    finalScoreboardTable.style.borderRadius = '15px'; // 둥근 모서리
    finalScoreboardTable.style.boxShadow = '0 0 25px rgba(76, 175, 80, 0.7)'; // 그림자 추가
    finalScoreboardTable.style.padding = '20px'; // 패딩 추가

    finalScoreboardTable.innerHTML = `
      <thead>
        <tr>
          <th style="padding: 15px; border-bottom: 2px solid white; font-size: 24px;">Player</th>
          <th style="padding: 15px; border-bottom: 2px solid white; font-size: 24px;">Kills</th>
          <th style="padding: 15px; border-bottom: 2px solid white; font-size: 24px;">Deaths</th>
        </tr>
      </thead>
      <tbody>
        ${finalScores.map(player => `
          <tr>
            <td style="padding: 12px; font-size: 20px;">${player.nickname}</td>
            <td style="padding: 12px; font-size: 20px;">${player.kills}</td>
            <td style="padding: 12px; font-size: 20px;">${player.deaths}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    this.finalScoreboard.appendChild(finalScoreboardTable);

    // "대기실로 돌아가기" 버튼 스타일 조정
    this.backToLobbyButton.style.padding = '20px 40px';
    this.backToLobbyButton.style.fontSize = '30px';
    this.backToLobbyButton.style.marginTop = '40px';
    this.backToLobbyButton.style.backgroundColor = '#d97d3d';
    this.backToLobbyButton.style.borderRadius = '10px';
    this.backToLobbyButton.style.boxShadow = '0 5px 15px rgba(0,0,0,0.5)';
    this.finalScoreboard.appendChild(this.backToLobbyButton); // 버튼을 finalScoreboard에 추가

    this.gameEndScreen.style.display = 'flex';
    this.gameEndScreen.style.flexDirection = 'column'; // 세로 정렬
    this.gameEndScreen.style.justifyContent = 'center'; // 수직 중앙 정렬
    this.gameEndScreen.style.alignItems = 'center'; // 수평 중앙 정렬
  }
}
