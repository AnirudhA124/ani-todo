<script lang="ts">
	import Signin from './Signin.svelte';
	import Sidebar from './Sidebar.svelte';
	import CreateAccount from './CreateUser.svelte';

	let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
	let showSignup = false;

	function handleLoginSuccess() {
		isLoggedIn = true;
		localStorage.setItem("isLoggedIn", "true");
	}

	function handleLogout() {
		isLoggedIn = false;
		localStorage.removeItem("isLoggedIn");
	}

	function toggleSignup() {
		showSignup = !showSignup;
	}
</script>

{#if isLoggedIn}
	<Sidebar on:logout={handleLogout} />
{:else if showSignup}
	<CreateAccount on:loginSuccess={handleLoginSuccess} />
	<p style="text-align:center; margin-top: 10px; color: #ccc;">
		Already have an account? <a href="#" on:click|preventDefault={toggleSignup}>Sign in</a>
	</p>
{:else}
	<Signin on:loginSuccess={handleLoginSuccess} />
	<p style="text-align:center; margin-top: 10px; color: #ccc;">
		New here? <a href="#" on:click|preventDefault={toggleSignup}>Create an account</a>
	</p>
{/if}
