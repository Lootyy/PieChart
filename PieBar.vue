<script setup> //TODO live changes when data changes
    import {computed, ref} from 'vue'

    const props = defineProps({
        data: {
            type: Array
        },
        gap: {
            default: 0
        },
        width: {
            default: 40
        },
        isInnerBar: {
            type: Boolean,
            default: false
        },
        transitionBar: {
            type: Object
        },
    }) // data should be array of absolute values of group entities

    const piebar = ref(null)
    const drawInnerBar = ref(false)
    const closingInner = ref(false)
    const transitionDuration = 2000

    let innerBarData, transitionBar

    const viewPortWidth = 440
    const animationLength = 2000
    const [radius, centerY, centerX] = [100, 220, 220]
    const colorJump = props.isInnerBar ? 7 : 45

    let hueOffset = props.isInnerBar === true ? props.transitionBar.hue : 0

    const insideData = (function() {
        let data = {}
        let removed = 0
        props.data.forEach((e,i) => {
            if (Array.isArray(e))
            {
                console.log(e)
                data[i - removed + ''] = e
                removed++
            }
        }
        )    
        return data
    })();


    const endPoints = computed(() => calculateBars(props.data, props.gap))


    function calculateBars(data, gap) // [ sx/y: startx/y, ex/y: endx/y => for individual lines ]
    { 
        let currentCount = 0
        let sum = 0
        let endpoints = []
        let scaleFactor = (2 - 0.0000001) * Math.PI
        let startRotation, rotation
        let curveData = {}
        data = data.filter(e => !Array.isArray(e))
        data.map(e => {
            sum += e
        })
        data.forEach(e => {
            startRotation = (currentCount + (sum / radius) * gap) / sum * scaleFactor
            let srNoDelay = currentCount / sum * scaleFactor
            currentCount += e
            rotation = (currentCount / sum) * scaleFactor
            curveData = {   
                sr: startRotation,
                srNoDelay: srNoDelay, // gap is created at the start of an existing stroke, no delay *skips* time animating in the gap
                er: rotation,
                sx: Math.cos(startRotation) * radius + centerY,
                sy: Math.sin(startRotation) * radius + centerX,
                ex: Math.cos(rotation) * radius + centerY,
                ey: Math.sin(rotation) * radius + centerX,
                longFlag: (rotation - startRotation) > Math.PI ? 1 : 0,
                gapOffset: radius * rotation,
            }

            curveData.cr = curveData.sr + Math.abs(((curveData.er - curveData.sr) / 2 ))
            curveData.cy = Math.sin(curveData.cr) * radius + centerX
            curveData.cx = Math.cos(curveData.cr) * radius + centerY
            curveData.length = Math.PI * 2 * radius - Math.abs(((Math.PI * 2 - (curveData.er - curveData.sr))) * radius)
                                     
            curveData.animationData = {
                            strokeLength: radius * (curveData.er - curveData.sr),
                            animationDelay: props.isInnerBar ? 0 : animationLength * curveData.srNoDelay / (Math.PI * 2),
                            animationDuration: props.isInnerBar ? 0 : animationLength * (curveData.er - curveData.srNoDelay) / (Math.PI * 2)
                        }
            endpoints.push(curveData)
        })
        return endpoints.reverse()
    }

    function handleSectionClick(index) {
        if (Object.hasOwn(insideData, index + ''))
        {
            innerBarData = insideData[index + '']
            drawInnerBar.value = true
            transitionBar = {   
                sy: endPoints.value[index].cy,
                sx: endPoints.value[index].cx,
                ex: Math.cos(endPoints.value[index].cr + Math.PI) * radius + centerY,
                ey: Math.sin(endPoints.value[index].cr + Math.PI) * radius + centerX,
                exOffset: Math.cos(endPoints.value[index].cr + Math.PI + 0.01) * radius + centerY,
                eyOffset: Math.sin(endPoints.value[index].cr + Math.PI + 0.01) * radius + centerX,
                hue: index * colorJump,
                extraLength: Math.abs(endPoints.value[index].cr - endPoints.value[index].sr) * radius
                }
            setTimeout(() => {
                closingInner.value = true
                setTimeout(() => {
                    drawInnerBar.value = false
                    closingInner.value = false
                }, 2300)
            }, 5000)
        }

      
    }

    console.log(endPoints.value)
    console.log(`hueoffset is ${hueOffset}`)

</script>
<template>
    <svg class='piebar' :class="{hasInner: drawInnerBar}" ref="piebar" :viewBox="`0 0 ${viewPortWidth} ${viewPortWidth}`"
     :style="{'--transitionDuration': `${transitionDuration}ms`,  '--graphWidth': `${props.width}px`}">
     <g v-for="(point, index) in endPoints" @click="() => handleSectionClick(index)" >
        <path class="piebar__curve" :d="`M ${point.sx} ${point.sy} A 100,100 0 ${point.longFlag} 1 ${point.ex} ${point.ey}`" 
        :style="{ '--hue': `${index * colorJump + hueOffset}`, '--length': `${point.animationData.strokeLength}`}">
            "</path>
        </g>
        <path class='opener' d="M 320 220 A 100,100 0 1 1 319.9999999 219.99989999999997"></path>
        <PieBar class='innerBar' :class="{closing: closingInner}" v-if="drawInnerBar" :data="innerBarData" :transition-bar="transitionBar" :is-inner-bar="true" :gap="props.gap"
        :style="{'--transitionDuration': `${transitionDuration}ms`}" :width="props.width"></PieBar>
        <path v-if="drawInnerBar" class='transitionBar' :class="{closing: closingInner}" :style="{stroke: `hsl(${transitionBar.hue}, 100%, 80%)`,
            '--transitionGap': `${transitionBar.extraLength}px`, '--transitionDuration': `${transitionDuration}ms`}"
            :d="`M ${transitionBar.sx} ${transitionBar.sy} A 100,100 0 1 1 ${transitionBar.exOffset} ${transitionBar.eyOffset}`"></path>
        <path v-if="drawInnerBar" class="transitionBar" :class="{closing: closingInner}" :style="{stroke: `hsl(${transitionBar.hue}, 100%, 80%)`,
            '--transitionGap': `${transitionBar.extraLength}px`, '--transitionDuration': `${transitionDuration}ms`}"
            :d="`M ${transitionBar.sx} ${transitionBar.sy} A 100,100 0 1 0 ${transitionBar.ex} ${transitionBar.ey}`"></path>
    </svg>
</template>
<style scoped>
:root {
}

.piebar {
    width: 400px;
    fill: none;
    transform: rotate(-90deg);
    stroke-width: var(--graphWidth);
}

.opener {
    stroke-dasharray: 630px;
    stroke-dashoffset: 0px;
    animation: 2000ms ease-in-out 0ms open;
    animation-fill-mode: forwards;
    stroke: white;
    stroke-width: 205px;
}

.piebar.hasInner .opener{
    opacity: 0;
}

@keyframes open {
    to {
        stroke-dashoffset: -630px;
    }
}

.piebar__curve:hover {
    stroke-width: min(calc(var(--graphWidth) * 1.2), 200px);
    filter: drop-shadow(0 0 2px hsl(var(--hue) 50% 50%)) drop-shadow(0 0 2px hsl(var(--hue) 50% 50%));
}

.piebar:has(.transitionBar.closing) > g {
    animation: 50ms linear 1000ms appear;
    opacity: 0;
    animation-fill-mode: forwards;
}

.piebar__curve {
    animation-fill-mode: forwards;
    animation-timing-function: linear;
    position: relative;
    stroke: hsl(var(--hue) 100% 80%);
    transition: stroke-width 500ms;
}

.piebar g::after { 
    content: 'hi hello'
}


.piebar__curve::after {
    content: 'hi hello';
}

.innerBar .piebar__curve {
    stroke: hsl(var(--hue) 90% 80%);
}


.innerBar {
    animation: 50ms linear calc(var(--transitionDuration) / 2 + 300ms) appear;
    opacity: 0;
    animation-fill-mode: forwards;
}

.innerBar.closing {
    animation: 10ms ease-in-out calc(var(--transitionDuration) / 2) disappear;
    opacity: 1;
    animation-fill-mode: forwards;
}

.hasInner > g {
    animation: 10ms linear calc(var(--transitionDuration) / 2 + 300ms) disappear;
    animation-fill-mode: forwards;
}

@keyframes appear {
    to {
        opacity: 1;
    }        
}

.transitionBar {
    stroke-dasharray: 314px;
    stroke-dashoffset: calc(314px - var(--transitionGap));
    animation: var(--transitionDuration) ease-in-out 300ms reveal, 10ms linear calc(var(--transitionDuration) + 300ms) disappear;
    animation-fill-mode: both;
    opacity: 1;
}

.transitionBar.closing {
    opacity: 1;
    animation: 2000ms ease-in-out 0s curtain;
}

@keyframes reveal {
    50% {
        stroke-dashoffset: 0;
    }  
    to  {
        stroke-dashoffset: -314px;
    }
}

@keyframes curtain {
    from {
        stroke-dashoffset: -314px;
    }

    50% {
        stroke-dashoffset: 0;
    }

    to {
        stroke-dashoffset: calc(314px - var(--transitionGap));
    }
}

@keyframes disappear {
    to {
        opacity: 0;
    }
}

@keyframes grow {
    to {
        stroke-dashoffset: 0px;
    }
}

</style>