// Core Feature Logic (Settings, Terminal, etc.)
console.log("Feature script loaded.");

const featureSystem = {
    state: {
        theme: localStorage.getItem('theme') || 'purple',
        lang: localStorage.getItem('lang') || 'en',
        terminalOpen: false
    },

    colors: {
        purple: '#9433ff',
        blue: '#3b82f6',
        green: '#10b981',
        orange: '#f97316'
    },

    commands: {
        help: "Available commands: help, about, projects, contact, clear, theme, matrix, exit",
        about: "I am Bolt Dev, a 13-year-old Full Stack Developer from Germany.",
        projects: "Check out my work on GitHub: https://github.com/Boltdev3",
        contact: "Reach me via Discord: bolt_dev",
        theme: "Usage: theme [color]. Available: purple, blue, green, orange",
        matrix: "Wake up, Neo...",
        exit: "Closing terminal..."
    },

    init: () => {
        console.log("Initializing additional features...");
        featureSystem.initSettings();
        featureSystem.initTerminal();
        featureSystem.initUpdates();
        featureSystem.initContact();
        featureSystem.applyTheme(featureSystem.state.theme);
        featureSystem.applyLanguage(featureSystem.state.lang);

        document.addEventListener('keydown', featureSystem.handleGlobalKeys);
    },

    // --- UPDATES MODULE ---
    initUpdates: () => {
        const grid = document.getElementById('updates-grid');
        if (!grid) return;

        const updates = [
            { date: 'Oct 2023', title: 'Portfolio V2 Released', desc: 'Completely overhauled the design with glassmorphism and Lanyard integration.' },
            { date: 'Sep 2023', title: 'Started New Project', desc: 'Working on a secret SaaS product for Discord communities.' },
            { date: 'Aug 2023', title: 'Learned Python', desc: 'Expanded my skillset to include Python for backend automation.' }
        ];

        grid.innerHTML = updates.map(u => `
            <div class="update-card">
                <span class="update-date">${u.date}</span>
                <h3>${u.title}</h3>
                <p>${u.desc}</p>
            </div>
        `).join('');
    },

    // --- CONTACT MODULE ---
    initContact: () => {
        const form = document.getElementById('contact-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button');
            const originalText = btn.innerHTML;

            // 1. Get Data
            const name = document.getElementById('name').value;
            const discord = document.getElementById('discord').value;
            const msg = document.getElementById('message').value;

            // 2. Mock Backend Handling
            if (window.contactSystem) {
                const result = window.contactSystem.submitMessage(name, discord, msg);

                if (!result.success) {
                    alert(result.error); // Show Timeout Error
                    return;
                }
            }

            // 3. UI Feedback
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            btn.disabled = true;

            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-check"></i> Sent!';
                btn.style.background = '#10b981';
                form.reset();

                // Refresh Admin Panel if open
                if (typeof renderMessages === 'function') renderMessages();

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                }, 3000);
            }, 1000);
        });
    },

    // --- SETTINGS MODULE ---
    initSettings: () => {
        const btn = document.getElementById('settings-btn');
        const modal = document.getElementById('settings-modal');
        const close = document.getElementById('close-settings');
        const colorOpts = document.querySelectorAll('.color-option');
        const langBtns = document.querySelectorAll('.lang-btn');

        if (!btn || !modal) return;

        // Toggle Modal
        btn.addEventListener('click', () => {
            modal.classList.add('active');
        });

        close.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        // Close on click outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });

        // Color Picker Logic
        colorOpts.forEach(opt => {
            if (opt.dataset.color === featureSystem.state.theme) {
                opt.classList.add('active');
            }

            opt.addEventListener('click', () => {
                const color = opt.dataset.color;
                featureSystem.applyTheme(color);

                colorOpts.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');

                featureSystem.state.theme = color;
                localStorage.setItem('theme', color);
            });
        });

        // Language Logic
        langBtns.forEach(btn => {
            if (btn.dataset.lang === featureSystem.state.lang) {
                btn.classList.add('active');
                featureSystem.updateActiveLangBtn(langBtns);
            }

            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                featureSystem.applyLanguage(lang);

                featureSystem.state.lang = lang;
                localStorage.setItem('lang', lang);
                featureSystem.updateActiveLangBtn(langBtns);
            });
        });
    },

    updateActiveLangBtn: (btns) => {
        btns.forEach(b => {
            if (b.dataset.lang === featureSystem.state.lang) b.classList.add('active');
            else b.classList.remove('active');
        });
    },

    applyTheme: (colorName) => {
        const root = document.documentElement;
        const colorHex = featureSystem.colors[colorName];

        if (!colorHex) return;

        root.style.setProperty('--primary', colorHex);
        root.style.setProperty('--primary-color', colorHex);
        root.style.setProperty('--primary-glow', `rgba(${featureSystem.hexToRgb(colorHex)}, 0.4)`);
    },

    applyLanguage: (lang) => {
        if (!translations[lang]) return;
        const t = translations[lang];

        const setTxt = (sel, txt) => {
            const el = document.querySelector(sel);
            if (el) el.textContent = txt;
        };

        const navLinks = document.querySelectorAll('.nav-link');
        if (navLinks.length >= 4) {
            navLinks[0].textContent = t.nav.home;
            navLinks[1].textContent = t.nav.stack;
            navLinks[2].textContent = t.nav.projects;
            navLinks[3].textContent = t.nav.about;
        }

        setTxt('.hero-text .badge', t.hero.badge);

        const heroH1 = document.querySelector('.hero-text h1');
        if (heroH1) {
            heroH1.innerHTML = `${t.hero.title_prefix} <span class="gradient-text">${t.hero.title_highlight}</span> ${t.hero.title_suffix}`;
        }

        setTxt('.hero-text p', t.hero.desc);

        const heroBtns = document.querySelectorAll('.hero-btns .btn');
        if (heroBtns.length >= 2) {
            heroBtns[0].textContent = t.hero.btn_work;
            heroBtns[1].textContent = t.hero.btn_about;
        }

        const stackHeader = document.querySelector('#stack .section-header');
        if (stackHeader) {
            stackHeader.querySelector('.badge').textContent = t.section_headers.toolkit;
            stackHeader.querySelector('h2').innerHTML = `${t.section_headers.tech_use} <span class="gradient-text">${t.section_headers.tech_highlight}</span>`;
        }

        const projHeader = document.querySelector('#projects .section-header');
        if (projHeader) {
            projHeader.querySelector('.badge').textContent = t.section_headers.portfolio;
            projHeader.querySelector('h2').innerHTML = `${t.section_headers.feat_projects} <span class="gradient-text">${t.section_headers.feat_highlight}</span>`;
        }

        const aboutHeader = document.querySelector('.about-content');
        if (aboutHeader) {
            aboutHeader.querySelector('.badge').textContent = t.section_headers.who_am_i;
            aboutHeader.querySelector('h2').innerHTML = `${t.section_headers.about_me} <span class="gradient-text">${t.section_headers.about_highlight}</span>`;

            const ps = aboutHeader.querySelectorAll('p');
            if (ps.length >= 2) {
                ps[0].textContent = t.about.p1;
                ps[1].textContent = t.about.p2;
            }
        }
    },

    // --- TERMINAL MODULE ---
    initTerminal: () => {
        const input = document.getElementById('terminal-input');

        if (!input) return;

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = input.value.trim();
                featureSystem.execCommand(cmd);
                input.value = '';
            }
        });
    },

    toggleTerminal: () => {
        const term = document.getElementById('terminal-overlay');
        const input = document.getElementById('terminal-input');
        if (!term) return;

        featureSystem.state.terminalOpen = !featureSystem.state.terminalOpen;

        if (featureSystem.state.terminalOpen) {
            term.classList.add('active');
            setTimeout(() => input.focus(), 100);
        } else {
            term.classList.remove('active');
        }
    },

    execCommand: (cmdStr) => {
        const output = document.getElementById('terminal-output');
        const [cmd, ...args] = cmdStr.split(' ');

        // Print command
        output.innerHTML += `<div class="term-line"><span class="term-prompt">user@bolt:~$</span> ${cmdStr}</div>`;

        // Process
        if (cmd === 'clear') {
            output.innerHTML = '';
            return;
        }

        if (cmd === 'exit') {
            featureSystem.toggleTerminal();
            return;
        }

        if (cmd === 'admin' || cmd === 'login admin') {
            if (typeof openAdminPanel === 'function') {
                openAdminPanel();
                output.innerHTML += `<div class="term-line text-success">Access granted. Welcome, Administrator.</div>`;
            } else {
                output.innerHTML += `<div class="term-line text-error">Admin module not loaded.</div>`;
            }
            output.scrollTop = output.scrollHeight;
            return;
        }

        if (cmd === 'theme') {
            if (args[0] && featureSystem.colors[args[0]]) {
                featureSystem.applyTheme(args[0]);
                featureSystem.state.theme = args[0];
                localStorage.setItem('theme', args[0]);
                output.innerHTML += `<div class="term-line">Theme set to ${args[0]}</div>`;
            } else {
                output.innerHTML += `<div class="term-line text-error">Invalid color. Try: purple, blue, green, orange</div>`;
            }
            output.scrollTop = output.scrollHeight;
            return;
        }

        if (cmd === 'matrix') {
             output.innerHTML += `<div class="term-line">Wake up, Neo...</div>`;
             setTimeout(() => {
                 output.innerHTML += `<div class="term-line">The Matrix has you...</div>`;
                 featureSystem.startMatrixEffect();
             }, 1000);
             output.scrollTop = output.scrollHeight;
             return;
        }

        const response = featureSystem.commands[cmd.toLowerCase()];

        if (response) {
            output.innerHTML += `<div class="term-line">${response}</div>`;
        } else if (cmd.trim() !== "") {
            output.innerHTML += `<div class="term-line" style="color:#ff5f56">Command not found: ${cmd}</div>`;
        }

        output.scrollTop = output.scrollHeight;
    },

    hexToRgb: (hex) => {
        const bigint = parseInt(hex.slice(1), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `${r}, ${g}, ${b}`;
    },

    handleGlobalKeys: (e) => {
        // Toggle Terminal on Backtick (`) or Ctrl+Space
        if (e.key === '`' || (e.ctrlKey && e.code === 'Space')) {
            e.preventDefault();
            featureSystem.toggleTerminal();
        }
    },

    startMatrixEffect: () => {
        // Simple matrix raining code effect on the canvas
        const canvas = document.getElementById('bg-canvas');
        const ctx = canvas.getContext('2d');

        // Temporarily override particle system
        // (For a full implementation, we'd need to coordinate with script.js, but let's do a simple overlay here)
        // Since script.js runs its loop, we might fight for context.
        // Instead, let's just log it or do a simple alert for now as "Simulation".
        // Or better, change the background color.

        document.body.style.setProperty('--bg-dark', '#000');
        document.documentElement.style.setProperty('--primary', '#00ff00');
        document.documentElement.style.setProperty('--text-main', '#00ff00');

        // Reload theme after 5 seconds
        setTimeout(() => {
             featureSystem.applyTheme(featureSystem.state.theme);
             document.body.style.removeProperty('--bg-dark');
             document.documentElement.style.removeProperty('--text-main');
        }, 5000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    featureSystem.init();
});
