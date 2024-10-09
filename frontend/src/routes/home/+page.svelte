<script>
	  import { goto } from '$app/navigation';
    import SearchBar from '../../components/SearchBar.svelte';
    import LogOutButton from '../../components/LogOutButton.svelte';
    import { onMount } from 'svelte';

    let token = ""

    onMount(() => {
        token = sessionStorage.getItem('token');
        // If token exists, the user is already logged in, so redirect them
        if (!token) {
            // Redirect to the homepage or another page
            goto('/login')
        }
    });
</script>

<div>
  {#if token}
    <h1>Car Stock Management System</h1>
    <SearchBar/>
    <LogOutButton/>
  {/if}
</div>