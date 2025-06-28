<script lang="ts">
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

<div class="text_container">
	<div class="chat_container">
		<div class="result">
			<pre>{resultText}</pre>
		</div>
		<div class="input_box">
			<input
				type="text"
				bind:value={text}
				placeholder="Say something..."
				disabled={loading}
			/>
			<div class="icons">
				<span title="Attachment">📎</span>
				<span title="Emoji">😊</span>
				<span title="Send" on:click={() => sendDataToFlask(text)}
					>➤</span
				>
			</div>
		</div>
	</div>
</div>

<style>
	.result {
		position: absolute;
		top: 10px;
		width: 100%;
	}
	.text_container {
		height: 100vh;
		width: 100vw;
		display: flex;
		flex-direction: column;
		justify-content: end;
	}
	.chat_container {
		bottom: 0;
		box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.1);
	}

	.input_box {
		display: flex;
		align-items: center;
		background: white;
		border-radius: 25px;
		padding: 10px 15px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	input[type="text"] {
		flex: 1;
		border: none;
		outline: none;
		font-size: 1rem;
		background: transparent;
	}

	.icons {
		display: flex;
		font-size: 1.2rem;
		color: #555;
		cursor: pointer;
	}

	.loading {
		margin-top: 10px;
		font-size: 0.95rem;
		color: #555;
		text-align: center;
	}
</style>
