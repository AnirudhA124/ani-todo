<script lang="ts">
	let selectedModel: string = "ChatGPT"; // default
	let showDropdown = false;

	const models = ["ChatGPT", "Claude", "Gemini", "Llama"];

	let text = "";
	let loading = false;
	let resultText: string = "";

	const apiBaseUrl = "https://extension-api-production-a281.up.railway.app/";

	function delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async function sendDataToFlask(requirement: string) {
		loading = true;

		// 🔶 Start progress bar
		tsvscode.postMessage({
			type: "startProgress",
			title: "Sending to server...",
		} as any);

		try {
			// 🔄 Start request and 2s delay in parallel
			const fetchPromise = fetch(`${apiBaseUrl}/receive-data`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ requirement }),
			}).then((res) => res.json());

			const [result] = await Promise.all([fetchPromise, delay(2000)]);

			// ✅ Stop progress bar immediately after result
			tsvscode.postMessage({ type: "endProgress" } as any);

			// 📝 Show response in result pane
			resultText = JSON.stringify(result, null, 2);

			// 📦 Handle dependencies
			if (Array.isArray(result.dependencies)) {
				if (result.dependencies.length > 0) {
					tsvscode.postMessage({
						type: "installPythonLibs",
						libs: result.dependencies,
					} as any);
				} else {
					tsvscode.postMessage({
						type: "onInfo",
						value: "✅ No libraries needed.",
					} as any);
				}
			}

			// 📁 Handle file insertion
			if (!Array.isArray(result.files) || result.files.length === 0) {
				tsvscode.postMessage({
					type: "onError",
					value: "❌ No files received from server.",
				});
				return;
			}

			for (const file of result.files) {
				tsvscode.postMessage({
					type: "insertFile",
					path: file.path,
					content: file.content,
				} as any);
			}

			tsvscode.postMessage({
				type: "onInfo",
				value: `✅ ${result.files.length} file(s) inserted successfully!`,
			});
		} catch (error) {
			console.error("Fetch error:", error);
			tsvscode.postMessage({
				type: "onError",
				value: "❌ Could not send data to Flask server",
			});
			// ⛔ If request fails, also stop progress to avoid hanging
			tsvscode.postMessage({ type: "endProgress" } as any);
		} finally {
			loading = false;
		}
	}
</script>

<div class="sidebar">
	<div class="sidebar-header">
		<div class="sidebar-icon">O2</div>
		<span>Octavian</span>
	</div>

	<div class="sidebar-content">
		<div class="chat-messages" id="chatMessages">
			<div class="empty-state">
				<div class="empty-state-icon">🤖</div>
				<div>Start a conversation with Octavian</div>
				<div
					style="margin-top: 8px; font-size: 11px; opacity: 0.7;"
				></div>
			</div>
		</div>
	</div>

	<div class="input-container">
		<!-- TOOLS DROPDOWN START -->
		<div class="tools-dropdown">
			<div
				class="tools-section"
				on:click={() => (showDropdown = !showDropdown)}
			>
				<span class="tools-icon"></span>
				<span>{selectedModel}</span>
			</div>

			<div
				class="dropdown-content {showDropdown ? 'active' : ''}"
				id="toolsDropdown"
			>
				{#each models as model}
					<div
						class="dropdown-item"
						on:click={() => {
							selectedModel = model;
							showDropdown = false;
						}}
					>
						{model}
					</div>
				{/each}
			</div>
		</div>
		<!-- TOOLS DROPDOWN END -->

		<div class="input-wrapper">
			<button class="input-button" title="Attach file">
				<span class="attach-icon"></span>
			</button>

			<textarea
				class="text-input"
				placeholder="Ask AI Assistant..."
				rows="1"
				id="messageInput"
				bind:value={text}
			></textarea>

			<button class="input-button" title="Clear">
				<span class="clear-icon"></span>
			</button>

			<button
				class="input-button send-button"
				title="Send"
				id="sendButton"
				on:click={() => {
					sendDataToFlask(text);
				}}
			>
				<span class="send-icon"></span>
			</button>
		</div>
	</div>
</div>

<style>
	.sidebar {
		width: 100vw;
		height: 100vh;
		background-color: #181818;
		border-right: 1px solid #181818;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.sidebar-header {
		padding: 12px 16px;
		background-color: #181818;
		border-bottom: 1px solid #181818;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		font-weight: 500;
		color: #cccccc;
	}

	.sidebar-icon {
		width: 16px;
		height: 16px;
		background-color: #007acc;
		border-radius: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		color: white;
	}

	.sidebar-content {
		flex: 1;
		padding: 16px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.chat-messages {
		flex: 1;
		overflow-y: auto;
		margin-bottom: 16px;
	}

	.message {
		margin-bottom: 16px;
		padding: 12px;
		border-radius: 8px;
		font-size: 13px;
		line-height: 1.4;
	}

	.message.user {
		background-color: #094771;
		margin-left: 20px;
		border-left: 3px solid #007acc;
	}

	.message.assistant {
		background-color: #2d2d30;
		margin-right: 20px;
		border-left: 3px solid #68217a;
	}

	.message-content {
		color: #cccccc;
	}

	.empty-state {
		text-align: center;
		padding: 40px 20px;
		color: #8c8c8c;
		font-size: 13px;
	}

	.empty-state-icon {
		font-size: 48px;
		margin-bottom: 16px;
		opacity: 0.5;
	}

	.input-container {
		position: sticky;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: #181818;
		border-top: 1px solid #181818;
		padding: 12px;
		z-index: 100;
	}

	.input-wrapper {
		background-color: #1f1f1f;
		border-radius: 4px;
		padding: 8px 12px;
		display: flex;
		align-items: center;
		gap: 8px;
		border: 1px solid #464647;
		transition: all 0.2s ease;
	}

	.input-wrapper:hover {
		border-color: #007acc;
	}

	.input-wrapper:focus-within {
		border-color: #007acc;
		box-shadow: 0 0 0 1px #007acc;
	}

	.text-input {
		align-content: center;
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		color: #cccccc;
		font-size: 13px;
		line-height: 1.4;
		resize: none;
		min-height: 30px;
		max-height: 120px;
		font-family: inherit;
	}

	.text-input::placeholder {
		color: #6a6a6a;
	}

	.input-button {
		background: transparent;
		border: none;
		color: #cccccc;
		cursor: pointer;
		padding: 4px;
		border-radius: 2px;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		font-size: 12px;
	}

	.input-button:hover {
		background-color: #464647;
		color: #ffffff;
	}

	.input-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.send-button {
		background-color: #007acc;
		color: white;
	}

	.send-button:hover:not(:disabled) {
		background-color: #005a9e;
	}

	.send-button:disabled {
		background-color: #464647;
	}

	.tools-section {
		display: flex;
		align-items: center;
		gap: 4px;
		color: #cccccc;
		font-size: 11px;
		cursor: pointer;
		padding: 4px 6px;
		border-radius: 2px;
		transition: all 0.2s ease;
		position: relative;
	}

	.tools-section:hover {
		background-color: #464647;
	}

	.tools-dropdown {
		position: relative;
	}

	.dropdown-content {
		display: none;
		position: absolute;
		bottom: 100%;
		left: 0;
		background-color: #3c3c3c;
		border: 1px solid #464647;
		border-radius: 4px;
		padding: 4px;
		margin-bottom: 4px;
		min-width: 180px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
		z-index: 1000;
	}

	.dropdown-content.active {
		display: block;
	}

	.dropdown-item {
		padding: 6px 8px;
		border-radius: 2px;
		cursor: pointer;
		transition: background-color 0.2s ease;
		color: #cccccc;
		font-size: 12px;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.dropdown-item:hover {
		background-color: #464647;
	}

	.dropdown-item::before {
		content: "⚡";
		font-size: 10px;
		opacity: 0.7;
	}

	.input-actions {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-top: 6px;
		font-size: 11px;
	}

	/* Scrollbar styling */
	::-webkit-scrollbar {
		width: 6px;
	}

	::-webkit-scrollbar-track {
		background: #2d2d30;
	}

	::-webkit-scrollbar-thumb {
		background: #464647;
		border-radius: 3px;
	}

	::-webkit-scrollbar-thumb:hover {
		background: #5a5a5a;
	}

	/* Icons */
	.attach-icon::before {
		content: "📎";
		font-size: 11px;
	}

	.tools-icon::before {
		content: "🔧";
		font-size: 10px;
	}

	.send-icon::before {
		content: "→";
		font-size: 12px;
		font-weight: bold;
	}

	.clear-icon::before {
		content: "×";
		font-size: 14px;
	}
</style>
