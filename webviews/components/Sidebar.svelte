<script lang="ts">
	import { onMount } from "svelte";
	let todos: Array<{ text: string; completed: boolean; id?: string }> = [];
	let text = "";

	const apiBaseUrl = "http://localhost:5000"; // Flask backend

	async function addTodo(t: string) {
		const response = await fetch(`${apiBaseUrl}/todo`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ text: t }),
		});

		const result = await response.json();
		if (result.todo) {
			todos = [result.todo, ...todos];
			tsvscode.postMessage({
				type: "onInfo",
				value: "Task Added.",
			});
		}
	}

	// Send Data
	// Send Data and auto-insert generated files
	async function sendDataToFlask(requirement: string) {
		try {
			const response = await fetch(`${apiBaseUrl}/receive-data`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ requirement }),
			});

			const result = await response.json();
			console.log("📦 Server returned:", result);

			// ✅ Step 1: Send dependencies list to extension (once)
			if (
				result.dependencies &&
				Array.isArray(result.dependencies) &&
				result.dependencies.length > 0
			) {
				tsvscode.postMessage({
					type: "installPythonLibs",
					libs: result.dependencies,
				} as any);
			}

			// ✅ Step 2: Handle generated files
			if (!result.files || result.files.length === 0) {
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
		} catch (error) {
			console.error("❌ Error sending to Flask:", error);
			tsvscode.postMessage({
				type: "onError",
				value: "❌ Could not send data to Flask server",
			});
		}
	}
</script>

<div class="text_container">
	<div class="chat_container">
		<div class="input_box">
			<input
				type="text"
				bind:value={text}
				placeholder="Say something..."
			/>
			<div class="icons">
				<span title="Attachment">📎</span>
				<span title="Emoji">😊</span>
				<span title="Send" on:click={() => sendDataToFlask(text)}>➤</span>

			</div>
		</div>
	</div>
</div>

<style>
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
</style>
