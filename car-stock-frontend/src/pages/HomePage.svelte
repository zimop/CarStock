<script>
    import CarsList from '../components/CarsList.svelte';
    import { Table } from '@sveltestrap/sveltestrap';
    import AddUsersForm from '../components/AddUsersForm.svelte';
</script>

<div>
  <h1>Car Stock Management System</h1>
  <AddUsersForm/>
  <CarsList/>
</div>

<style>
    @import 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
</style>