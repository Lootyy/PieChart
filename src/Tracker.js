import { reactive } from 'vue'

export const Tracker = reactive({
    data: [],
    
    set(data)
    {
        this.data = data
    },

    update(index, val)
    {
        if (Array.isArray(index))
            this.data[index[0]].children[index[1]].count = val;
        else
            this.data[index].count = val;
    },

    addSubgroup(index)
    {
        this.data[index] = Object.assign({},this.data[index], {children:[{count:1},{count:1}]})
    },

    addItem(index)
    {
        if (index === null)
            this.data.push({count: 1})
        else 
            this.data[index].children.push({count: 1})
    }
})