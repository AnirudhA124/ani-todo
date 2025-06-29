<script lang="ts">
	import { createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher();

	let name = "";
	let email = "";
	let password = "";
	let terms = false;
	let isLoading = false;
	let showPassword = false;

	function togglePassword() {
		showPassword = !showPassword;
	}

	async function handleSignup(e: Event) {
		e.preventDefault();

		if (!name.trim() || !email.trim() || !password.trim() || !terms) {
			alert("Please fill all fields and agree to terms.");
			return;
		}

		isLoading = true;

		try {
			const res = await fetch("http://127.0.0.1:5000/signup", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: name.trim(),
					email: email.trim(),
					password: password.trim(),
				}),
			});

			const result = await res.json();

			if (res.ok && result.success) {
				localStorage.setItem("isLoggedIn", "true");
				dispatch("loginSuccess", result);
                // ✅ Notify VS Code UI
			    tsvscode.postMessage({
				type: "onInfo",
				value: "✅ User created successfully!",
			}as any);
			} else {
				alert(result.message || "❌ Signup failed.");
			}
		} catch (err) {
			console.error("Signup error:", err);
			alert("❌ Could not connect to the server.");
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="form-container">
	<div class="form-header">
		<h1 class="form-title">Create account</h1>
		<p class="form-subtitle">Get started with your account</p>
	</div>

	<form on:submit={handleSignup} id="createAccountForm">
		<div class="form-group">
			<label for="name" class="form-label">Name</label>
			<input
				type="text"
				id="name"
				class="form-input"
				placeholder="John Doe"
				bind:value={name}
				required
			/>
		</div>

		<div class="form-group">
			<label for="email" class="form-label">Email</label>
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
			<label for="password" class="form-label">Password</label>
			<div class="password-container">
				<input
					type={showPassword ? "text" : "password"}
					id="password"
					class="form-input"
					placeholder="••••••••"
					bind:value={password}
					required
				/>
				<button
					type="button"
					class="password-toggle"
					on:click={togglePassword}
					aria-label="Toggle password visibility"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
						<circle cx="12" cy="12" r="3" />
					</svg>
				</button>
			</div>
		</div>

		

		<button type="submit" class="submit-button" disabled={isLoading}>
			{isLoading ? "Creating..." : "Create account"}
		</button>
	</form>
</div>

<style>
	.form-container {
            background-color: #181818;
            border-radius: 12px;
            padding: 40px;
            width: 100%;
            max-width: 420px;
        }

        .form-header {
            text-align: center;
            margin-bottom: 40px;
        }

        .form-title {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #ffffff;
        }

        .form-subtitle {
            font-size: 16px;
            color: #a0a0a0;
            font-weight: 400;
        }

        .form-group {
            margin-bottom: 24px;
        }

        .form-label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: #ffffff;
            margin-bottom: 8px;
        }

        .form-input {
            width: 100%;
            padding: 12px 16px;
            background-color: #1a1a1a;
            border: 1px solid #404040;
            border-radius: 8px;
            color: #ffffff;
            font-size: 16px;
            transition: all 0.2s ease;
        }

        .form-input:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .form-input::placeholder {
            color: #666666;
        }

        .password-container {
            position: relative;
        }

        .password-toggle {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #a0a0a0;
            cursor: pointer;
            padding: 4px;
            transition: color 0.2s ease;
        }

        .password-toggle:hover {
            color: #ffffff;
        }

        .checkbox-group {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 32px;
        }

        .checkbox-input {
            width: 18px;
            height: 18px;
            margin-top: 2px;
            accent-color: #007bff;
        }

        .checkbox-label {
            font-size: 14px;
            color: #a0a0a0;
            line-height: 1.4;
            flex: 1;
        }

        .checkbox-label a {
            color: #007bff;
            text-decoration: none;
        }

        .checkbox-label a:hover {
            text-decoration: underline;
        }

        .submit-button {
            width: 100%;
            padding: 14px 24px;
            background-color: #e5e5e5;
            color: #1a1a1a;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .submit-button:hover {
            background-color: #d0d0d0;
            transform: translateY(-1px);
        }

        .submit-button:active {
            transform: translateY(0);
        }

        .submit-button:disabled {
            background-color: #666666;
            color: #999999;
            cursor: not-allowed;
            transform: none;
        }

        @media (max-width: 480px) {
            .form-container {
                padding: 24px;
            }
            
            .form-title {
                font-size: 24px;
            }
        }
</style>
