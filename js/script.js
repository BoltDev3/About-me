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

        // 1.5 Badges
        const flags = data.discord_user.public_flags || 0;
        const badgesContainer = document.getElementById('discord-badges');
        badgesContainer.innerHTML = ''; // Clear existing

        // Badge Logic (Bitwise) with FontAwesome Icons
        const badges = [
            { name: 'HypeSquad Bravery', val: 64, icon: '<i class="fas fa-shield-alt" style="color: #9c84ef;"></i>' },
            { name: 'HypeSquad Brilliance', val: 128, icon: '<i class="fas fa-shield-alt" style="color: #f47fff;"></i>' },
            { name: 'HypeSquad Balance', val: 256, icon: '<i class="fas fa-shield-alt" style="color: #1abc9c;"></i>' },
            { name: 'Bug Hunter I', val: 8, icon: '<i class="fas fa-bug" style="color: #43b581;"></i>' },
            { name: 'Bug Hunter II', val: 16384, icon: '<i class="fas fa-bug" style="color: #faa61a;"></i>' },
            { name: 'Developer', val: 131072, icon: '<i class="fas fa-code" style="color: #fff;"></i>' },
            { name: 'Active Developer', val: 4194304, icon: '<i class="fas fa-hammer" style="color: #fff;"></i>' },
            { name: 'Early Supporter', val: 512, icon: '<i class="fas fa-gem" style="color: #7289da;"></i>' }
        ];

        badges.forEach(badge => {
            if ((flags & badge.val) === badge.val) {
                const div = document.createElement('div');
                div.className = 'badge-icon';
                div.innerHTML = badge.icon;
                div.title = badge.name;
                badgesContainer.appendChild(div);
            }
        });

        // Nitro check (approximate)
        if (data.discord_user.avatar && data.discord_user.avatar.startsWith('a_')) {
             const div = document.createElement('div');
             div.className = 'badge-icon';
             div.innerHTML = '<i class="fas fa-bolt" style="color: #f47fff;"></i>';
             div.title = "Nitro";
             badgesContainer.appendChild(div);
        }

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

/* --- 3D TILT EFFECT --- */
function initTilt(selector, maxTilt = 10) {
    const elements = document.querySelectorAll(selector);

    elements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element.
            const y = e.clientY - rect.top;  // y position within the element.

            const xCenter = rect.width / 2;
            const yCenter = rect.height / 2;

            // Calculate rotation:
            // If mouse is left of center (x < xCenter), rotate Y negative? No, Y positive creates left-down look.
            // Let's standard: mouse left -> rotateY negative. mouse right -> rotateY positive.
            // mouse top -> rotateX positive. mouse bottom -> rotateX negative.

            const rotateX = ((y - yCenter) / yCenter) * -maxTilt; // Invert for natural tilt
            const rotateY = ((x - xCenter) / xCenter) * maxTilt;

            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        el.addEventListener('mouseleave', () => {
            el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
        });
    });
}

// Initialize Tilt on Cards
if (window.matchMedia("(pointer: fine)").matches) {
    initTilt('.discord-card', 5);
    initTilt('.project-card', 8);
    initTilt('.stack-item', 15);
}

/* --- TYPING EFFECT --- */
const textToType = "Digital";
const typeTarget = document.querySelector('.gradient-text');
// Only run if element exists and not already animated
if (typeTarget && !typeTarget.classList.contains('typing-done')) {
    // Wait for initial fade in
    setTimeout(() => {
        // Simple blinking cursor effect handled in CSS mostly,
        // but if we want to re-type it:
        // Actually, let's leave the CSS animation for gradient and just add a class for cursor.
    }, 2000);
}
