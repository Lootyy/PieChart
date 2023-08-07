<script setup>
    import { ref, computed } from 'vue'
    import { Tracker } from './Tracker.js'

    const props = defineProps({
        data: {
            default: []
        },
        index: {
            default: null
        }

    })
    const items = ref(props.data)
    const isNested = ref(props.index !== null)
    const groupCount = computed(() => items.value.length)


    function handleInputChange(e, index) {
        console.log(e)
        let value = Number(e.target.textContent)
        e.target.textContent = value // trims leading zeros
        console.log(value)
        if (value > 30)
        {
            value = 30
            e.target.textContent = 30
        }
        else if (value < 1)
        {
            value = 1
            e.target.textContent = 1
        }

        if (props.index != null)
            index = [props.index, index]
        
        Tracker.update(index, value)
    }


    function handleKeyDown(e,index) {
        if (e.key === 'ArrowUp')
        {
            e.target.textContent = Number(e.target.textContent) + 1       
            handleInputChange(e, index)
            e.target.classList.toggle('adjust')
        }            
        else if (e.key === 'ArrowDown')
        {
            e.target.textContent = Number(e.target.textContent) - 1
            handleInputChange(e, index)
            e.target.classList.toggle('adjust')
        }

        if (isNaN(Number(e.key)) && !(e.key === 'Backspace' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Delete')) // only accept numbers and select keys
        {
            e.preventDefault()
            console.log('prevented')
            return
        }
        
    }

    function handleKeyUp(e) {
        e.target.classList.remove('adjust')
        e.preventDefault()
    }

    function handleAddSubgroup(index) {
        Tracker.addSubgroup(index)
    }

    function handleAddItem()
    {
        Tracker.addItem(props.index)
    }

</script>
<template>
    <ul class='list'>
        <li v-for="item, index in items" class="list_item" :style="props.index == null && {'--hue': index * 45}">
            <span class="list_item_label" :index="index">Count
                <span class="count" contenteditable="true" :placeholder="item" @input="e => handleInputChange(e, index)" 
                    @keydown="e => handleKeyDown(e,index)" @keyup="handleKeyUp" @paste="e => e.preventDefault()">{{ item.count }}
                </span>
            </span>
            <List v-if="Object.hasOwn(item, 'children')" :data="item.children" :index="index"></List>
            <button class='add_subgroup_btn' v-else-if="!isNested" @click="() => handleAddSubgroup(index)">ADD SUBGROUP</button>
        </li>
        <button class='add_item_btn' :style="!isNested && {'--hue': groupCount * 45}" @click="handleAddItem">+</button>
    </ul>
</template>

<style>
.list {
    border: 1px solid black;
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    padding: 10px;
    list-style: none;
    gap: 1rem;
}

.list_item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.list_item_label {
    display: flex;
    align-items: center;
    gap: .5rem;
    padding: .5rem;
}

.list_item_label::before {
    content: '';
    height: .8rem;
    aspect-ratio: 1 / 1;
    background-color: hsl(var(--hue) 100% 80%);
    display: inline-block;
} 

.count {
    min-width: 2.2rem;
    margin-left: auto;
    background-color: #eee;
    padding: .2rem;
    border-radius: .2rem;
    font-weight: bold;    
    padding: .5rem;
    transition: transform 25ms linear 0ms;
    text-align: center;
}

.count.adjust {
    transform: scale(1.1);
}

.count:focus {
    outline: none;
}

.add_subgroup_btn {
    border: none;
    padding: .5rem;
    font-weight: bold;
    background-color: hsl(var(--hue) 100% 80%);
    border-radius: .2rem;
    cursor: pointer;
    width: min-content;
}

.list .list {
    width: fit-content;
    border: none;
    border-radius: .5rem;
    background-color: hsl(var(--hue) 100% 80%);
    flex-direction: column;
    gap: .5rem;
}

.list .list .count {
    background-color: hsl(var(--hue) 90% 70%);
}

.list .list .list_item_label::before {
    content: none;
}

.add_item_btn {
    border: none;
    font-weight: bold;
    border-radius: .5rem;
    cursor: pointer;
    height: fit-content;
    background-color: hsl(var(--hue) 100% 80%);
    aspect-ratio: 1 / 1;
    font-size: 1.5rem;
    color: #fff;
    width: 2rem;
}

.list .list .add_item_btn {
    border-radius: .2rem;
    background-color: hsl(var(--hue) 80% 90%);
    aspect-ratio: unset;
    font-size: 1rem;
    color: #000;
    width: auto;
}
</style>