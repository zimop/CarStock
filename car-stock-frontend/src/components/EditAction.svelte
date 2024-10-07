<script>
    import { Button } from "@sveltestrap/sveltestrap";
    import {deleteCar, updateStockLevels} from './../api/api.js';
    import {fetchCarId} from './../api/api.js';
    import {Modal, Input } from "@sveltestrap/sveltestrap";

    export let stocklevel;
    export let make;
    export let model;
    export let year;

    let open = false;
    const toggle = () => (open = !open);

    const handleEdit = async (event) => {
        event.preventDefault();
        const carId = await fetchCarId(make, model, parseInt(year));
        console.log(carId);
        const response = await updateStockLevels(carId, stocklevel);
        console.log(response);
        // send data to the api
    }
</script>

<Button color="primary" on:click= {toggle}>Edit</Button>
<Modal body header="Edit stock levels" isOpen={open} {toggle}>
    <div>
        <div class = "make">
            <span>Stock Level:</span>
            <Input type="email" placeholder="make" bind:value = {stocklevel}/>
        </div>
        <Button on:click = {handleEdit} color="primary">Submit</Button>
    </div>
</Modal>
