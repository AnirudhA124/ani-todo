<script>
	import { createEventDispatcher } from "svelte";
	import { onMount } from "svelte";
	
	const dispatch = createEventDispatcher();
	
	let email = "";
	let password = "";
	let isLoading = false;
	
	// Add password toggle functionality
	let showPassword = false;
	
	function togglePassword() {
		showPassword = !showPassword;
	}
	
	async function handleSubmit(e) {
		e.preventDefault();
		
		if (!email.trim() || !password.trim()) {
			alert("Please fill in all fields");
			return;
		}
		
		isLoading = true;
		
		try {
			console.log("Attempting login with:", { email: email.trim() }); // Debug log
			
			const response = await fetch("http://127.0.0.1:5000/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ 
					email: email.trim(), 
					password: password.trim() 
				}),
			});
			
			console.log("Response status:", response.status); // Debug log
			
			const result = await response.json();
			console.log("Response data:", result); // Debug log
			
			if (response.ok && result.success) {
				// 🔁 Notify parent that login was successful
				dispatch("loginSuccess", result);
			} else {
				alert(result.message || "❌ Invalid credentials.");
			}
		} catch (error) {
			console.error("Login error:", error);
			alert("❌ Failed to connect to server. Check if Flask is running on port 5000.");
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="login-container">
	<div class="login-header">
		<h1>Welcome back</h1>
		<p>Sign in to your account</p>
	</div>

	<form on:submit={handleSubmit}>
		<div class="form-group">
			<label for="email">Email</label>
			<input
				type="email"
				id="email"
				class="form-input"
				placeholder="name@example.com"
				bind:value={email}
				required
			/>
		</div>

		<div class="form-group">
			<div class="password-header">
				<label for="password">Password</label>
				<button type="button" class="forgot-password" on:click={() => alert("Forgot password feature not implemented")}>
					Forgot password?
				</button>
			</div>
			<div class="input-wrapper">
				<input
					type={showPassword ? "text" : "password"}
					id="password"
					class="form-input"
					placeholder="••••••••"
					bind:value={password}
					required
				/>
				<button type="button" class="password-toggle" on:click={togglePassword}>
					{showPassword ? "🙈" : "👁️"}
				</button>
			</div>
		</div>

		<button type="submit" class="sign-in-button" disabled={isLoading}>
			{isLoading ? "Signing in..." : "Sign in"}
		</button>
	</form>
</div>

<style>
	.login-container {
		background-color: #2a2a2a;
		width: 100%;
		max-width: 400px;
		padding: 40px 30px;
	}

	.login-header {
		text-align: center;
		margin-bottom: 40px;
	}

	.login-header h1 {
		font-size: 32px;
		font-weight: 600;
		margin-bottom: 8px;
		color: #ffffff;
	}

	.login-header p {
		font-size: 16px;
		color: #a0a0a0;
		font-weight: 400;
	}

	.form-group {
		margin-bottom: 24px;
	}

	.form-group label {
		display: block;
		font-size: 14px;
		font-weight: 600;
		color: #ffffff;
		margin-bottom: 8px;
	}

	.input-wrapper {
		position: relative;
	}

	.form-input {
		width: 100%;
		padding: 16px 18px;
		background-color: #1a1a1a;
		border: 1px solid #404040;
		border-radius: 8px;
		color: #ffffff;
		font-size: 16px;
		transition: all 0.2s ease;
		outline: none;
		box-sizing: border-box;
	}

	.form-input:focus {
		border-color: #007acc;
		box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.1);
	}

	.form-input::placeholder {
		color: #666666;
	}

	.password-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.forgot-password {
		background: none;
		border: none;
		color: #a0a0a0;
		font-size: 14px;
		cursor: pointer;
		text-decoration: none;
		font-weight: 500;
	}

	.forgot-password:hover {
		color: #ffffff;
	}

	.password-toggle {
		position: absolute;
		right: 16px;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: #a0a0a0;
		cursor: pointer;
		font-size: 20px;
		padding: 4px;
		transition: color 0.2s ease;
	}

	.password-toggle:hover {
		color: #ffffff;
	}

	.sign-in-button {
		width: 100%;
		padding: 16px;
		background-color: #e5e5e5;
		color: #1a1a1a;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-top: 8px;
	}

	.sign-in-button:hover:not(:disabled) {
		background-color: #ffffff;
		transform: translateY(-1px);
	}

	.sign-in-button:active:not(:disabled) {
		transform: translateY(0);
	}

	.sign-in-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	/* Responsive design */
	@media (max-width: 480px) {
		.login-container {
			padding: 30px 20px;
		}
		
		.login-header h1 {
			font-size: 28px;
		}
		
		.form-input {
			padding: 14px 16px;
			font-size: 16px;
		}
	}
</style>