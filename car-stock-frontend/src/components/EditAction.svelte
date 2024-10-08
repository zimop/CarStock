<script>
    import { Button } from "@sveltestrap/sveltestrap";
    import {deleteCar, updateStockLevels} from './../api/api.js';
    import {fetchCarId} from './../api/api.js';
    import {Modal, Input } from "@sveltestrap/sveltestrap";

    export let stocklevel;
    export let make;
    export let model;
    export let year;

    export let getCars;

    
    let error = ''
    let open = false;
    const toggle = () => (open = !open);

    const validateStock = () => {
        let isValid = true;
        const stock = parseInt(stocklevel);
        error = '';
        if (isNaN(stock) || stock < 0){
            error = 'Please enter a valid stock number';
            isValid = false;
        }
        return isValid;
    }

    const handleEdit = async (event) => {
        event.preventDefault();
        if (validateStock()) {
            const carId = await fetchCarId(make, model, parseInt(year));
            console.log(carId);
            const response = await updateStockLevels(carId, stocklevel);
            getCars();
            open = !open;
            console.log(response);
        }
        // send data to the api
    }
</script>

<Button color="primary" on:click= {toggle} size = "lg">Edit</Button>
<Modal body header="Edit stock levels" isOpen={open} {toggle}>
    <div>
        <div class = "make">
            <span>Stock Level:</span>
            <Input type="email" placeholder="make" bind:value = {stocklevel}/>
            {#if error}
                <span class = "error">{error}</span>
            {/if}
        </div>
        <div class = "button">
            <Button on:click = {handleEdit} color="primary" >Submit</Button>
        </div>
    </div>
</Modal>

<style>
    .make{
        display:flex;
        flex-direction:column;
        gap:10px;
    }

    .button{
        padding-top:10px
    }

    .error{
        color:red;
    }
</style>