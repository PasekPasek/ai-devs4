import { Session, Message } from './types';
import { SYSTEM_PROMPT } from './system-prompt';
import { config } from './config';

export class SessionManager {
  private sessions = new Map<string, Session>();

  constructor() {
    // Cleanup every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  get(sessionID: string): Session | undefined {
    const session = this.sessions.get(sessionID);
    if (session) {
      session.lastAccessedAt = Date.now();
    }
    return session;
  }

  getOrCreate(sessionID: string): Session {
    let session = this.get(sessionID);
    if (!session) {
      session = this.create(sessionID);
    }
    return session;
  }

  create(sessionID: string): Session {
    const session: Session = {
      sessionID,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }],
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      metadata: {}
    };
    this.sessions.set(sessionID, session);
    console.log(`[SESSION] Created: ${sessionID}`);
    return session;
  }

  update(session: Session): void {
    session.lastAccessedAt = Date.now();
    this.sessions.set(session.sessionID, session);
  }

  private cleanup() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [id, session] of this.sessions) {
      if (now - session.lastAccessedAt > config.SESSION_TIMEOUT_MS) {
        this.sessions.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[SESSION] Cleaned up ${cleanedCount} expired session(s)`);
    }
  }

  getStats(): { total: number; active: number } {
    const now = Date.now();
    const activeThreshold = 5 * 60 * 1000; // 5 minutes
    let active = 0;

    for (const session of this.sessions.values()) {
      if (now - session.lastAccessedAt < activeThreshold) {
        active++;
      }
    }

    return {
      total: this.sessions.size,
      active
    };
  }
}
