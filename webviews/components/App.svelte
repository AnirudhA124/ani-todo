<script lang="ts">
	import Signin from './Signin.svelte';
	import Sidebar from './Sidebar.svelte';

	let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

	function handleLoginSuccess() {
		isLoggedIn = true;
		localStorage.setItem("isLoggedIn", "true");
	}

	function handleLogout() {
		isLoggedIn = false;
		localStorage.removeItem("isLoggedIn");
	}
</script>

{#if isLoggedIn}
	<Sidebar on:logout={handleLogout} />
{:else}
	<Signin on:loginSuccess={handleLoginSuccess} />
{/if}
