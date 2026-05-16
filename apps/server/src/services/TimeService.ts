export class TimeService {
  /**
   * Generates an authoritative institutional timestamp.
   * This prevents client-side clock drift from corrupting the audit chain.
   */
  static getAuthoritativeTime(): Date {
    return new Date();
  }

  /**
   * Normalizes offline timestamps by validating amendment sequencing.
   * If a client timestamp is significantly ahead/behind, it is flagged for investigation.
   */
  static normalize(clientTime: string | number | Date): { normalizedTime: Date; isDisputed: boolean } {
    const serverTime = this.getAuthoritativeTime();
    const clientDate = new Date(clientTime);
    
    // Threshold for dispute: 24 hours (for long-running offline field ops)
    const driftThreshold = 24 * 60 * 60 * 1000;
    const drift = Math.abs(serverTime.getTime() - clientDate.getTime());

    return {
      normalizedTime: serverTime, // Authoritative server time always wins for reconciliation
      isDisputed: drift > driftThreshold
    };
  }
}
