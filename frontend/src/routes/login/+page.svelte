<script>
	import { login } from '../../api/authApi.js';
    import { Button, Input } from '@sveltestrap/sveltestrap';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    let email = '';
    let password = '';
    let errorMessage = '';

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const {token, username, userId} = await login(email, password);
            errorMessage = "";
            console.log(`Logged in as ${username}`);
            goto('/home');
        } catch (error) {
            if (error.response && error.response.status === 401){
                errorMessage = 'Incorrect username or password. Please try again.';
            }
            else{
                console.error('Error logging in:', error);
            }
        }
    }

    onMount(() => {
        const token = sessionStorage.getItem('token');
        
        // If token exists, the user is already logged in, so redirect them
        if (token) {
            goto('/home'); // Redirect to the homepage or another page
        }
    });

</script>

<div class ="middle">
    <h1>Welcome to the Car Stock System</h1>
    <h2>Please Enter your Credentials</h2>
    <div class = "form">
        <h1>Login</h1>
        <form on:submit = {handleSubmit} class = "credentials">
            <Input type="email" placeholder="Username" bind:value={email} required />
            <Input type="password" placeholder="Password" bind:value={password} required />
            {#if errorMessage}
                <p style="color: red;">{errorMessage}</p>
            {/if}
            <Button color="primary" type="submit" on:click={handleSubmit}>Login</Button>
        </form>
    </div>
</div>
<style>
    .form{
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        background-color: white;
        width:300px;
        border-radius: 20px;
        border: 2px solid;
        padding:20px;
    }
    .credentials {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        gap: 10px;
    }

    .middle{
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        gap:10px;
        height: 100vh;
    }
</style>