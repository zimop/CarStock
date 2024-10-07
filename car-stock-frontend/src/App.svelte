<script>
    import CarsList from './components/CarsList.svelte'
    import AddCar from './components/AddCar.svelte';
    import DeleteCar from './components/DeleteCar.svelte';
    import HomePage from './pages/HomePage.svelte';
</script>

<svelte:head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
</svelte:head>

<h1>Cars Stock Management System</h1>
<ul>
    <HomePage/>
    <CarsList/>
    <AddCar/>
    <DeleteCar/>
</ul>