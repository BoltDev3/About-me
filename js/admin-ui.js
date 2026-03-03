document.addEventListener('DOMContentLoaded', () => {
    initAdminPanel();
    hookTerminalCommand();
});

let currentTimeoutTarget = null;
let currentTab = 'inbox';

function initAdminPanel() {
    // 1. Tab Switching
    document.querySelectorAll('.channel-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.channel-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            currentTab = item.dataset.tab;

            // Update Topbar
            const topbarHash = document.querySelector('.admin-topbar .hashtag');
            const topbarText = document.querySelector('.admin-topbar');
            topbarText.innerHTML = `<span class="hashtag">#</span> ${currentTab}`;

            renderMessages();
        });
    });

    // 2. Timeout Modal
    const modal = document.getElementById('timeout-modal');
    const cancelBtn = document.getElementById('cancel-timeout');
    const confirmBtn = document.getElementById('confirm-timeout');
    const options = document.querySelectorAll('.timeout-opt');

    // Option Selection
    let selectedDuration = 10;
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            options.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedDuration = parseInt(opt.dataset.time);
        });
    });

    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        currentTimeoutTarget = null;
    });

    confirmBtn.addEventListener('click', () => {
        if (currentTimeoutTarget && window.contactSystem) {
            window.contactSystem.timeoutUser(currentTimeoutTarget, selectedDuration);
            modal.classList.remove('active');
            renderMessages(); // Refresh UI
            alert(`User ${currentTimeoutTarget} timed out for ${selectedDuration} mins.`);
        }
    });

    // Close on click outside
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('admin-panel').classList.contains('active')) {
            document.getElementById('admin-panel').classList.remove('active');
        }
    });
}

function hookTerminalCommand() {
    // We hook into the existing terminal input
    const terminalInput = document.getElementById('terminal-input');
    if (!terminalInput) return;

    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = terminalInput.value.trim().toLowerCase();
            // Allow a small delay so the original terminal logic runs first (if needed)
            // But here we intercept specific commands
            setTimeout(() => {
                if (val === 'admin' || val === 'login admin') {
                    openAdminPanel();
                }
            }, 50);
        }
    });
}

function openAdminPanel() {
    const panel = document.getElementById('admin-panel');
    panel.classList.add('active');
    renderMessages();

    // Also close terminal if it's open, to focus on admin
    const termOverlay = document.getElementById('terminal-overlay');
    if (termOverlay) termOverlay.classList.remove('active');
}

function renderMessages() {
    const list = document.getElementById('admin-msg-list');
    list.innerHTML = '';

    if (!window.contactSystem) return;

    if (currentTab === 'inbox') {
        const msgs = window.contactSystem.getMessages();
        if (msgs.length === 0) {
            list.innerHTML = '<div style="padding:20px; text-align:center; color:#72767d;">No messages found.</div>';
            return;
        }

        msgs.forEach(msg => {
            const el = createMessageElement(msg);
            list.appendChild(el);
        });
    } else if (currentTab === 'banned') {
        // Render bans
        const bans = window.contactSystem.bans;
        const tags = Object.keys(bans);

        if (tags.length === 0) {
            list.innerHTML = '<div style="padding:20px; text-align:center; color:#72767d;">No active bans.</div>';
            return;
        }

        tags.forEach(tag => {
            const check = window.contactSystem.checkBan(tag);
            if (check.isBanned) {
                const el = document.createElement('div');
                el.className = 'discord-msg';
                el.innerHTML = `
                    <div class="msg-avatar" style="background:#f04747;">
                        <i class="fas fa-ban"></i>
                    </div>
                    <div class="msg-content">
                        <div class="msg-header">
                            <span class="msg-username">${tag}</span>
                            <span class="msg-timestamp">Banned</span>
                        </div>
                        <div class="msg-body">Time remaining: ${check.remaining}</div>
                    </div>
                `;
                list.appendChild(el);
            }
        });
    }
}

function createMessageElement(msg) {
    const div = document.createElement('div');
    div.className = 'discord-msg';

    // Avatar Logic (Random color or default)
    const avatarUrl = "https://cdn.discordapp.com/embed/avatars/0.png";

    // Format Time
    const date = new Date(msg.timestamp);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString();

    div.innerHTML = `
        <div class="msg-actions">
            <div class="action-btn approve" title="Approve/Keep"><i class="fas fa-check"></i></div>
            <div class="action-btn timeout" title="Timeout User"><i class="fas fa-clock"></i></div>
            <div class="action-btn deny" title="Delete"><i class="fas fa-trash"></i></div>
        </div>
        <div class="msg-avatar">
            <img src="${avatarUrl}" alt="User">
        </div>
        <div class="msg-content">
            <div class="msg-header">
                <span class="msg-username">${escapeHtml(msg.name)} <span style="font-size:0.8em; color:#b9bbbe;">(${escapeHtml(msg.discordTag)})</span></span>
                <span class="msg-timestamp">${dateStr} at ${timeStr}</span>
            </div>
            <div class="msg-body">${escapeHtml(msg.content)}</div>
        </div>
    `;

    // Bind Actions
    const approveBtn = div.querySelector('.approve');
    const denyBtn = div.querySelector('.deny');
    const timeoutBtn = div.querySelector('.timeout');

    approveBtn.addEventListener('click', () => {
        window.contactSystem.approveMessage(msg.id);
        div.style.opacity = '0.5'; // Visual feedback
        div.style.borderLeft = '3px solid #43b581';
    });

    denyBtn.addEventListener('click', () => {
        if(confirm('Delete this message?')) {
            window.contactSystem.deleteMessage(msg.id);
            renderMessages();
        }
    });

    timeoutBtn.addEventListener('click', () => {
        currentTimeoutTarget = msg.discordTag;
        document.getElementById('timeout-modal').classList.add('active');
    });

    return div;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
