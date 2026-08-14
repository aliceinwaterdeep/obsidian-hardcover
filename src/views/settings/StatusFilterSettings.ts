import { Setting, SettingDefinition } from "obsidian";
import { HARDCOVER_STATUS_MAP } from "src/config/statusMapping";
import ObsidianHardcover from "src/main";

function configureStatusFilterSetting(
	filterSetting: Setting,
	plugin: ObsidianHardcover,
): void {
	filterSetting
		.setName("Filter by reading status")
		.setDesc(
			"Select which reading statuses to sync. Uncheck to exclude. All statuses synced by default.",
		);

	filterSetting.infoEl.querySelector(".status-filter-note")?.remove();
	filterSetting.settingEl.querySelector(".status-filter-checkboxes")?.remove();

	const allStatuses = Object.keys(HARDCOVER_STATUS_MAP).map((id) =>
		parseInt(id),
	);

	const filterNote = filterSetting.infoEl.createDiv({
		cls: "setting-item-description status-filter-note",
	});

	const updateFilterNote = () => {
		const filter = plugin.settings.statusFilter;

		if (filter.length === 0) {
			filterNote.textContent = "⚠️ No statuses selected: sync will do nothing";
		} else if (filter.length === allStatuses.length) {
			filterNote.textContent = "✓ Syncing all statuses";
		} else {
			const statusNames = filter
				.map(
					(id) => HARDCOVER_STATUS_MAP[id as keyof typeof HARDCOVER_STATUS_MAP],
				)
				.filter(Boolean)
				.join(", ");
			filterNote.textContent = `Syncing: ${statusNames}`;
		}
	};

	updateFilterNote();

	const checkboxContainer = filterSetting.settingEl.createDiv({
		cls: "status-filter-checkboxes",
	});

	for (const [statusIdStr, statusName] of Object.entries(
		HARDCOVER_STATUS_MAP,
	)) {
		const statusId = parseInt(statusIdStr, 10);

		const label = checkboxContainer.createEl("label", {
			cls: "status-filter-checkbox-label",
		});

		const checkbox = label.createEl("input", {
			type: "checkbox",
		});
		checkbox.checked = plugin.settings.statusFilter.includes(statusId);

		checkbox.addEventListener("change", () => {
			void (async () => {
				const currentFilter = plugin.settings.statusFilter;

				if (checkbox.checked) {
					plugin.settings.statusFilter = [...currentFilter, statusId];
				} else {
					plugin.settings.statusFilter = currentFilter.filter(
						(id) => id !== statusId,
					);
				}

				await plugin.saveSettings();
				updateFilterNote();
			})();
		});

		label.createSpan({ text: statusName });
	}
}

export function getStatusFilterSettingDefinition(
	plugin: ObsidianHardcover,
): SettingDefinition {
	return {
		name: "Filter by reading status",
		render: (setting) => configureStatusFilterSetting(setting, plugin),
	};
}
