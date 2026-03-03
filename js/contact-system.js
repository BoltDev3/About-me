/**
 * Mock Backend System using LocalStorage
 * Handles Contact Messages and User Bans/Timeouts
 */

const DB_KEYS = {
    MESSAGES: 'bolt_contact_messages',
    BANS: 'bolt_user_bans'
};

class ContactSystem {
    constructor() {
        this.messages = this._load(DB_KEYS.MESSAGES) || [];
        this.bans = this._load(DB_KEYS.BANS) || {};
    }

    _load(key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (e) {
            return null;
        }
    }

    _save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // --- Message Handling ---

    submitMessage(name, discordTag, content) {
        // 1. Check Ban Status
        const banCheck = this.checkBan(discordTag);
        if (banCheck.isBanned) {
            return {
                success: false,
                error: `You are timed out. Try again in ${banCheck.remaining}.`
            };
        }

        // 2. Create Message Object
        const msg = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            timestamp: Date.now(),
            name,
            discordTag,
            content,
            status: 'pending' // pending, approved
        };

        // 3. Save
        this.messages.unshift(msg); // Newest first
        this._save(DB_KEYS.MESSAGES, this.messages);

        return { success: true, message: 'Message sent successfully!' };
    }

    getMessages() {
        return this.messages;
    }

    deleteMessage(id) {
        this.messages = this.messages.filter(m => m.id !== id);
        this._save(DB_KEYS.MESSAGES, this.messages);
    }

    approveMessage(id) {
        const msg = this.messages.find(m => m.id === id);
        if (msg) {
            msg.status = 'approved';
            this._save(DB_KEYS.MESSAGES, this.messages);
        }
    }

    // --- Ban / Timeout Handling ---

    timeoutUser(discordTag, durationMinutes) {
        const releaseTime = Date.now() + (durationMinutes * 60 * 1000);
        this.bans[discordTag] = releaseTime;
        this._save(DB_KEYS.BANS, this.bans);
    }

    checkBan(discordTag) {
        if (!this.bans[discordTag]) return { isBanned: false };

        const releaseTime = this.bans[discordTag];
        const now = Date.now();

        if (now > releaseTime) {
            // Ban expired
            delete this.bans[discordTag];
            this._save(DB_KEYS.BANS, this.bans);
            return { isBanned: false };
        }

        // Still banned
        const remainingMs = releaseTime - now;
        const minutes = Math.ceil(remainingMs / 60000);
        return { isBanned: true, remaining: `${minutes}m` };
    }
}

// Export singleton
window.contactSystem = new ContactSystem();
