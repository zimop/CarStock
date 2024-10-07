<script>
    import { InputGroup, InputGroupText, Input } from '@sveltestrap/sveltestrap';
    let searchValue = ""
</script>

<div>
    <InputGroup>
        <InputGroupText>$</InputGroupText>
        <Input placeholder="Search for a car" min={0} max={100} type="number" step="1" />
        <InputGroupText>.00</InputGroupText>
    </InputGroup>
</div>
