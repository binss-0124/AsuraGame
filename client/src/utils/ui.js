export class UI {
  constructor(options = {}) {
    this.scoreboard = document.getElementById('scoreboard');
    this.scoreboardTableBody = document.querySelector('#scoreboardTable tbody');
    this.killFeed = document.getElementById('killFeed');
    this.gameEndScreen = document.getElementById('gameEndScreen');
    this.finalScoreboard = document.getElementById('finalScoreboard');
    this.backToLobbyButton = document.getElementById('backToLobbyButton');
    this.onBackToLobbyClick = options.onBackToLobbyClick || null;

    if (this.backToLobbyButton) {
      this.backToLobbyButton.addEventListener('click', () => {
        if (this.onBackToLobbyClick) {
          this.onBackToLobbyClick();
        } else {
          window.location.reload();
        }
      });
    }
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

  addKillFeedMessage(attackerName, victimName, attackerCharacter, victimCharacter) {
    this.killFeed.style.display = 'block';

    const killMessage = document.createElement('div');
    killMessage.style.display = 'flex';
    killMessage.style.alignItems = 'center';
    killMessage.style.justifyContent = 'flex-end';
    killMessage.style.color = 'white';
    killMessage.style.marginBottom = '8px';
    killMessage.style.fontSize = '22px';
    killMessage.style.fontWeight = 'bold';
    killMessage.style.textShadow = '1px 1px 3px rgba(0,0,0,0.9)';

    const attackerImg = document.createElement('img');
    attackerImg.src = `./resources/character/${attackerCharacter}.png`;
    attackerImg.style.width = '40px';
    attackerImg.style.height = '40px';
    attackerImg.style.borderRadius = '50%';
    attackerImg.style.marginRight = '8px';
    attackerImg.style.border = '2px solid #00ff00';

    const skullIcon = document.createElement('img');
    skullIcon.src = `./resources/knife_icon.png`;
    skullIcon.style.width = '25px';
    skullIcon.style.height = '25px';
    skullIcon.style.margin = '0 8px';

    const victimImg = document.createElement('img');
    victimImg.src = `./resources/character/${victimCharacter}.png`;
    victimImg.style.width = '40px';
    victimImg.style.height = '40px';
    victimImg.style.borderRadius = '50%';
    victimImg.style.marginLeft = '8px';
    victimImg.style.border = '2px solid #ff0000';

    const attackerText = document.createElement('span');
    attackerText.textContent = attackerName;
    attackerText.style.color = '#00ff00';

    const victimText = document.createElement('span');
    victimText.textContent = victimName;
    victimText.style.color = '#ff0000';

    killMessage.appendChild(attackerImg);
    killMessage.appendChild(attackerText);
    killMessage.appendChild(skullIcon);
    killMessage.appendChild(victimText);
    killMessage.appendChild(victimImg);

    this.killFeed.appendChild(killMessage);

    setTimeout(() => {
      this.killFeed.removeChild(killMessage);
      if (this.killFeed.children.length === 0) {
        this.killFeed.style.display = 'none';
      }
    }, 5000);
  }

  showFinalScoreboard(finalScores) {
    this.finalScoreboard.innerHTML = '';

    const gameEndTitle = document.createElement('h2');
    gameEndTitle.textContent = 'Game Over';
    gameEndTitle.style.fontSize = '60px';
    gameEndTitle.style.color = 'white';
    gameEndTitle.style.textShadow = '3px 3px 6px rgba(0,0,0,0.8)';
    gameEndTitle.style.marginBottom = '30px';
    this.finalScoreboard.appendChild(gameEndTitle);

    const finalScoreboardTable = document.createElement('table');
    finalScoreboardTable.style.color = 'white';
    finalScoreboardTable.style.width = '600px';
    finalScoreboardTable.style.borderCollapse = 'collapse';
    finalScoreboardTable.style.background = 'rgba(0, 0, 0, 0.7)';
    finalScoreboardTable.style.borderRadius = '15px';
    finalScoreboardTable.style.boxShadow = '0 0 25px rgba(76, 175, 80, 0.7)';
    finalScoreboardTable.style.padding = '20px';

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

    this.backToLobbyButton.style.padding = '20px 40px';
    this.backToLobbyButton.style.fontSize = '30px';
    this.backToLobbyButton.style.marginTop = '40px';
    this.backToLobbyButton.style.backgroundColor = '#d97d3d';
    this.backToLobbyButton.style.borderRadius = '10px';
    this.backToLobbyButton.style.boxShadow = '0 5px 15px rgba(0,0,0,0.5)';
    this.finalScoreboard.appendChild(this.backToLobbyButton);

    this.gameEndScreen.style.display = 'flex';
    this.gameEndScreen.style.flexDirection = 'column';
    this.gameEndScreen.style.justifyContent = 'center';
    this.gameEndScreen.style.alignItems = 'center';
  }
}
