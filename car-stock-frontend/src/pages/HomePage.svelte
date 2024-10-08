<script>
	  import LoginPage from './LoginPage.svelte';
    import CarsList from '../components/CarsList.svelte';
    import { Table } from '@sveltestrap/sveltestrap';
    import AddUsersForm from '../components/AddUsersForm.svelte';
    import SearchBar from '../components/SearchBar.svelte';
</script>

<div>
  <LoginPage/>
  <h1>Car Stock Management System</h1>
  <SearchBar/>
</div>

<style>
    @import 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
</style>