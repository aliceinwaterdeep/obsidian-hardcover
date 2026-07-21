import { PluginSettings } from "src/types";
import { LegacySettings } from "src/types/migrations";
import { HARDCOVER_STATUS_MAP } from "src/config/statusMapping";

// statusFilter default before the "Paused" status (id 4) was added
const PRE_PAUSED_DEFAULT_STATUS_FILTER = [1, 2, 3, 5];

export function migrateToV14(settings: LegacySettings): PluginSettings {
	if (IS_DEV) {
		console.debug("Migrating to v14: add Paused status support");
	}

	// backfill the  new Paused status missing from a user's saved statusMapping
	if (settings.statusMapping) {
		for (const [id, label] of Object.entries(HARDCOVER_STATUS_MAP)) {
			if (!settings.statusMapping[Number(id)]) {
				settings.statusMapping[Number(id)] = label;
			}
		}
	}

	// if the user statusFilter still matches the full default, extend it to include the new status so sync behavior doesn't change from "everything" to "filtered"
	if (settings.statusFilter) {
		const wasSyncingEverything =
			settings.statusFilter.length ===
				PRE_PAUSED_DEFAULT_STATUS_FILTER.length &&
			PRE_PAUSED_DEFAULT_STATUS_FILTER.every((id) =>
				settings.statusFilter!.includes(id),
			);

		if (wasSyncingEverything && !settings.statusFilter.includes(4)) {
			settings.statusFilter.push(4);
		}
	}

	return settings as PluginSettings;
}
