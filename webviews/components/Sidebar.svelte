<script lang="ts">
	import { onMount } from "svelte";
	let todos: Array<{ text: string; completed: boolean; id?: string }> = [];
	let text = "";

	const apiBaseUrl = "http://localhost:5000"; // Flask backend

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

<form>
	<input type="text" bind:value={text} placeholder="Add a new todo..." />
	<button
		on:click={() => {
			sendDataToFlask(text);
		}}
	>
		Submit
	</button>
</form>

<style>
	.completed {
		text-decoration: line-through;
		opacity: 0.7;
	}

	.todo-button {
		all: unset;
		cursor: pointer;
		text-align: center;
		padding: 4px;
	}

	li {
		margin-left: 20px;
	}

	ul {
		padding: 0;
	}
</style>
