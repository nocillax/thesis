import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Between } from 'typeorm';
import { AdminSession } from '../entities/admin-session.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(AdminSession)
    private sessionRepository: Repository<AdminSession>,
  ) {}

  /**
   * Create a new login session
   */
  async createSession(
    walletAddress: string,
    userName: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AdminSession> {
    const session = this.sessionRepository.create({
      wallet_address: walletAddress,
      user_name: userName,
      login_at: new Date(),
      session_status: 'active',
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return this.sessionRepository.save(session);
  }

  /**
   * Mark session as logged out
   */
  async logoutSession(walletAddress: string): Promise<void> {
    const activeSessions = await this.sessionRepository.find({
      where: {
        wallet_address: walletAddress,
        session_status: 'active',
      },
    });

    const now = new Date();
    for (const session of activeSessions) {
      session.logout_at = now;
      session.session_status = 'logged_out';
      await this.sessionRepository.save(session);
    }
  }

  /**
   * Mark expired sessions (JWT expiry = 60 mins)
   */
  async markExpiredSessions(): Promise<void> {
    const expiryThreshold = new Date(Date.now() - 60 * 60 * 1000); // 60 minutes ago

    const expiredSessions = await this.sessionRepository.find({
      where: {
        session_status: 'active',
        login_at: LessThan(expiryThreshold),
      },
    });

    for (const session of expiredSessions) {
      session.logout_at = new Date(session.login_at.getTime() + 60 * 60 * 1000);
      session.session_status = 'expired';
      await this.sessionRepository.save(session);
    }
  }

  /**
   * Get all sessions with pagination
   */
  async getAllSessions(
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    data: AdminSession[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.sessionRepository.findAndCount({
      order: { login_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  /**
   * Get sessions for a specific user
   */
  async getUserSessions(
    walletAddress: string,
    limit: number = 10,
  ): Promise<AdminSession[]> {
    return this.sessionRepository.find({
      where: { wallet_address: walletAddress },
      order: { login_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get offline periods (when user was logged out or session expired)
   * Returns array of {start, end} timestamps
   */
  async getOfflinePeriods(
    walletAddress: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Array<{ start: Date; end: Date; duration_minutes: number }>> {
    const sessions = await this.sessionRepository.find({
      where: { wallet_address: walletAddress },
      order: { login_at: 'ASC' },
    });

    const offlinePeriods: Array<{
      start: Date;
      end: Date;
      duration_minutes: number;
    }> = [];

    for (let i = 0; i < sessions.length - 1; i++) {
      const currentSession = sessions[i];
      const nextSession = sessions[i + 1];

      const offlineStart =
        currentSession.logout_at ||
        new Date(currentSession.login_at.getTime() + 60 * 60 * 1000);
      const offlineEnd = nextSession.login_at;

      // Filter by date range if provided
      if (startDate && offlineEnd < startDate) continue;
      if (endDate && offlineStart > endDate) continue;

      const durationMs = offlineEnd.getTime() - offlineStart.getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));

      if (durationMinutes > 0) {
        offlinePeriods.push({
          start: offlineStart,
          end: offlineEnd,
          duration_minutes: durationMinutes,
        });
      }
    }

    return offlinePeriods;
  }

  /**
   * Get the most recent offline period (between last logout and current login)
   * Used for "While You Were Away" feature
   */
  async getLastOfflinePeriod(
    walletAddress: string,
  ): Promise<{ start: Date; end: Date; duration_minutes: number } | null> {
    const sessions = await this.sessionRepository.find({
      where: { wallet_address: walletAddress },
      order: { login_at: 'DESC' },
      take: 2,
    });

    if (sessions.length < 2) return null;

    const currentSession = sessions[0]; // Most recent (current)
    const previousSession = sessions[1]; // Previous session

    const offlineStart =
      previousSession.logout_at ||
      new Date(previousSession.login_at.getTime() + 60 * 60 * 1000);
    const offlineEnd = currentSession.login_at;

    const durationMs = offlineEnd.getTime() - offlineStart.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    if (durationMinutes <= 0) return null;

    return {
      start: offlineStart,
      end: offlineEnd,
      duration_minutes: durationMinutes,
    };
  }

  /**
   * Get current active session (checks if truly active based on JWT expiry)
   */
  async getActiveSession(walletAddress: string): Promise<AdminSession | null> {
    const session = await this.sessionRepository.findOne({
      where: {
        wallet_address: walletAddress,
        session_status: 'active',
      },
      order: { login_at: 'DESC' },
    });

    if (!session) return null;

    // Check if session is truly active (within JWT expiry time)
    const expiryTime = new Date(session.login_at.getTime() + 60 * 60 * 1000);
    const isExpired = new Date() > expiryTime;

    if (isExpired) {
      // Mark as expired
      session.logout_at = expiryTime;
      session.session_status = 'expired';
      await this.sessionRepository.save(session);
      return null;
    }

    return session;
  }

  /**
   * Clean up expired sessions (mark sessions as expired if JWT expired)
   * Should be called periodically (e.g., daily cron job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const expiryThreshold = new Date(Date.now() - 60 * 60 * 1000); // 60 minutes ago

    const expiredSessions = await this.sessionRepository.find({
      where: {
        session_status: 'active',
        login_at: LessThan(expiryThreshold),
      },
    });

    for (const session of expiredSessions) {
      session.logout_at = new Date(session.login_at.getTime() + 60 * 60 * 1000);
      session.session_status = 'expired';
      await this.sessionRepository.save(session);
    }

    return expiredSessions.length;
  }

  /**
   * Get session statistics
   */
  async getSessionStats(walletAddress: string): Promise<{
    total_sessions: number;
    active_sessions: number;
    logged_out_sessions: number;
    expired_sessions: number;
    total_login_time_minutes: number;
  }> {
    const sessions = await this.sessionRepository.find({
      where: { wallet_address: walletAddress },
    });

    let totalLoginTimeMs = 0;
    let activeSessions = 0;
    let loggedOutSessions = 0;
    let expiredSessions = 0;

    for (const session of sessions) {
      if (session.session_status === 'active') activeSessions++;
      if (session.session_status === 'logged_out') loggedOutSessions++;
      if (session.session_status === 'expired') expiredSessions++;

      const endTime = session.logout_at || new Date();
      totalLoginTimeMs += endTime.getTime() - session.login_at.getTime();
    }

    return {
      total_sessions: sessions.length,
      active_sessions: activeSessions,
      logged_out_sessions: loggedOutSessions,
      expired_sessions: expiredSessions,
      total_login_time_minutes: Math.round(totalLoginTimeMs / (1000 * 60)),
    };
  }
}
