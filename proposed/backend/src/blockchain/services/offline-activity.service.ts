import { Injectable } from '@nestjs/common';
import { SessionService } from './session.service';
import { AuditBlockchainService } from './audit-blockchain.service';

export interface OfflineActivity {
  offline_start: Date;
  offline_end: Date;
  duration_minutes: number;
  blockchain_events: Array<{
    action: string;
    cert_hash: string;
    timestamp: Date;
    actor_wallet_address: string;
  }>;
}

@Injectable()
export class OfflineActivityService {
  constructor(
    private sessionService: SessionService,
    private auditService: AuditBlockchainService,
  ) {}

  /**
   * Get offline periods with blockchain activities that occurred during those times
   */
  async getOfflineActivities(
    walletAddress: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<OfflineActivity[]> {
    // Get offline periods
    const offlinePeriods = await this.sessionService.getOfflinePeriods(
      walletAddress,
      startDate,
      endDate,
    );

    // Get all blockchain events for the user
    const allEventsResponse =
      await this.auditService.getUserAuditLogs(walletAddress);
    const allEvents = Array.isArray(allEventsResponse)
      ? allEventsResponse
      : allEventsResponse.data;

    const offlineActivities: OfflineActivity[] = [];

    for (const period of offlinePeriods) {
      // Filter events that occurred during this offline period
      const eventsInPeriod = allEvents.filter((event) => {
        const eventTime = new Date(event.timestamp);
        return eventTime >= period.start && eventTime <= period.end;
      });

      offlineActivities.push({
        offline_start: period.start,
        offline_end: period.end,
        duration_minutes: period.duration_minutes,
        blockchain_events: eventsInPeriod.map((event) => ({
          action: event.action,
          cert_hash: event.cert_hash,
          timestamp: event.timestamp,
          actor_wallet_address: event.actor_wallet_address,
        })),
      });
    }

    return offlineActivities;
  }

  /**
   * Get count of missed activities while offline
   */
  async getMissedActivitiesCount(walletAddress: string): Promise<number> {
    const activities = await this.getOfflineActivities(walletAddress);
    return activities.reduce(
      (count, activity) => count + activity.blockchain_events.length,
      0,
    );
  }
}
