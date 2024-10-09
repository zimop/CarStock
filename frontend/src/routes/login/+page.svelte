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

<div>
    <h2>Login</h2>
    <form on:submit = {handleSubmit}>
        <Input type="email" placeholder="Email" bind:value={email} required />
        <Input type="password" placeholder="Password" bind:value={password} required />
        {#if errorMessage}
            <p style="color: red;">{errorMessage}</p>
        {/if}
        <Button color="primary" type="submit" on:click={handleSubmit}>Login</Button>
    </form>
</div>