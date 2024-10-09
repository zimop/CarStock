<script>
	  import { goto } from '$app/navigation';
    import SearchBar from '../../components/SearchBar.svelte';
    import LogOutButton from '../../components/LogOutButton.svelte';
    import { onMount } from 'svelte';

    let token = ""
    let username = ""

    onMount(() => {
        token = sessionStorage.getItem('token');
        username = sessionStorage.getItem('username');
        // If token exists, the user is already logged in, so redirect them
        if (!token) {
            // Redirect to the homepage or another page
            goto('/login')
        }
    });
</script>

<div>
  {#if token}
  <div class = "header">
    <h1>Car Stock Management System</h1>
    <h2>Welcome {username}</h2>
  </div>
    <SearchBar/>
  {/if}
</div>

<style>
  .header{
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
</style>