<script setup> //TODO live change animations when data changes
    import {computed, ref} from 'vue'

    const props = defineProps({
        data: {
            type: Array,
        },
        gap: {
            type: Number,
            default: 0
        },
        width: {
            type: Number,
            default: 40
        },
        isInnerBar: {
            type: Boolean,
            default: false
        },
        transitionBar: {
            type: Object
        },
        outerWidth: {
            type: Number,
            default: 0
        },
        arcLength: {
            type: Number,
            default: 2
        },
        fluid: {
            type: Boolean,
            default: true
        }
    })

    const containerRef = ref(null)
    const drawInnerBar = ref(false)
    const closingInner = ref(false)
    const transitionDuration = 2000
    const fluidEnabled = computed(() => props.fluid && props.width < 100)
    let isFirstLoad= true
    let mouseOutsideGraph = true;

    const dropCurves = ref([])    

    let innerBarData, transitionBar
    let mousespeed = {x: 0, y: 0}

    const viewPortWidth = 440
    const animationLength = 2000
    const [radius, centerY, centerX] = [100, viewPortWidth / 2, viewPortWidth / 2]
    const colorJump = props.isInnerBar ? 7 : 45

    let hueOffset = props.isInnerBar === true ? props.transitionBar.hue : 0

    const endPoints = computed(() => createSegments(props.data, props.gap))

    function createSegments(data, gap, arcLength = 2) // [ sx/y: startx/y, ex/y: endx/y => for individual arcs ]
    { 
        let currentCount = 0
        let sum = 0
        let endpoints = []
        let scaleFactor = (arcLength - 0.0000001) * Math.PI
        let startRotation, rotation
        let segmentData = {}

        data = data.map(e => {
                sum += e.count;
            return e.count
        })

        console.log(data)
        gap = (gap / 360) * data.length
        let excess = sum * gap
        sum += excess
        gap = ((excess / sum) * scaleFactor) / data.length
        let angulardata = data.map(e => (e / sum) * scaleFactor) // convert absolute counts to arc lengths

        angulardata.forEach((e,i) => {
            startRotation = currentCount + gap / 2
            rotation = startRotation + e
            currentCount += e + gap

            segmentData = {   
                sr: startRotation,
                er: rotation,
                sx: Math.cos(startRotation) * radius + centerY,
                sy: Math.sin(startRotation) * radius + centerX,
                ex: Math.cos(rotation) * radius + centerY,
                ey: Math.sin(rotation) * radius + centerX,
                longFlag: (rotation - startRotation) > Math.PI ? 1 : 0,
                count: data[i]
            }

            segmentData.cr = segmentData.sr + Math.abs(((segmentData.er - segmentData.sr) / 2 ))
            segmentData.cy = Math.sin(segmentData.cr) * radius + centerX
            segmentData.cx = Math.cos(segmentData.cr) * radius + centerY
            segmentData.length = Math.PI * 2 * radius - Math.abs(((Math.PI * 2 - (segmentData.er - segmentData.sr))) * radius)
                                     
            segmentData.animationData = {
                strokeLength: radius * (segmentData.er - segmentData.sr),
                animationDelay: props.isInnerBar ? 0 : animationLength * (segmentData.sr) / (Math.PI * 2),
                animationDuration: props.isInnerBar ? 0 : animationLength * (segmentData.er - segmentData.sr) / (Math.PI * 2)
            }

            segmentData.loadAnimationStyle = {
                '--stroke-length': `${segmentData.animationData.strokeLength}px`,
                '--load_animation-delay': `${isFirstLoad ? segmentData.animationData.animationDelay : 0}ms`, '--load_animation-duration': `${segmentData.animationData.animationDuration}ms`,
                '--load_stroke-dasharray': `0 ${segmentData.animationData.strokeLength}px ${segmentData.animationData.strokeLength}px 0`
            }
            endpoints.push(segmentData)
            dropCurves.value[i] = {status: 'none', highlight: false}
        })

        isFirstLoad = false        
        return endpoints
    }

    function handleSectionClick(index) {
        if (Object.hasOwn(props.data[index], 'children')) // if the segment contains children data then reveal the inner graph
        {
            innerBarData = props.data[index].children
            drawInnerBar.value = true
            transitionBar = {   
                sy: endPoints.value[index].cy,
                sx: endPoints.value[index].cx,
                ex: Math.cos(endPoints.value[index].cr + Math.PI) * radius + centerX,
                ey: Math.sin(endPoints.value[index].cr + Math.PI) * radius + centerY,
                offsetX: Math.cos(endPoints.value[index].cr + Math.PI + 0.005) * radius + centerX, //offset required to prevent pixelperfect gap on meet end
                offsetY: Math.sin(endPoints.value[index].cr + Math.PI + 0.005) * radius + centerY,
                hue: index * colorJump,
                extraLength: Math.abs(endPoints.value[index].cr - endPoints.value[index].sr) * radius,
                }
            transitionBar.styleA = {stroke: `hsl(${transitionBar.hue}, 100%, 80%)`,
            '--transitionGap': `${transitionBar.extraLength}px`, '--transitionDuration': `${transitionDuration}ms`,
            d: `path('M ${transitionBar.sx} ${transitionBar.sy} A 100,100 0 1 0 ${transitionBar.ex} ${transitionBar.ey}')`}

            transitionBar.styleB = {stroke: `hsl(${transitionBar.hue}, 100%, 80%)`,
            '--transitionGap': `${transitionBar.extraLength}px`, '--transitionDuration': `${transitionDuration}ms`,
            d: `path('M ${transitionBar.sx} ${transitionBar.sy} A 100,100 0 1 1 ${transitionBar.offsetX} ${transitionBar.offsetY}')`}

            setTimeout(() => {
                closingInner.value = true
                setTimeout(() => {
                    drawInnerBar.value = false
                    closingInner.value = false
                }, 2300)
            }, 6000)
        }      
    }

    /* attemps to create a waterdrop / squeeze effect when leaving and entering the circle, by placing a bezier curve approximating the circle
    and then adjusting the control points out / in and filling the shape with either the graph or background color => NOT YET GRABBED from the component !TODO!
    */
    function handleMouseOverSector(e,index) {
        if(fluidEnabled.value && dropCurves.value[index].status === 'none' && mouseOutsideGraph)
        {
            let distanceBetweenTwoPoints = (x1,y1,x2,y2) => {
                let x = Math.sqrt((x1-x2) * (x1-x2) + (y1-y2) * (y1-y2))
                return x
            }

            let scaleFactor = props.outerWidth > 0 ? props.outerWidth / viewPortWidth : containerRef.value.getBoundingClientRect().width / viewPortWidth; //mouseEvents are not scaled to the viewport hence scalefactor

            let relCursorX = e.offsetX - (220 * scaleFactor)
            let relCursorY = -1 * (e.offsetY - (220 * scaleFactor))
            let attackAngle = (Math.atan2(relCursorX, relCursorY) + (Math.PI / 2) * 3) % (Math.PI * 2) // angle of the mouse in the circle
            let mouseSpeedFactor = 6;
            const centerMarginRad = 0.15            
            let startAngle = attackAngle - Math.PI / 4 // max angle only pi / 2 otherwise the curve approximation fails !!
            let endAngle = attackAngle + Math.PI / 4
            let baseRadius = 100 + props.width / 2
            
            let outsideCircle = distanceBetweenTwoPoints(relCursorX, relCursorY, 0,0) > 100 * scaleFactor
            let aliasingOffset = outsideCircle ? 0.5 : -0.5 // shift the curve in / out to avoid aliasing issues
            
            
            let radius = baseRadius + aliasingOffset // radius of the outer edge
            
            startAngle = startAngle < endPoints.value[index].sr ? endPoints.value[index].sr : startAngle
            endAngle = endAngle < endPoints.value[index].er ? endAngle : endPoints.value[index].er

            if (endAngle < startAngle)
                endAngle = Math.PI * 2
            
            const DISTANCE = (4/3)*Math.tan(Math.PI/(2 * (Math.PI * 2 /(endAngle - startAngle)))); // distance of the control points of the curve to approximate a circular arc with a bezier
            
            let startY = Math.sin(startAngle) * radius + centerY
            let startX = Math.cos(startAngle) * radius + centerX

            let endX = Math.cos(endAngle) * radius + centerX
            let endY = Math.sin(endAngle) * radius + centerY
            
            let CCP = { //Curve Control Points
                x1: startX - Math.cos(Math.PI / 2 - startAngle) * radius * DISTANCE,
                x2: endX + Math.cos(Math.PI / 2 - endAngle) * radius * DISTANCE,
                y1: startY + Math.sin(Math.PI / 2 - startAngle) * radius * DISTANCE,
                y2: endY - Math.sin(Math.PI / 2 - endAngle) * radius * DISTANCE, 
            }
            
            let path = `M ${startX} ${startY} C ${CCP.x1} ${CCP.y1} ${CCP.x2} ${CCP.y2} ${endX} ${endY}` 
            let constantCurve = `C ${CCP.x2} ${CCP.y2} ${CCP.x1} ${CCP.y1} ${startX} ${startY}` // mirrored default path so the shape is closed and can be filled

            let defaultPath = path + constantCurve //default shape mirroring circle

            let angleDistanceFromCenter = Math.abs((endAngle - (endAngle - startAngle) / 2) - attackAngle)
            let minimumOffset = 20

            if (angleDistanceFromCenter < centerMarginRad) // near the center both control points are adjusted, hence the distance is lowered
                mouseSpeedFactor *= 0.5

            let distanceToFirst = distanceBetweenTwoPoints(CCP.x1,CCP.y1,e.offsetX / scaleFactor, e.offsetY / scaleFactor)
            let distanceToSecond = distanceBetweenTwoPoints(CCP.x2,CCP.y2,e.offsetX / scaleFactor,e.offsetY / scaleFactor)
            let offsetX = Math.cos(attackAngle) * (radius + minimumOffset + Math.abs(mousespeed.x) * mouseSpeedFactor) + centerX
            let offsetY = Math.sin(attackAngle) * (radius + minimumOffset + Math.abs(mousespeed.y) * mouseSpeedFactor) + centerY
                
            if (outsideCircle)
            {   
                let midAngle = distanceToFirst < distanceToSecond ? Math.abs(endAngle - 3 * ((endAngle - startAngle) / 4)) : Math.abs(endAngle - (endAngle - startAngle) / 4)

                offsetX = Math.cos(midAngle) * radius + centerX
                offsetY = Math.sin(midAngle) * radius + centerY
            }

            if (Math.abs((endAngle - (endAngle - startAngle) / 2) - attackAngle) < centerMarginRad && !outsideCircle)
            {
                CCP.x1 = offsetX
                CCP.y1 = offsetY
                CCP.x2 = offsetX
                CCP.y2 = offsetY
            }
            else if (distanceToFirst < distanceToSecond)
            {
                CCP.x1 = offsetX
                CCP.y1 = offsetY
            }
            else {
                CCP.x2 = offsetX
                CCP.y2 = offsetY
            }
            
            
            
            path = `M ${startX} ${startY} C ${CCP.x1} ${CCP.y1} ${CCP.x2} ${CCP.y2} ${endX} ${endY}`
            
            let peakPath = path + constantCurve // peak of the drop to be transitioned to
            
            dropCurves.value[index + ''] = {
                style: {
                    '--defaultPath': `'${defaultPath}'`, '--peakPath': `'${peakPath}'`
                },
                status: outsideCircle ? 'entering' : 'leaving' // entering for movement in, leaving for movement out
            }

            setTimeout(() => {
                dropCurves.value[index].status = 'none' // wait for animation to finish before reset
            }, 400)
        }
    }

    function handleMouseLeaveSector(e, index) {
        dropCurves.value[index].highlight = false

        mouseOutsideGraph = !(e.relatedTarget.classList.contains('insideDetectorCircle') || e.relatedTarget.classList.contains('piebar__segment'))
        console.log(e)
    }
    
    window.addEventListener('mousemove', (e) => {
        mousespeed = { x: e.movementX, y: e.movementY }
    }    
    )

    console.log(props.data)
    
</script>

<template>
    <svg class='piebar' :class="{hasInner: drawInnerBar}" ref="containerRef" :viewBox="`0 0 ${viewPortWidth} ${viewPortWidth}`"
        :style="{'--transitionDuration': `${transitionDuration}ms`,  '--graphWidth': `${width}px`, '--background': '#fff'}">
        <g>
            <circle class="insideDetectorCircle" :cx="centerX" :cy="centerY" :r="radius" fill="none" :stroke-width="width - 1" stroke="red"></circle>
        </g>
        <TransitionGroup appear name="segment-grow">
         <g v-for="(point, index) in endPoints" @click="() => handleSectionClick(index)" :key="`${index}`" :style="point.loadAnimationStyle">
                <path class="piebar__segment" :class="{drooping: dropCurves[index].status != 'none'}" @mouseover="(e) => handleMouseOverSector(e, index)" 
                    :d="`M ${point.sx} ${point.sy} A 100,100 0 ${point.longFlag} 1 ${point.ex} ${point.ey}`" @mouseleave="e => handleMouseLeaveSector(e,index)" 
                    :style="{ '--hue': `${index * colorJump + hueOffset}` }"></path>
                    <path class="dropEffectCurve" :class="{leaving: dropCurves[index].status === 'leaving', entering: dropCurves[index].status === 'entering'}"
                    :style="{ '--hue': `${index * colorJump + hueOffset}`, ...dropCurves[index].style}" @mouseleave="e => e.stopPropagation()">
                </path>
            </g>
        </TransitionGroup>
        <PieBar class='innerBar' :class="{closing: closingInner}" v-if="drawInnerBar" :data="innerBarData" :transition-bar="transitionBar" :is-inner-bar="true" :gap="props.gap"
            :style="{'--transitionDuration': `${transitionDuration}ms`}" :width="props.width" :outer-width="containerRef.getBoundingClientRect().width"></PieBar>
        <path v-if="drawInnerBar" class='transitionBar' :class="{closing: closingInner}" :style="transitionBar.styleA"></path>
        <path v-if="drawInnerBar" class="transitionBar" :class="{closing: closingInner}" :style="transitionBar.styleB"></path>
    </svg>
</template>

<style scoped>
.insideDetectorCircle {
    stroke: var(--background);
}

.dropEffectCurve.leaving {
    d: path(var(--defaultPath));
    fill: hsl(var(--hue) 100% 80%);
    animation: 200ms ease-in-out 2 alternate pushthrough;
}

.dropEffectCurve.entering {    
    d: path(var(--defaultPath));
    fill: var(--background);
    animation: 200ms ease-in-out 2 alternate pushthrough;
}

@keyframes pushthrough {
    to {
        d: path(var(--peakPath));
    }
}

.piebar {
    fill: none;
    stroke-width: var(--graphWidth);
    background-color: var(--background);
}

@keyframes open {
    to {
        stroke-dashoffset: -630px;
    }
}

.piebar__segment {
    position: relative;
    stroke: hsl(var(--hue) 100% 80%);
    transition: stroke-width 500ms ease 50ms, filter 500ms ease 50ms;
    filter: drop-shadow(0 0 2px transparent) drop-shadow(0 0 2px transparent);
}

.segment-grow-enter-from {
    stroke-dasharray: var(--load_stroke-dasharray);
    stroke-dashoffset: 0px;
}

.segment-grow-enter-active {
    stroke-dasharray: var(--load_stroke-dasharray);
    transition: stroke-dashoffset var(--load_animation-duration) linear var(--load_animation-delay);
}

.segment-grow-enter-to {
    stroke-dashoffset: calc(var(--stroke-length) * -1)
}


.piebar__segment:hover:not(.drooping)  {
    stroke-width: min(calc(var(--graphWidth) * 1.05), 200px);
    filter: drop-shadow(0 0 2px hsl(var(--hue) 50% 50%)) drop-shadow(0 0 2px hsl(var(--hue) 50% 50%));
}

.piebar g::after { 
    content: 'hi hello'
}


.piebar__segment::after {
    content: 'hi hello';
}

.innerBar .piebar__segment {
    stroke: hsl(var(--hue) 90% 80%);
}


.innerBar {
    animation: 1ms linear calc(var(--transitionDuration) / 2) appear;
    opacity: 0;
    animation-fill-mode: forwards;
    width: 100%;
}

.innerBar.closing {
    animation: 100ms ease-in-out calc(var(--transitionDuration) / 2) disappear;
    opacity: 1;
    animation-fill-mode: forwards;
}

.hasInner > g {
    animation: 1ms linear calc(var(--transitionDuration) / 2) disappear;
    animation-fill-mode: forwards;
}

.piebar:has(.transitionBar.closing) > g {
    animation: 50ms linear 1000ms appear;
    opacity: 0;
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
    animation: var(--transitionDuration) ease-in-out 0ms reveal, 10ms linear calc(var(--transitionDuration)) disappear;
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
        stroke-dashoffset: calc(var(--length) * -1)
    }
}

@keyframes pulse {
    from {
        
        stroke: var(--graphWidth);
    }

    50% {
        stroke: calc(var(--graphWidth) * 1.2);
    }

    to {        
        stroke: var(--graphWidth)
    }
}

</style>