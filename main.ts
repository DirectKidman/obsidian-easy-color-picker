import { ItemView, Plugin, WorkspaceLeaf, Notice } from "obsidian";

const VIEW_TYPE_COLOR_PICKER = "color-picker-view";

export default class ColorPickerSidebarPlugin extends Plugin {
	history: string[] = [];

	async onload() {
		this.history = (await this.loadData())?.history ?? [];

		// サイドバー登録
		this.registerView(
			VIEW_TYPE_COLOR_PICKER,
			(leaf) => new ColorPickerView(leaf, this),
		);
	
		this.activateView();
		
	}

	async activateView() {
		const leaves = this.app.workspace.getLeavesOfType(
			VIEW_TYPE_COLOR_PICKER,
		);
		if (leaves.length === 0) {
			await this.app.workspace.getRightLeaf(false)?.setViewState({
				type: VIEW_TYPE_COLOR_PICKER,
				active: true,
			});
		}
		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE_COLOR_PICKER)[0],
		);
	}

	onunload() {
		this.app.workspace
			.getLeavesOfType(VIEW_TYPE_COLOR_PICKER)
			.forEach((leaf) => leaf.detach());
	}

	addToHistory(color: string) {
		// 重複削除して先頭に追加、最大10件
		this.history = [
			color,
			...this.history.filter((c) => c !== color),
		].slice(0, 10);
		this.saveData({ history: this.history });
	}
	
	deleteHistory() {
		this.history = [];
		this.saveData({ history: this.history });
	}
}

class ColorPickerView extends ItemView {
	plugin: ColorPickerSidebarPlugin;
	color = "#ffcc00";

	constructor(leaf: WorkspaceLeaf, plugin: ColorPickerSidebarPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.icon = "palette";
	}

	getViewType() {
		return VIEW_TYPE_COLOR_PICKER;
	}

	getDisplayText() {
		return "Color Picker";
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		const wrapper = contentEl.createDiv({ cls: "color-picker-wrapper" });


		// 説明
		wrapper.createEl("h4", {cls: "explanation-label", text: "Click a color code to copy."})
		// カラーピッカー
		const input = wrapper.createEl("input", {cls: "color-picker"});
		input.type = "color";
		input.value = this.color;

		// カラーコードラベル
		const label = wrapper.createEl("div", { cls: "color-code-label", text: this.color });

		// history container
		const historyContainer = wrapper.createDiv({ cls: "history-container"});

		// 履歴見出し
		const deleteButton = wrapper.createEl("button", { cls: "delete-button", text: "delete history" });
		
		deleteButton.onClickEvent((ev: MouseEvent) => {
			this.plugin.deleteHistory();
			renderHistory();
		});
		// 履歴の描画関数
		const renderHistory = () => {
			historyContainer.empty();
			this.plugin.history.forEach((color) => {
				const swatch = historyContainer.createEl("div", {cls: "history-swatch"});
				swatch.style.backgroundColor = color;
				swatch.title = color;

				swatch.onclick = () => {
					this.color = color;
					input.value = color;
					label.textContent = color;
				};
			});
		};

		label.onclick = async () => {
			await navigator.clipboard.writeText(this.color);
			new Notice(`✅ ${this.color} copy to clipboard`);
			// label.style.transform = "scale(1.1)";
			// label.style.color = this.color;
			this.plugin.addToHistory(this.color);
			renderHistory();
			// setTimeout(() => (label.style.transform = "scale(1)"), 150);
		};

		// カラー変更時
		input.addEventListener("input", (e) => {
			const value = (e.target as HTMLInputElement).value;
			this.color = value;
			label.textContent = value;
			// label.style.color = value;
		});

		// 初期履歴描画
		renderHistory();
	}

	async onClose() {
		this.contentEl.empty();
	}
}
