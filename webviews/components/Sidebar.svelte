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

	// Test function
	async function test() {
		try {
			const response = await fetch(`${apiBaseUrl}/send-json`);
			const data = await response.json();

			console.log("Fetched file data:", data);

			if (!data.files || data.files.length === 0) {
				tsvscode.postMessage({
					type: "onError",
					value: "No files received from server.",
				});
				return;
			}

			// Loop through each file and send it to the extension to be created
			for (const file of data.files) {
				tsvscode.postMessage({
					type: "insertFile",
					path: file.path,
					content: file.content,
				} as any);
			}

			tsvscode.postMessage({
				type: "onInfo",
				value: `📁 ${data.files.length} file(s) sent to extension for insertion.`,
			});
		} catch (error) {
			console.error("Error fetching JSON from /send-json:", error);
			tsvscode.postMessage({
				type: "onError",
				value: "❌ Failed to fetch JSON from server.",
			});
		}
	}

	async function toggleTodo(task: {
		text: string;
		completed: boolean;
		id?: string;
	}) {
		// Update locally first for immediate UI feedback
		task.completed = !task.completed;
		todos = [...todos]; // Trigger reactivity

		// Update on Firebase backend
		try {
			const response = await fetch(`${apiBaseUrl}/todo/${task.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ completed: task.completed }),
			});

			if (!response.ok) {
				// If backend update fails, revert the change
				task.completed = !task.completed;
				todos = [...todos];
				console.error("Failed to update todo");
			}
		} catch (error) {
			// If backend update fails, revert the change
			task.completed = !task.completed;
			todos = [...todos];
			console.error("Error updating todo:", error);
		}
	}

	onMount(async () => {
		// Fetch existing todos
		const response = await fetch(`${apiBaseUrl}/todo`);
		const result = await response.json();
		todos = result.todos;

		// VS Code message listener
		window.addEventListener("message", async (event) => {
			const message = event.data;
			console.log({ message });

			if (message.value === "") {
				tsvscode.postMessage({
					type: "onInfo",
					value: "No text selected",
				});
				return;
			}

			if (message.type === "new-todo") {
				await addTodo(message.value);
			}
		});
	});
</script>

<form
	on:submit|preventDefault={async () => {
		if (text.trim() !== "") {
			await addTodo(text);
			tsvscode.postMessage({
				type: "onInfo",
				value: "Task Added.",
			});
			text = "";
		}
	}}
>
	<input type="text" bind:value={text} placeholder="Add a new todo..." />
	<button type="submit">Add</button>
</form>

<ul>
	{#each todos as task (task.id)}
		<li class={task.completed ? "completed" : ""}>
			<button
				class="todo-button"
				on:click={() => toggleTodo(task)}
				tabindex="0"
				on:keydown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						toggleTodo(task);
					}
				}}
			>
				{task.text}
			</button>
		</li>
	{/each}
</ul>

<button
	on:click={() => {
		test();
	}}
>
	Click Me Test
</button>

<button
	on:click={() => {
		tsvscode.postMessage({
			type: "onError",
			value: "Button Clicked",
		});
	}}
>
	Click Me
</button>

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
