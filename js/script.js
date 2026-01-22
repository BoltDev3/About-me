const DISCORD_ID = "1181986720221253666";

/* --- CUSTOM CURSOR --- */
const cursorDot = document.getElementById('cursor-dot');
const cursorOutline = document.getElementById('cursor-outline');

if (window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 500, fill: "forwards" });
    });
}

/* --- LOADER --- */
window.addEventListener('load', () => {
    let progress = 0;
    const bar = document.querySelector('.loader-bar-fill');
    const percentTxt = document.querySelector('.percent');

    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 5) + 2;
        if (progress > 100) progress = 100;

        if (bar) bar.style.width = `${progress}%`;
        if (percentTxt) percentTxt.innerText = `${progress}%`;

        if (progress === 100) {
            clearInterval(interval);
            setTimeout(() => {
                document.body.classList.add('loaded');
                document.body.classList.remove('loading');
            }, 500);
        }
    }, 50);
});

/* --- LANYARD API (Discord Presence) --- */
async function updatePresence() {
    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const { data } = await response.json();

        if (!data) return;

        // 1. User Info
        document.getElementById('discord-username').innerText = data.discord_user.username;
        document.getElementById('discord-avatar').src = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${data.discord_user.avatar}.webp?size=128`;

        // 2. Status Indicator
        const statusEl = document.getElementById('discord-status-indicator');
        const customStatusEl = document.getElementById('discord-custom-status');

        statusEl.className = ''; // Reset classes
        statusEl.classList.add(`status-${data.discord_status}`);

        // Custom Status Text
        const statusMap = {
            online: "Online",
            idle: "Idle",
            dnd: "Do Not Disturb",
            offline: "Offline"
        };
        
        // Prioritize Activity text, then Custom Status, then Basic Status
        let statusText = statusMap[data.discord_status];
        const customActivity = data.activities.find(a => a.type === 4);
        if (customActivity && customActivity.state) {
            statusText = customActivity.state;
        }
        customStatusEl.innerText = statusText;

        // 3. Game Activity (Type 0)
        const gameActivity = data.activities.find(a => a.type === 0);
        const gameEl = document.getElementById('game-activity');

        if (gameActivity) {
            gameEl.style.display = 'flex';
            document.getElementById('game-name').innerText = gameActivity.name;
            document.getElementById('game-details').innerText = gameActivity.details || "Playing";
            document.getElementById('game-state').innerText = gameActivity.state || "";

            // Image Logic
            const gameImg = document.getElementById('game-image');
            if (gameActivity.assets && gameActivity.assets.large_image) {
                let imgUrl = gameActivity.assets.large_image;
                if (imgUrl.startsWith("mp:external")) {
                    imgUrl = imgUrl.replace(/mp:external\/([^\/]*)\/(https?:\/\/.*)/, '$2');
                } else if (!imgUrl.startsWith("http")) {
                     imgUrl = `https://cdn.discordapp.com/app-assets/${gameActivity.application_id}/${gameActivity.assets.large_image}.png`;
                }
                gameImg.src = imgUrl;
            } else {
                gameImg.src = "https://cdn.discordapp.com/embed/avatars/0.png"; // Fallback
            }

            // Time Elapsed
            if (gameActivity.timestamps && gameActivity.timestamps.start) {
                const elapsed = Date.now() - gameActivity.timestamps.start;
                const hours = Math.floor(elapsed / 3600000);
                const minutes = Math.floor((elapsed % 3600000) / 60000);
                document.getElementById('game-time').innerText = `${hours > 0 ? hours + 'h ' : ''}${minutes}m elapsed`;
            } else {
                document.getElementById('game-time').innerText = "";
            }

        } else {
            gameEl.style.display = 'none';
        }

        // 4. Spotify Activity
        const spotifyEl = document.getElementById('spotify-activity');
        if (data.listening_to_spotify) {
            spotifyEl.style.display = 'flex';
            document.getElementById('spotify-song').innerText = data.spotify.song;
            document.getElementById('spotify-artist').innerText = data.spotify.artist.replace(/;/g, ",");
            document.getElementById('spotify-art').src = data.spotify.album_art_url;
            
            const total = data.spotify.timestamps.end - data.spotify.timestamps.start;
            const current = Date.now() - data.spotify.timestamps.start;
            const percentage = (current / total) * 100;
            document.getElementById('spotify-progress').style.width = `${Math.min(100, percentage)}%`;
        } else {
            spotifyEl.style.display = 'none';
        }

    } catch (error) {
        console.error("Lanyard Error:", error);
    }
}

// Update every second for time/progress
setInterval(updatePresence, 1000);
updatePresence();

/* --- SCROLL REVEAL --- */
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
