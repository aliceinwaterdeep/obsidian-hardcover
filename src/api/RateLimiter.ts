export type LogCallback = (message: string) => void;

/**
 * Rate limiter for Hardcover API requests.
 * Uses adaptive throttling to spread requests evenly over time.
 * Target: 30 req/min (conservative, half of HC's 60/min limit).
 *
 * Instead of bursting 30 requests then waiting 60s, this spreads
 * requests out to provide smoother, more predictable progress.
 */
export class RateLimiter {
	private requestTimestamps: number[] = [];
	private readonly maxRequests = 45; // Conservative: 75% of HC's 60/min limit
	private readonly windowMs = 60000; // 1 minute window
	private readonly targetIntervalMs = 2000; // Target: 1 request per 2 seconds (30/min)
	private readonly minIntervalMs = 500; // Minimum delay between requests
	private logCallback: LogCallback | null = null;
	private throttleQueue: Promise<void> = Promise.resolve(); // Serialize throttle calls

	/**
	 * Set a callback for debug logging.
	 */
	setLogCallback(callback: LogCallback | null): void {
		this.logCallback = callback;
	}

	private log(message: string): void {
		if (this.logCallback) {
			this.logCallback(message);
		}
	}

	/**
	 * Throttle requests using adaptive rate limiting.
	 * Spreads requests evenly instead of bursting then waiting.
	 * Serialized to prevent race conditions with parallel requests.
	 */
	async throttle(): Promise<void> {
		// Queue this throttle call to prevent race conditions
		// Each call waits for the previous one to complete
		this.throttleQueue = this.throttleQueue.then(() => this.doThrottle());
		return this.throttleQueue;
	}

	private async doThrottle(): Promise<void> {
		const now = Date.now();

		// Remove timestamps older than the window
		this.requestTimestamps = this.requestTimestamps.filter(
			(t) => now - t < this.windowMs
		);

		const requestsInWindow = this.requestTimestamps.length;
		const lastRequestTime =
			this.requestTimestamps.length > 0
				? this.requestTimestamps[this.requestTimestamps.length - 1]
				: 0;
		const timeSinceLastRequest =
			lastRequestTime > 0 ? now - lastRequestTime : Infinity;

		// Calculate adaptive delay based on how full the window is
		let delay = 0;

		if (requestsInWindow >= this.maxRequests) {
			// At limit - must wait for oldest request to expire
			const oldestTimestamp = this.requestTimestamps[0];
			delay = this.windowMs - (now - oldestTimestamp) + 100;
			this.log(
				`Rate limit reached (${requestsInWindow}/${this.maxRequests}), waiting ${Math.round(delay / 1000)}s...`
			);
		} else if (requestsInWindow > 0) {
			// Calculate how aggressive we can be based on window utilization
			// As we approach the limit, we slow down more
			const utilizationRatio = requestsInWindow / this.maxRequests;

			// Scale delay: at 0% utilization = minInterval, at 90% = targetInterval * 2
			const scaledInterval =
				this.minIntervalMs +
				(this.targetIntervalMs * 2 - this.minIntervalMs) * utilizationRatio;

			// Only delay if we haven't already waited long enough
			delay = Math.max(0, scaledInterval - timeSinceLastRequest);

			if (delay > 0) {
				this.log(
					`Throttling: ${requestsInWindow}/${this.maxRequests} requests in window, waiting ${Math.round(delay)}ms...`
				);
			}
		}

		if (delay > 0) {
			await this.delay(delay);
		}

		// Record this request AFTER any delay
		this.requestTimestamps.push(Date.now());
		this.log(
			`Request ${this.requestTimestamps.length}/${this.maxRequests} in window (${Math.round((this.requestTimestamps.length / this.maxRequests) * 100)}% capacity)`
		);
	}

	/**
	 * Get the current number of requests in the window.
	 * Useful for debugging/logging.
	 */
	getRequestCount(): number {
		const now = Date.now();
		this.requestTimestamps = this.requestTimestamps.filter(
			(t) => now - t < this.windowMs
		);
		return this.requestTimestamps.length;
	}

	/**
	 * Reset the rate limiter state.
	 * Useful for testing or after long pauses.
	 */
	reset(): void {
		this.requestTimestamps = [];
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
