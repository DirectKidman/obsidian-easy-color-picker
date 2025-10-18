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
		wrapper.style.padding = "12px";
		wrapper.style.display = "flex";
		wrapper.style.flexDirection = "column";
		wrapper.style.alignItems = "center";
		wrapper.style.gap = "10px";

		// 説明
		wrapper.createEl("h4", {text: "Click a color code to copy."})
		// カラーピッカー
		const input = wrapper.createEl("input");
		input.type = "color";
		input.value = this.color;
		input.style.width = "80px";
		input.style.height = "40px";
		input.style.border = "none";
		input.style.cursor = "pointer";

		// カラーコードラベル
		const label = wrapper.createEl("div", { text: this.color });
		label.style.fontFamily = "monospace";
		label.style.fontSize = "14px";
		label.style.cursor = "pointer";
		label.style.userSelect = "none";
		label.style.transition = "transform 0.1s";
		label.style.padding = "5px";
		// label.style.textShadow = "1px 1px 10px #ffffff";		

		const historyContainer = wrapper.createDiv();
		historyContainer.style.display = "flex";
		historyContainer.style.flexWrap = "wrap";
		historyContainer.style.justifyContent = "center";
		historyContainer.style.gap = "6px";

		// 履歴見出し
		const deleteButton = wrapper.createEl("button", { text: "delete history" });
		
		deleteButton.onClickEvent((ev: MouseEvent) => {
			this.plugin.deleteHistory();
			renderHistory();
		});
		// 履歴の描画関数
		const renderHistory = () => {
			historyContainer.empty();
			this.plugin.history.forEach((color) => {
				const swatch = historyContainer.createEl("div");
				swatch.style.width = "20px";
				swatch.style.height = "20px";
				swatch.style.border = "1px solid var(--text-muted)";
				swatch.style.borderRadius = "4px";
				swatch.style.backgroundColor = color;
				swatch.style.cursor = "pointer";
				swatch.title = color;

				swatch.onclick = () => {
					this.color = color;
					input.value = color;
					label.textContent = color;
					// label.style.color = color;
				};
			});
		};

		label.onclick = async () => {
			await navigator.clipboard.writeText(this.color);
			new Notice(`✅ ${this.color} copy to clipboard`);
			label.style.transform = "scale(1.1)";
			// label.style.color = this.color;
			this.plugin.addToHistory(this.color);
			renderHistory();
			setTimeout(() => (label.style.transform = "scale(1)"), 150);
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
