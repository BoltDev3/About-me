const DISCORD_ID = "1181986720221253666";

/* --- CUSTOM CURSOR --- */
const cursorDot = document.getElementById('cursor-dot');
const cursorOutline = document.getElementById('cursor-outline');
let mouseX = 0, mouseY = 0;

if (window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (cursorDot) {
            cursorDot.style.left = `${mouseX}px`;
            cursorDot.style.top = `${mouseY}px`;
        }

        if (cursorOutline) {
            cursorOutline.animate({
                left: `${mouseX}px`,
                top: `${mouseY}px`
            }, { duration: 500, fill: "forwards" });
        }
    });

    // Hover Effects
    const interactables = document.querySelectorAll('a, button, .project-card, .discord-card');
    interactables.forEach(el => {
        el.addEventListener('mouseenter', () => cursorOutline.classList.add('hovered'));
        el.addEventListener('mouseleave', () => cursorOutline.classList.remove('hovered'));
    });
}

/* --- LOADER & INIT --- */
window.addEventListener('load', () => {
    const loaderBar = document.querySelector('.loader-progress-bar');

    // Simulate loading
    let width = 0;
    const interval = setInterval(() => {
        width += Math.random() * 5 + 2; // Random increment
        if (width > 100) width = 100;

        if (loaderBar) loaderBar.style.width = width + '%';

        if (width >= 100) {
            clearInterval(interval);
            // Wait a bit then trigger exit animation
            setTimeout(() => {
                document.body.classList.add('loaded');
                document.body.classList.remove('loading');

                // Initialize effects after load
                initTypingEffect();
                initParticles();
            }, 600);
        }
    }, 30);
});

/* --- LANYARD API (Discord Presence) --- */
async function updatePresence() {
    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const { data } = await response.json();

        if (!data) return;

        // 1. User Info
        const usernameEl = document.getElementById('discord-username');
        if(usernameEl) usernameEl.innerText = data.discord_user.username;

        const avatarEl = document.getElementById('discord-avatar');
        if(avatarEl) avatarEl.src = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${data.discord_user.avatar}.webp?size=128`;

        // 1.5 Badges
        const flags = data.discord_user.public_flags || 0;
        const badgesContainer = document.getElementById('discord-badges');
        if(badgesContainer) {
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
        }

        // 2. Status Indicator
        const statusEl = document.getElementById('discord-status-indicator');
        const customStatusEl = document.getElementById('discord-custom-status');

        if(statusEl) {
            statusEl.className = ''; // Reset classes
            statusEl.classList.add(`status-${data.discord_status}`);
        }

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
        if(customStatusEl) customStatusEl.innerText = statusText;

        // 3. Game Activity (Type 0)
        const gameActivity = data.activities.find(a => a.type === 0);
        const gameEl = document.getElementById('game-activity');

        if (gameActivity && gameEl) {
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

        } else if (gameEl) {
            gameEl.style.display = 'none';
        }

        // 4. Spotify Activity
        const spotifyEl = document.getElementById('spotify-activity');
        if (data.listening_to_spotify && spotifyEl) {
            spotifyEl.style.display = 'flex';
            document.getElementById('spotify-song').innerText = data.spotify.song;
            document.getElementById('spotify-artist').innerText = data.spotify.artist.replace(/;/g, ",");
            document.getElementById('spotify-art').src = data.spotify.album_art_url;
            
            const total = data.spotify.timestamps.end - data.spotify.timestamps.start;
            const current = Date.now() - data.spotify.timestamps.start;
            const percentage = (current / total) * 100;
            document.getElementById('spotify-progress').style.width = `${Math.min(100, percentage)}%`;
        } else if (spotifyEl) {
            spotifyEl.style.display = 'none';
        }

    } catch (error) {
        console.error("Lanyard Error:", error);
    }
}

// Update every second for time/progress
setInterval(updatePresence, 1000);
updatePresence();


/* --- 3D TILT EFFECT --- */
function initTilt(selector, maxTilt = 10) {
    const elements = document.querySelectorAll(selector);

    elements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const xCenter = rect.width / 2;
            const yCenter = rect.height / 2;

            const rotateX = ((y - yCenter) / yCenter) * -maxTilt;
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

function initTypingEffect() {
    const target = document.querySelector('.gradient-text');
    if(!target) return;

    const words = ["Digital", "Immersive", "Powerful", "Creative"];
    let wordIndex = 0;
    let charIndex = words[0].length; // Start fully typed
    let isDeleting = false;

    function type() {
        const currentWord = words[wordIndex];
        let typeSpeed = 100;

        if (isDeleting) {
            target.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50;
        } else {
            target.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 150;
        }

        if (!isDeleting && charIndex === currentWord.length) {
            isDeleting = true;
            typeSpeed = 2000; // Pause before deleting
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typeSpeed = 500; // Pause before typing next
        }

        setTimeout(type, typeSpeed);
    }

    // Start after a slight delay
    setTimeout(type, 1000);
}

function initParticles() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height;
    let particles = [];

    const resize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2 + 1;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if(this.x < 0 || this.x > width) this.vx *= -1;
            if(this.y < 0 || this.y > height) this.vy *= -1;
        }
        draw() {
            ctx.fillStyle = 'rgba(148, 51, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const particleCount = window.innerWidth < 768 ? 30 : 60;
    for(let i=0; i<particleCount; i++) particles.push(new Particle());

    function animate() {
        ctx.clearRect(0,0,width,height);

        particles.forEach((p, index) => {
            p.update();
            p.draw();

            // Connect particles
            for(let j=index; j<particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if(dist < 150) {
                    ctx.strokeStyle = `rgba(148, 51, 255, ${0.1 - dist/1500})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }

            // Connect to mouse
            const dx = p.x - mouseX;
            const dy = p.y - mouseY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < 200) {
                ctx.strokeStyle = `rgba(0, 242, 255, ${0.15})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(mouseX, mouseY);
                ctx.stroke();
            }
        });

        requestAnimationFrame(animate);
    }
    animate();
}
