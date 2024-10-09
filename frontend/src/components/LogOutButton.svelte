<script>
    import { goto } from '$app/navigation';
    import { Button } from '@sveltestrap/sveltestrap';

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('username');
        goto('/login');
    }
</script>

<Button color = "primary" on:click = {handleLogout}>
    Logout
</Button>