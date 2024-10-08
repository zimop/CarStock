<script>
	import { login } from '../../api/authApi.js';
    import { Button, Input } from '@sveltestrap/sveltestrap';
    import { goto } from '$app/navigation';
    let email = '';
    let password = '';

    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log("hello");
        try {
            const {token, username, userId} = await login(email, password);
            console.log(`Logged in as ${username}`);
            goto('/home');
        } catch (error) {
            console.error('Error logging in:', error);
        }
    }
</script>

<div>
    <h2>Login</h2>
    <form on:submit = {handleSubmit}>
        <Input type="email" placeholder="Email" bind:value={email} required />
        <Input type="password" placeholder="Password" bind:value={password} required />
        <Button color="primary" type="submit" on:click={handleSubmit}>Login</Button>
    </form>
</div>